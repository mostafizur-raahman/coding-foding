package postgres

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
)

type ChallengeRepo struct{ db *DB }

func NewChallengeRepo(db *DB) *ChallengeRepo { return &ChallengeRepo{db} }

func (r *ChallengeRepo) CountSince(ctx context.Context, email string, since time.Time) (int64, error) {
	n, err := r.db.w(ctx).CountRecentChallenges(ctx, sqlcdb.CountRecentChallengesParams{Email: email, CreatedAt: since})
	return n, mapErr(err)
}

func (r *ChallengeRepo) Create(ctx context.Context, id uuid.UUID, email string, mac []byte, expiresAt time.Time, ip string, now time.Time) error {
	return mapErr(r.db.w(ctx).CreateChallenge(ctx, sqlcdb.CreateChallengeParams{
		ID: id, Email: email, CodeMac: mac, ExpiresAt: expiresAt, Ip: parseIP(ip), CreatedAt: now,
	}))
}

func (r *ChallengeRepo) LatestOpenForUpdate(ctx context.Context, email string, now time.Time) (*domain.OpenChallenge, error) {
	c, err := r.db.w(ctx).LatestOpenChallengeForUpdate(ctx, sqlcdb.LatestOpenChallengeForUpdateParams{Email: email, ExpiresAt: now})
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.OpenChallenge{ID: c.ID, MAC: c.CodeMac, Attempts: c.Attempts}, nil
}

func (r *ChallengeRepo) BumpAttempts(ctx context.Context, id uuid.UUID) error {
	return mapErr(r.db.w(ctx).BumpChallengeAttempts(ctx, id))
}

func (r *ChallengeRepo) MarkVerified(ctx context.Context, id uuid.UUID, at time.Time, signupTokenHash []byte, signupExpiresAt *time.Time) error {
	return mapErr(r.db.w(ctx).MarkChallengeVerified(ctx, sqlcdb.MarkChallengeVerifiedParams{
		ID: id, VerifiedAt: &at, SignupTokenHash: signupTokenHash, SignupExpiresAt: signupExpiresAt,
	}))
}

func (r *ChallengeRepo) SignupForUpdate(ctx context.Context, tokenHash []byte, now time.Time) (uuid.UUID, string, error) {
	c, err := r.db.w(ctx).SignupChallengeForUpdate(ctx, sqlcdb.SignupChallengeForUpdateParams{SignupTokenHash: tokenHash, SignupExpiresAt: &now})
	if err != nil {
		return uuid.Nil, "", mapErr(err)
	}
	return c.ID, c.Email, nil
}

func (r *ChallengeRepo) MarkSignupUsed(ctx context.Context, id uuid.UUID, at time.Time) error {
	return mapErr(r.db.w(ctx).MarkSignupUsed(ctx, sqlcdb.MarkSignupUsedParams{ID: id, SignupUsedAt: &at}))
}

func (r *ChallengeRepo) DeleteBefore(ctx context.Context, t time.Time) (int64, error) {
	n, err := r.db.w(ctx).DeleteOldChallenges(ctx, t)
	return n, mapErr(err)
}
