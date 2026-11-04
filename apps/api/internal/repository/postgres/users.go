package postgres

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/repository/postgres/sqlcdb"
	"github.com/codingfoding/api/pkg/id"
)

type UserRepo struct{ db *DB }

func NewUserRepo(db *DB) *UserRepo { return &UserRepo{db} }

func toUser(u sqlcdb.User) *domain.User {
	return &domain.User{
		ID: u.ID, Email: u.Email, EmailVerified: u.EmailVerifiedAt != nil, Username: u.Username,
		DisplayName: u.DisplayName, PasswordHash: u.PasswordHash, Role: domain.Role(u.Role),
		PreferredLocale: domain.Locale(u.PreferredLocale), Theme: u.Theme, Font: u.Font, Division: u.Division,
		Phone: u.Phone, District: u.District, Interests: u.Interests, AvatarKey: u.AvatarKey, AvatarChangedAt: u.AvatarChangedAt, JourneyStage: u.JourneyStage, AccountType: u.AccountType, ProUntil: u.ProUntil, BannedAt: u.BannedAt,
		XP: u.Xp, CurrentStreak: u.CurrentStreak, LongestStreak: u.LongestStreak,
		LastActiveDate: u.LastActiveDate, Version: u.Version, CreatedAt: u.CreatedAt,
	}
}

func (r *UserRepo) Create(ctx context.Context, n domain.NewUser) (*domain.User, error) {
	var verifiedAt *time.Time
	if n.EmailVerified {
		now := time.Now()
		verifiedAt = &now
	}
	interests := n.Interests
	if interests == nil {
		interests = []string{} // column is NOT NULL
	}
	u, err := r.db.w(ctx).CreateUser(ctx, sqlcdb.CreateUserParams{
		ID: n.ID, Email: n.Email, Username: n.Username, DisplayName: n.DisplayName,
		PasswordHash: n.PasswordHash, Role: sqlcdb.UserRole(n.Role), PreferredLocale: string(n.Locale), Division: n.Division,
		Phone: n.Phone, District: n.District, Interests: interests, EmailVerifiedAt: verifiedAt, JourneyStage: n.JourneyStage,
	})
	if err != nil {
		return nil, mapErr(err)
	}
	return toUser(u), nil
}

// Identity reads go to the primary: right after signup the replica may lag.
func (r *UserRepo) ByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	u, err := r.db.w(ctx).GetUserByID(ctx, id)
	if err != nil {
		return nil, mapErr(err)
	}
	return toUser(u), nil
}

func (r *UserRepo) ByEmail(ctx context.Context, email string) (*domain.User, error) {
	u, err := r.db.w(ctx).GetUserByEmail(ctx, email)
	if err != nil {
		return nil, mapErr(err)
	}
	return toUser(u), nil
}

func (r *UserRepo) ByUsername(ctx context.Context, username string) (*domain.User, error) {
	u, err := r.db.r(ctx).GetUserByUsername(ctx, username)
	if err != nil {
		return nil, mapErr(err)
	}
	return toUser(u), nil
}

func (r *UserRepo) MarkEmailVerified(ctx context.Context, id uuid.UUID) error {
	return mapErr(r.db.w(ctx).MarkEmailVerified(ctx, id))
}

func (r *UserRepo) UpdatePasswordHash(ctx context.Context, id uuid.UUID, hash string) error {
	return mapErr(r.db.w(ctx).UpdatePasswordHash(ctx, sqlcdb.UpdatePasswordHashParams{ID: id, PasswordHash: &hash}))
}

func (r *UserRepo) UpdatePreferences(ctx context.Context, id uuid.UUID, p domain.UserPreferences) (*domain.User, error) {
	var locale *string
	if p.Locale != nil {
		s := string(*p.Locale)
		locale = &s
	}
	u, err := r.db.w(ctx).UpdateUserPreferences(ctx, sqlcdb.UpdateUserPreferencesParams{
		ID: id, DisplayName: p.DisplayName, PreferredLocale: locale, Theme: p.Theme, Font: p.Font, Division: p.Division,
		JourneyStage: p.JourneyStage, Phone: p.Phone, District: p.District, Interests: p.Interests,
	})
	if err != nil {
		return nil, mapErr(err)
	}
	return toUser(u), nil
}

type SessionRepo struct{ db *DB }

func NewSessionRepo(db *DB) *SessionRepo { return &SessionRepo{db} }

func (r *SessionRepo) Create(ctx context.Context, s domain.NewSession) error {
	_, err := r.db.w(ctx).CreateSession(ctx, sqlcdb.CreateSessionParams{
		ID: s.ID, UserID: s.UserID, FamilyID: s.FamilyID, TokenHash: s.TokenHash,
		UserAgent: s.UserAgent, Ip: parseIP(s.IP), ExpiresAt: s.ExpiresAt,
	})
	return mapErr(err)
}

