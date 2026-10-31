package security

import (
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

var fastParams = Argon2Params{Memory: 8 * 1024, Iterations: 1, Parallelism: 1, SaltLength: 16, KeyLength: 32}

func TestPasswordHasher(t *testing.T) {
	h := NewPasswordHasher(fastParams)
	enc, err := h.Hash("correct horse battery staple")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(enc, "$argon2id$v=19$m=8192,t=1,p=1$") {
		t.Fatalf("unexpected encoding %q", enc)
	}
	tests := []struct {
		name     string
		password string
		hash     string
		want     bool
		wantErr  bool
	}{
		{"correct", "correct horse battery staple", enc, true, false},
		{"wrong", "Correct horse battery staple", enc, false, false},
		{"empty", "", enc, false, false},
		{"garbage hash", "x", "not-a-hash", false, true},
		{"wrong algo", "x", "$argon2i$v=19$m=1,t=1,p=1$AA$AA", false, true},
	}
	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			ok, err := h.Verify(tc.password, tc.hash)
			if (err != nil) != tc.wantErr {
				t.Fatalf("err = %v, wantErr %v", err, tc.wantErr)
			}
			if ok != tc.want {
				t.Fatalf("ok = %v, want %v", ok, tc.want)
			}
		})
	}
	other, _ := h.Hash("correct horse battery staple")
	if other == enc {
		t.Fatal("hashes must be salted")
	}
}

func TestJWTIssuer(t *testing.T) {
	now := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := func() time.Time { return now }
	secret := []byte(strings.Repeat("k", 32))
	j, err := NewJWTIssuer(secret, "cf", "cf-web", 15*time.Minute, clock)
	if err != nil {
		t.Fatal(err)
	}
	uid := uuid.Must(uuid.NewV7())
	tok, exp, err := j.Issue(uid, "senior")
	if err != nil {
		t.Fatal(err)
	}
	if !exp.Equal(now.Add(15 * time.Minute)) {
		t.Fatalf("exp = %v", exp)
	}

	gotID, role, err := j.Parse(tok)
	if err != nil || gotID != uid || role != "senior" {
		t.Fatalf("parse = %v %v %v", gotID, role, err)
	}

	t.Run("tampered", func(t *testing.T) {
		if _, _, err := j.Parse(tok[:len(tok)-2] + "xx"); err == nil {
			t.Fatal("expected error")
		}
	})
	t.Run("other secret", func(t *testing.T) {
		j2, _ := NewJWTIssuer([]byte(strings.Repeat("z", 32)), "cf", "cf-web", time.Minute, clock)
		if _, _, err := j2.Parse(tok); err == nil {
			t.Fatal("expected error")
		}
	})
	t.Run("expired", func(t *testing.T) {
		later, _ := NewJWTIssuer(secret, "cf", "cf-web", time.Minute, func() time.Time { return now.Add(16 * time.Minute) })
		if _, _, err := later.Parse(tok); err == nil {
			t.Fatal("expected expiry error")
		}
	})
	t.Run("short secret", func(t *testing.T) {
		if _, err := NewJWTIssuer([]byte("short"), "cf", "cf-web", time.Minute, nil); err == nil {
			t.Fatal("expected error")
		}
	})
}

func TestOpaqueToken(t *testing.T) {
	raw, digest, err := NewOpaqueToken()
	if err != nil {
		t.Fatal(err)
	}
	if len(raw) < 40 || len(digest) != 32 {
		t.Fatalf("raw=%d digest=%d", len(raw), len(digest))
	}
	if string(HashToken(raw)) != string(digest) {
		t.Fatal("digest mismatch")
	}
}
