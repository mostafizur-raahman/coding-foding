package service

import (
	"bytes"
	"html/template"
	"strings"

	"github.com/codingfoding/api/internal/domain"
)

type emailCopy struct {
	Subject, Heading, Body, CTA, Footer string
}

// bn copy follows the "developer Bangla" style: Bangla sentences, English tech terms.
var emailCopies = map[string]map[domain.Locale]emailCopy{
	"verify": {
		domain.LocaleEN: {"Verify your Coding Foding email", "Welcome aboard, {{.Name}} 👋",
			"Confirm your email to start your journey. This link expires in 24 hours.", "Verify email",
			"If you didn't create an account, you can ignore this email."},
		domain.LocaleBN: {"তোমার Coding Foding email verify করো", "স্বাগতম, {{.Name}} 👋",
			"Journey শুরু করার আগে email টা confirm করে নাও। এই link 24 ঘণ্টা পর expire হয়ে যাবে।", "Email verify করো",
			"Account তুমি না খুলে থাকলে এই email ignore করো।"},
	},
	"reset": {
		domain.LocaleEN: {"Reset your Coding Foding password", "Password reset requested",
			"Someone (hopefully you) asked to reset your password. This link expires in 30 minutes and signs out all devices.", "Reset password",
			"If this wasn't you, ignore this email — your password stays the same."},
		domain.LocaleBN: {"Coding Foding password reset করো", "Password reset এর request এসেছে",
			"কেউ (আশা করি তুমি) password reset করতে চেয়েছে। Link টা 30 মিনিট valid থাকবে, আর reset করলে সব device থেকে logout হয়ে যাবে।", "Password reset করো",
			"এটা তুমি না হলে email টা ignore করো, password আগের মতোই থাকবে।"},
	},
}

var emailLayout = template.Must(template.New("email").Parse(`<!doctype html>
<html lang="{{.Lang}}"><body style="margin:0;background:#0E0F1A;font-family:Inter,'Hind Siliguri',Arial,sans-serif;color:#E8E9F3">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#161827;border-radius:16px;padding:32px">
<tr><td style="font-size:20px;font-weight:700">coding<span style="color:#00D4A6">foding</span></td></tr>
<tr><td style="padding-top:24px;font-size:22px;font-weight:700">{{.Heading}}</td></tr>
<tr><td style="padding-top:12px;font-size:15px;line-height:1.75;color:#B4B7C9">{{.Body}}</td></tr>
<tr><td style="padding-top:28px"><a href="{{.Link}}" style="display:inline-block;background:linear-gradient(90deg,#7C5CFF,#00D4A6);color:#0E0F1A;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">{{.CTA}}</a></td></tr>
<tr><td style="padding-top:28px;font-size:12px;color:#6B6F80">{{.Footer}}</td></tr>
</table></td></tr></table></body></html>`))

func renderEmail(kind string, u *domain.User, link string) domain.Email {
	locale := u.PreferredLocale
	c, ok := emailCopies[kind][locale]
	if !ok {
		locale = domain.LocaleEN
		c = emailCopies[kind][locale]
	}
	// Plain substitution; the HTML layout escapes it exactly once.
	heading := strings.ReplaceAll(c.Heading, "{{.Name}}", u.DisplayName)
	var buf bytes.Buffer
	_ = emailLayout.Execute(&buf, map[string]string{
		"Lang": string(locale), "Heading": heading, "Body": c.Body, "CTA": c.CTA, "Footer": c.Footer, "Link": link,
	})
	return domain.Email{
		To:      u.Email,
		Subject: c.Subject,
		Text:    heading + "\n\n" + c.Body + "\n\n" + link + "\n\n" + c.Footer,
		HTML:    buf.String(),
	}
}

func verifyEmail(u *domain.User, link string) domain.Email { return renderEmail("verify", u, link) }
func resetEmail(u *domain.User, link string) domain.Email  { return renderEmail("reset", u, link) }
