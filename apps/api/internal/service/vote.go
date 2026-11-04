package service

import (
	"context"
	"regexp"
	"strings"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/pkg/cursor"
)

type VoteService struct {
	repo domain.VoteRepository
	tx   domain.TxManager
}

func NewVoteService(repo domain.VoteRepository, tx domain.TxManager) *VoteService {
	return &VoteService{repo: repo, tx: tx}
}

type TopicPage struct {
	Items      []domain.Topic `json:"items"`
	NextCursor string         `json:"next_cursor,omitempty"`
}

func (s *VoteService) List(ctx context.Context, viewer *uuid.UUID, after string, limit int32) (*TopicPage, error) {
	var c *domain.TopicCursor
	if after != "" {
		c = &domain.TopicCursor{}
		if err := cursor.Decode(after, c); err != nil {
			return nil, domain.E(domain.KindInvalid, "invalid_cursor", "cursor is invalid")
		}
	}
	items, err := s.repo.ListTopics(ctx, viewer, c, limit+1)
	if err != nil {
		return nil, err
	}
	page := &TopicPage{Items: items}
	if int32(len(items)) > limit {
		page.Items = items[:limit]
		last := page.Items[limit-1]
		page.NextCursor = cursor.Encode(domain.TopicCursor{Votes: last.VoteCount, ID: last.ID})
	}
	return page, nil
}

type VoteResult struct {
	TopicID   uuid.UUID `json:"topic_id"`
	VoteCount int32     `json:"vote_count"`
	Voted     bool      `json:"voted"`
}

// Upvote records a learner's vote on a topic. One user = one vote, and it's final: the
// (user_id, topic_id) primary key enforces it, voting again is a no-op that returns the
// current count, and there is no way to take a vote back. The counter only moves when a
// row was actually inserted, in the same transaction.
func (s *VoteService) Upvote(ctx context.Context, userID, topicID uuid.UUID) (*VoteResult, error) {
	res := &VoteResult{TopicID: topicID, Voted: true}
	err := s.tx.WithinTx(ctx, func(ctx context.Context) error {
		ok, err := s.repo.TopicExists(ctx, topicID)
		if err != nil {
			return err
		}
		if !ok {
			return domain.ErrNotFound
		}
		inserted, err := s.repo.InsertVote(ctx, userID, topicID)
		if err != nil {
			return err
		}
		delta := int32(0)
		if inserted {
			delta = 1
		}
		res.VoteCount, err = s.repo.AdjustVotes(ctx, topicID, delta)
		return err
	})
	if err != nil {
		return nil, err
	}
	return res, nil
}

var slugRe = regexp.MustCompile(`[^a-z0-9]+`)

func (s *VoteService) Propose(ctx context.Context, userID uuid.UUID, titleEN, titleBN, tag string) (*domain.Topic, error) {
	titleEN, titleBN = strings.TrimSpace(titleEN), strings.TrimSpace(titleBN)
	if n := utf8.RuneCountInString(titleEN); n < 3 || n > 120 {
		return nil, domain.E(domain.KindInvalid, "invalid_title", "English title must be 3–120 characters")
	}
	if titleBN == "" {
		titleBN = titleEN
	}
	if utf8.RuneCountInString(titleBN) > 160 {
		return nil, domain.E(domain.KindInvalid, "invalid_title", "Bangla title is too long")
	}
	slug := strings.Trim(slugRe.ReplaceAllString(strings.ToLower(titleEN), "-"), "-")
	if slug == "" {
		return nil, domain.E(domain.KindInvalid, "invalid_title", "title must contain latin letters or digits")
	}
	if tag == "" {
		tag = "general"
	}
	var t *domain.Topic
	err := s.tx.WithinTx(ctx, func(ctx context.Context) error {
		var err error
		if t, err = s.repo.CreateTopic(ctx, domain.NewTopic{Slug: slug, TitleEN: titleEN, TitleBN: titleBN, Tag: tag, CreatedBy: userID}); err != nil {
			return err
		}
		if _, err := s.repo.InsertVote(ctx, userID, t.ID); err != nil {
			return err
		}
		t.VoteCount, err = s.repo.AdjustVotes(ctx, t.ID, 1)
		t.Voted = true
		return err
	})
	return t, err
}
