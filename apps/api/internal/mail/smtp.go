// Package mail sends transactional email over SMTP (Mailpit locally, SES/Postmark in prod).
package mail

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"mime"
	"mime/multipart"
	"net"
	"net/smtp"
	"net/textproto"
	"strings"
	"time"

	"github.com/codingfoding/api/internal/domain"
)

type SMTPConfig struct {
	Addr     string // host:port
	Username string
	Password string
	From     string
}

type SMTP struct {
	cfg SMTPConfig
	log *slog.Logger
}

func NewSMTP(cfg SMTPConfig, log *slog.Logger) *SMTP { return &SMTP{cfg: cfg, log: log} }

func (m *SMTP) Send(ctx context.Context, e domain.Email) error {
	if strings.ContainsAny(e.To, "\r\n") || strings.ContainsAny(e.Subject, "\r\n") {
		return fmt.Errorf("mail: header injection attempt")
	}
	msg, err := build(m.cfg.From, e)
	if err != nil {
		return err
	}
	host, _, err := net.SplitHostPort(m.cfg.Addr)
	if err != nil {
		return fmt.Errorf("mail: addr: %w", err)
	}
	var auth smtp.Auth
	if m.cfg.Username != "" {
		auth = smtp.PlainAuth("", m.cfg.Username, m.cfg.Password, host)
	}
	done := make(chan error, 1)
	go func() { done <- smtp.SendMail(m.cfg.Addr, auth, extractAddr(m.cfg.From), []string{e.To}, msg) }()
	select {
	case err := <-done:
		if err != nil {
			return fmt.Errorf("mail: send: %w", err)
		}
		m.log.InfoContext(ctx, "email sent", "subject", e.Subject) // never log recipient bodies/tokens
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func extractAddr(from string) string {
	if i := strings.LastIndex(from, "<"); i >= 0 {
		return strings.TrimSuffix(from[i+1:], ">")
	}
	return from
}

func build(from string, e domain.Email) ([]byte, error) {
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	for _, part := range []struct{ ct, content string }{{"text/plain", e.Text}, {"text/html", e.HTML}} {
		pw, err := w.CreatePart(textproto.MIMEHeader{
			"Content-Type":              {part.ct + "; charset=UTF-8"},
			"Content-Transfer-Encoding": {"8bit"},
		})
		if err != nil {
			return nil, err
		}
		if _, err := pw.Write([]byte(part.content)); err != nil {
			return nil, err
		}
	}
	if err := w.Close(); err != nil {
		return nil, err
	}
	idb := make([]byte, 12)
	_, _ = rand.Read(idb)
	var msg bytes.Buffer
	fmt.Fprintf(&msg, "From: %s\r\n", from)
	fmt.Fprintf(&msg, "To: %s\r\n", e.To)
	fmt.Fprintf(&msg, "Subject: %s\r\n", mime.QEncoding.Encode("utf-8", e.Subject))
	fmt.Fprintf(&msg, "Date: %s\r\n", time.Now().Format(time.RFC1123Z))
	fmt.Fprintf(&msg, "Message-ID: <%s@codingfoding>\r\n", hex.EncodeToString(idb))
	fmt.Fprintf(&msg, "MIME-Version: 1.0\r\n")
	fmt.Fprintf(&msg, "Content-Type: multipart/alternative; boundary=%s\r\n\r\n", w.Boundary())
	msg.Write(body.Bytes())
	return msg.Bytes(), nil
}