func (r *SessionRepo) ByTokenHashForUpdate(ctx context.Context, hash []byte) (*domain.Session, error) {
	s, err := r.db.w(ctx).GetSessionByTokenHashForUpdate(ctx, hash)
	if err != nil {
		return nil, mapErr(err)
	}
	return &domain.Session{ID: s.ID, UserID: s.UserID, FamilyID: s.FamilyID, ExpiresAt: s.ExpiresAt, RevokedAt: s.RevokedAt}, nil
}

func (r *SessionRepo) Rotate(ctx context.Context, oldID, newID uuid.UUID) error {
	return mapErr(r.db.w(ctx).RotateSession(ctx, sqlcdb.RotateSessionParams{ID: oldID, ReplacedBy: uuid.NullUUID{UUID: newID, Valid: true}}))
}

func (r *SessionRepo) RevokeFamily(ctx context.Context, familyID uuid.UUID) error {
	return mapErr(r.db.w(ctx).RevokeSessionFamily(ctx, familyID))
}

func (r *SessionRepo) RevokeAllForUser(ctx context.Context, userID uuid.UUID) error {
	return mapErr(r.db.w(ctx).RevokeAllUserSessions(ctx, userID))
}

func (r *SessionRepo) DeleteExpired(ctx context.Context) (int64, error) {
	n, err := r.db.w(ctx).DeleteExpiredSessions(ctx)
	return n, mapErr(err)
}

type TokenRepo struct{ db *DB }

func NewTokenRepo(db *DB) *TokenRepo { return &TokenRepo{db} }

func (r *TokenRepo) Create(ctx context.Context, userID uuid.UUID, kind domain.TokenKind, hash []byte, exp time.Time) error {
	return mapErr(r.db.w(ctx).CreateUserToken(ctx, sqlcdb.CreateUserTokenParams{
		ID: id.New(), UserID: userID, Kind: sqlcdb.TokenKind(kind), TokenHash: hash, ExpiresAt: exp,
	}))
}

func (r *TokenRepo) Consume(ctx context.Context, hash []byte, kind domain.TokenKind) (uuid.UUID, error) {
	uid, err := r.db.w(ctx).ConsumeUserToken(ctx, sqlcdb.ConsumeUserTokenParams{TokenHash: hash, Kind: sqlcdb.TokenKind(kind)})
	return uid, mapErr(err)
}

func (r *TokenRepo) InvalidateAll(ctx context.Context, userID uuid.UUID, kind domain.TokenKind) error {
	return mapErr(r.db.w(ctx).InvalidateUserTokens(ctx, sqlcdb.InvalidateUserTokensParams{UserID: userID, Kind: sqlcdb.TokenKind(kind)}))
}

type OAuthRepo struct{ db *DB }

func NewOAuthRepo(db *DB) *OAuthRepo { return &OAuthRepo{db} }

func (r *OAuthRepo) UserIDFor(ctx context.Context, provider, providerUserID string) (uuid.UUID, error) {
	a, err := r.db.w(ctx).GetOAuthAccount(ctx, sqlcdb.GetOAuthAccountParams{Provider: provider, ProviderUserID: providerUserID})
	if err != nil {
		return uuid.Nil, mapErr(err)
	}
	return a.UserID, nil
}

func (r *OAuthRepo) Link(ctx context.Context, userID uuid.UUID, i domain.OAuthIdentity) error {
	var email *string
	if i.Email != "" {
		email = &i.Email
	}
	return mapErr(r.db.w(ctx).CreateOAuthAccount(ctx, sqlcdb.CreateOAuthAccountParams{
		ID: id.New(), UserID: userID, Provider: i.Provider, ProviderUserID: i.ProviderUserID, Email: email,
	}))
}

type AuditRepo struct{ db *DB }

func NewAuditRepo(db *DB) *AuditRepo { return &AuditRepo{db} }

func (r *AuditRepo) Record(ctx context.Context, e domain.AuditEntry) error {
	diff, err := json.Marshal(e.Diff)
	if err != nil {
		return domain.Internal(err)
	}
	actor := uuid.NullUUID{UUID: e.ActorID, Valid: e.ActorID != uuid.Nil}
	return mapErr(r.db.w(ctx).InsertAuditLog(ctx, sqlcdb.InsertAuditLogParams{
		ID: id.New(), ActorID: actor, Action: e.Action, EntityType: e.EntityType, EntityID: e.EntityID,
		Diff: diff, Ip: parseIP(e.IP), RequestID: e.RequestID,
	}))
}

func (r *UserRepo) SetAvatar(ctx context.Context, id uuid.UUID, key *string, now, allowedBefore time.Time) (*string, error) {
	prev, err := r.db.w(ctx).SetUserAvatar(ctx, sqlcdb.SetUserAvatarParams{
		UserID: id, AvatarKey: key, Now: now, AllowedBefore: allowedBefore,
	})
	return prev, mapErr(err)
}

func (r *UserRepo) CountByJourneyStage(ctx context.Context) (map[string]int64, error) {
	rows, err := r.db.r(ctx).CountUsersByJourneyStage(ctx)
	if err != nil {
		return nil, mapErr(err)
	}
	out := make(map[string]int64, len(rows))
	for _, row := range rows {
		out[row.JourneyStage] = row.Learners
	}
	return out, nil
}
