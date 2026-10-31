package security

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var ErrInvalidToken = errors.New("security: invalid token")

type AccessClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

// JWTIssuer signs short-lived access tokens with HS256. The API is the only
// issuer and verifier, so a symmetric key is sufficient and avoids key distribution.
type JWTIssuer struct {
	secret   []byte
	issuer   string
	audience string
	ttl      time.Duration
	now      func() time.Time
}

func NewJWTIssuer(secret []byte, issuer, audience string, ttl time.Duration, now func() time.Time) (*JWTIssuer, error) {
	if len(secret) < 32 {
		return nil, errors.New("security: JWT secret must be at least 32 bytes")
	}
	if now == nil {
		now = time.Now
	}
	return &JWTIssuer{secret: secret, issuer: issuer, audience: audience, ttl: ttl, now: now}, nil
}

func (j *JWTIssuer) Issue(userID uuid.UUID, role string) (string, time.Time, error) {
	now := j.now()
	exp := now.Add(j.ttl)
	claims := AccessClaims{
		Role: role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID.String(),
			Issuer:    j.issuer,
			Audience:  jwt.ClaimStrings{j.audience},
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(exp),
			ID:        uuid.NewString(),
		},
	}
	s, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(j.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("security: sign jwt: %w", err)
	}
	return s, exp, nil
}

func (j *JWTIssuer) Parse(token string) (uuid.UUID, string, error) {
	var claims AccessClaims
	_, err := jwt.ParseWithClaims(token, &claims, func(*jwt.Token) (any, error) { return j.secret, nil },
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithIssuer(j.issuer),
		jwt.WithAudience(j.audience),
		jwt.WithExpirationRequired(),
		jwt.WithTimeFunc(j.now),
	)
	if err != nil {
		return uuid.Nil, "", fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}
	id, err := uuid.Parse(claims.Subject)
	if err != nil {
		return uuid.Nil, "", ErrInvalidToken
	}
	return id, claims.Role, nil
}
