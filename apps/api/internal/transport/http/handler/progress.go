package handler

import (
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

var (
	sectionIDPattern = regexp.MustCompile(`^[a-z0-9-]{1,64}$`)
	slugPattern      = regexp.MustCompile(`^[a-z0-9-]{1,100}$`)
)

func lessonParam(r *http.Request) (uuid.UUID, error) {
	id, err := uuid.Parse(chi.URLParam(r, "lessonID"))
	if err != nil {
		return uuid.Nil, domain.ErrNotFound
	}
	return id, nil
}

// OpenLesson → POST /lessons/{lessonID}/open
func (h *Handlers) OpenLesson(w http.ResponseWriter, r *http.Request) {
	lessonID, err := lessonParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	openedAt, err := h.Progress.OpenLesson(r.Context(), mustUser(r), lessonID)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]time.Time{"opened_at": openedAt})
}

// CompleteSection → POST /lessons/{lessonID}/sections/{sectionID}/complete
func (h *Handlers) CompleteSection(w http.ResponseWriter, r *http.Request) {
	lessonID, err := lessonParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	sectionID := chi.URLParam(r, "sectionID")
	if !sectionIDPattern.MatchString(sectionID) {
		httpx.Error(w, r, domain.ErrNotFound)
		return
	}
	res, err := h.Progress.CompleteSection(r.Context(), mustUser(r), lessonID, sectionID)
	if err != nil {
		var ra *domain.RetryAfterError
		if errors.As(err, &ra) {
			w.Header().Set("Retry-After", strconv.Itoa(int(ra.After.Seconds())+1))
		}
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, res)
}

// CompleteLesson → POST /lessons/{lessonID}/complete
func (h *Handlers) CompleteLesson(w http.ResponseWriter, r *http.Request) {
	lessonID, err := lessonParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	res, err := h.Progress.CompleteLesson(r.Context(), mustUser(r), lessonID)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, res)
}

// LessonProgress → GET /lessons/{lessonID}/progress
func (h *Handlers) LessonProgress(w http.ResponseWriter, r *http.Request) {
	lessonID, err := lessonParam(r)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	res, err := h.Progress.LessonProgress(r.Context(), mustUser(r), lessonID)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, res)
}

// TrackProgress → GET /tracks/{slug}/progress
func (h *Handlers) TrackProgress(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")
	if !slugPattern.MatchString(slug) {
		httpx.Error(w, r, domain.ErrNotFound)
		return
	}
	res, err := h.Progress.TrackProgress(r.Context(), mustUser(r), slug)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	httpx.JSON(w, http.StatusOK, res)
}
