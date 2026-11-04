package handler

import (
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"

	"github.com/codingfoding/api/internal/domain"
	"github.com/codingfoding/api/internal/service"
	"github.com/codingfoding/api/internal/transport/http/httpx"
)

const mediaPrefix = "/api/v1/media/"

// mediaURL is the public path of a stored object (served by Media).
func mediaURL(key *string) *string {
	if key == nil {
		return nil
	}
	u := mediaPrefix + *key
	return &u
}

// UploadAvatar → POST /me/avatar (multipart/form-data, field "avatar").
func (h *Handlers) UploadAvatar(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, service.AvatarMaxBytes+64<<10) // + multipart overhead
	mr, err := r.MultipartReader()
	if err != nil {
		httpx.Error(w, r, domain.E(domain.KindInvalid, "multipart_required", "send the image as multipart/form-data"))
		return
	}
	for {
		part, err := mr.NextPart()
		if errors.Is(err, io.EOF) {
			break
		}
		if err != nil {
			var mbe *http.MaxBytesError
			if errors.As(err, &mbe) {
				httpx.Error(w, r, service.ErrAvatarTooLarge)
				return
			}
			httpx.Error(w, r, domain.ErrInvalidInput)
			return
		}
		if part.FormName() != "avatar" {
			continue
		}
		u, err := h.Avatars.Set(r.Context(), mustUser(r), part)
		if err != nil {
			var mbe *http.MaxBytesError
			if errors.As(err, &mbe) {
				err = service.ErrAvatarTooLarge
			}
			var ra *domain.RetryAfterError
			if errors.As(err, &ra) {
				w.Header().Set("Retry-After", strconv.Itoa(int(ra.After.Seconds())+1))
			}
			httpx.Error(w, r, err)
			return
		}
		httpx.JSON(w, http.StatusOK, toUserDTO(u))
		return
	}
	httpx.Error(w, r, domain.E(domain.KindInvalid, "avatar_missing", `no "avatar" file in the form`))
}

// DeleteAvatar → DELETE /me/avatar
func (h *Handlers) DeleteAvatar(w http.ResponseWriter, r *http.Request) {
	u, err := h.Avatars.Clear(r.Context(), mustUser(r))
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	httpx.JSON(w, http.StatusOK, toUserDTO(u))
}

// Media → GET /media/avatars/{file}.jpg — public. Keys change on every upload, so the
// bytes behind a URL never change and can be cached forever.
func (h *Handlers) Media(w http.ResponseWriter, r *http.Request) {
	key := chi.URLParam(r, "*")
	if !strings.HasPrefix(key, "avatars/") || !strings.HasSuffix(key, ".jpg") {
		httpx.Error(w, r, domain.ErrNotFound)
		return
	}
	f, err := h.Avatars.Open(r.Context(), key)
	if err != nil {
		httpx.Error(w, r, err)
		return
	}
	defer f.Close()
	w.Header().Set("Content-Type", "image/jpeg")
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	_, _ = io.Copy(w, f)
}
