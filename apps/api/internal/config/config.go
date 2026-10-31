// Package config loads 12-factor configuration from the environment.
package config

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Env         string
	LogLevel    string
	HTTPAddr    string
	MetricsAddr string

	DatabaseURL        string
	DatabaseReplicaURL string
	DBMaxConns         int32
	RedisURL           string

	JWTSecret  []byte
	AccessTTL  time.Duration
	RefreshTTL time.Duration

	AppURL       string // public web origin, e.g. https://codingfoding.dev
	APIURL       string // public API origin for OAuth callbacks
	CORSOrigins  []string
	CookieSecure bool
	TrustProxy   bool

	SMTPAddr, SMTPUser, SMTPPass, MailFrom string

	Judge0URL, Judge0Token string

	GoogleClientID, GoogleClientSecret string
	GitHubClientID, GitHubClientSecret string

	WorkerConcurrency int
	OTLPEndpoint      string
	SentryDSN         string
	Version           string
}

func (c *Config) IsProd() bool { return c.Env == "production" }

func Load() (*Config, error) {
	var errs []error
	req := func(k string) string {
		v := os.Getenv(k)
		if v == "" {
			errs = append(errs, fmt.Errorf("%s is required", k))
		}
		return v
	}
	c := &Config{
		Env:                get("APP_ENV", "development"),
		LogLevel:           get("LOG_LEVEL", "info"),
		HTTPAddr:           get("HTTP_ADDR", ":8080"),
		MetricsAddr:        get("METRICS_ADDR", ":9090"),
		DatabaseURL:        req("DATABASE_URL"),
		DatabaseReplicaURL: os.Getenv("DATABASE_REPLICA_URL"),
		DBMaxConns:         int32(getInt("DB_MAX_CONNS", 20, &errs)),
		RedisURL:           req("REDIS_URL"),
		JWTSecret:          []byte(req("JWT_SECRET")),
		AccessTTL:          getDuration("ACCESS_TOKEN_TTL", 15*time.Minute, &errs),
		RefreshTTL:         getDuration("REFRESH_TOKEN_TTL", 30*24*time.Hour, &errs),
		AppURL:             strings.TrimRight(get("APP_URL", "http://localhost:3000"), "/"),
		APIURL:             strings.TrimRight(get("API_PUBLIC_URL", "http://localhost:3000"), "/"),
		CORSOrigins:        splitList(get("CORS_ORIGINS", "http://localhost:3000")),
		TrustProxy:         getBool("TRUST_PROXY", false),
		SMTPAddr:           get("SMTP_ADDR", "localhost:1025"),
		SMTPUser:           os.Getenv("SMTP_USER"),
		SMTPPass:           os.Getenv("SMTP_PASS"),
		MailFrom:           get("MAIL_FROM", "Coding Foding <no-reply@codingfoding.dev>"),
		Judge0URL:          os.Getenv("JUDGE0_URL"),
		Judge0Token:        os.Getenv("JUDGE0_TOKEN"),
		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GitHubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		GitHubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
		WorkerConcurrency:  getInt("WORKER_CONCURRENCY", 10, &errs),
		OTLPEndpoint:       os.Getenv("OTEL_EXPORTER_OTLP_ENDPOINT"),
		SentryDSN:          os.Getenv("SENTRY_DSN"),
		Version:            get("APP_VERSION", "dev"),
	}
	c.CookieSecure = getBool("COOKIE_SECURE", c.IsProd())
	if len(c.JWTSecret) > 0 && len(c.JWTSecret) < 32 {
		errs = append(errs, errors.New("JWT_SECRET must be at least 32 bytes"))
	}
	if c.IsProd() && !c.CookieSecure {
		errs = append(errs, errors.New("COOKIE_SECURE must be true in production"))
	}
	if c.WorkerConcurrency < 1 || c.WorkerConcurrency > 256 {
		errs = append(errs, errors.New("WORKER_CONCURRENCY must be 1–256"))
	}
	if len(errs) > 0 {
		return nil, fmt.Errorf("config: %w", errors.Join(errs...))
	}
	return c, nil
}

func get(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func getInt(k string, def int, errs *[]error) int {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		*errs = append(*errs, fmt.Errorf("%s: %w", k, err))
	}
	return n
}

func getBool(k string, def bool) bool {
	v, err := strconv.ParseBool(os.Getenv(k))
	if err != nil {
		return def
	}
	return v
}

func getDuration(k string, def time.Duration, errs *[]error) time.Duration {
	v := os.Getenv(k)
	if v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		*errs = append(*errs, fmt.Errorf("%s: %w", k, err))
	}
	return d
}

func splitList(s string) []string {
	var out []string
	for _, p := range strings.Split(s, ",") {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}
