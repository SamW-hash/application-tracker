package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"

	"workspace/sam/application-tracker/internal/database"
	util "workspace/sam/application-tracker/internal/jsonutil"
)

// GrantResponse is the JSON shape returned by the API (snake_case, null for optional strings).
type GrantResponse struct {
	ID           string  `json:"id"`
	Title        string  `json:"title"`
	Organization string  `json:"organization"`
	Amount       int     `json:"amount"`
	Deadline     string  `json:"deadline"`
	Link         *string `json:"link"`
	Notes        *string `json:"notes"`
	Status       string  `json:"status"`
	CreatedAt    string  `json:"created_at"`
	UpdatedAt    string  `json:"updated_at"`
}

func grantToResponse(g database.Grant) GrantResponse {
	resp := GrantResponse{
		ID:           g.ID.String(),
		Title:        g.Title,
		Organization: g.Organization,
		Amount:       int(g.Amount),
		Deadline:     g.Deadline.Format("2006-01-02"),
		Status:       g.Status,
		CreatedAt:    g.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    g.UpdatedAt.Format(time.RFC3339),
	}
	if g.Link.Valid {
		resp.Link = &g.Link.String
	}
	if g.Notes.Valid {
		resp.Notes = &g.Notes.String
	}
	return resp
}

type UpdateGrantRequest struct {
	Title        string `json:"title"`
	Organization string `json:"organization"`
	Amount       int    `json:"amount"`
	Deadline     string `json:"deadline"`
	Link         string `json:"link"`
	Notes        string `json:"notes"`
	Status       string `json:"status"`
}
type CreateGrantRequest struct {
	Title        string `json:"title"`
	Organization string `json:"organization"`
	Amount       int    `json:"amount"`
	Deadline     string `json:"deadline"`
	Link         string `json:"link"`
	Notes        string `json:"notes"`
	Status       string `json:"status"`
}

func HandlerCreateGrant(db *database.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req CreateGrantRequest
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&req); err != nil {
			util.RespondWithError(w, http.StatusBadRequest, "Invalid parameters", err)
			return
		}
		if req.Title == "" || req.Organization == "" {
			util.RespondWithError(w, http.StatusBadRequest, "Title and organization are required", nil)
			return
		}
		deadline, err := time.Parse("2006-01-02", req.Deadline)
		if err != nil {
			util.RespondWithError(w, http.StatusBadRequest, "Invalid deadline format, expected YYYY-MM-DD", err)
			return
		}

		var link sql.NullString
		if req.Link != "" {
			link = sql.NullString{
				String: req.Link,
				Valid:  true,
			}
		}
		var notes sql.NullString
		if req.Notes != "" {
			notes = sql.NullString{
				String: req.Notes,
				Valid:  true,
			}
		}

		grant, err := db.CreateGrant(r.Context(), database.CreateGrantParams{
			Title:        req.Title,
			Organization: req.Organization,
			Amount:       int32(req.Amount),
			Deadline:     deadline,
			Link:         link,
			Notes:        notes,
			Status:       req.Status,
		})
		if err != nil {
			util.RespondWithError(w, http.StatusInternalServerError, "Failed to create grant", err)
			return
		}

		util.RespondWithJSON(w, http.StatusCreated, grantToResponse(grant))
	}
}

func HandlerGetAllGrants(db *database.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		grants, err := db.GetAllGrants(r.Context())
		if err != nil {
			util.RespondWithError(w, http.StatusInternalServerError, "Failed to fetch grants", err)
			return
		}
		if grants == nil {
			grants = []database.Grant{}
		}
		out := make([]GrantResponse, len(grants))
		for i, g := range grants {
			out[i] = grantToResponse(g)
		}
		util.RespondWithJSON(w, http.StatusOK, out)
	}
}

func HandlerGetGrant(db *database.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := uuid.Parse(idStr)
		if err != nil {
			util.RespondWithError(w, http.StatusBadRequest, "Invalid grant ID", err)
			return
		}

		grant, err := db.GetGrant(r.Context(), id)
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				util.RespondWithError(w, http.StatusNotFound, "Grant not found", err)
				return
			}
			util.RespondWithError(w, http.StatusInternalServerError, "Failed to get grant", err)
			return
		}
		util.RespondWithJSON(w, http.StatusOK, grantToResponse(grant))
	}
}

func HandlerDeleteGrant(db *database.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := uuid.Parse(idStr)
		if err != nil {
			util.RespondWithError(w, http.StatusBadRequest, "Invalid grant ID", err)
			return
		}

		if err := db.DeleteGrant(r.Context(), id); err != nil {
			util.RespondWithError(w, http.StatusInternalServerError, "Failed to delete grant", err)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func HandlerUpdateGrant(db *database.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		idStr := r.PathValue("id")
		id, err := uuid.Parse(idStr)
		if err != nil {
			util.RespondWithError(w, http.StatusBadRequest, "Invalid grant ID", err)
			return
		}

		var req UpdateGrantRequest
		decoder := json.NewDecoder(r.Body)
		decoder.DisallowUnknownFields()
		if err := decoder.Decode(&req); err != nil {
			util.RespondWithError(w, http.StatusBadRequest, "Invalid parameters", err)
			return
		}
		if req.Title == "" || req.Organization == "" {
			util.RespondWithError(w, http.StatusBadRequest, "Title and organization are required", nil)
			return
		}
		deadline, err := time.Parse("2006-01-02", req.Deadline)
		if err != nil {
			util.RespondWithError(w, http.StatusBadRequest, "Invalid deadline format, expected YYYY-MM-DD", err)
			return
		}

		var link sql.NullString
		if req.Link != "" {
			link = sql.NullString{
				String: req.Link,
				Valid:  true,
			}
		}
		var notes sql.NullString
		if req.Notes != "" {
			notes = sql.NullString{
				String: req.Notes,
				Valid:  true,
			}
		}
		grant, err := db.UpdateGrant(r.Context(), database.UpdateGrantParams{
			ID:           id,
			Title:        req.Title,
			Organization: req.Organization,
			Amount:       int32(req.Amount),
			Deadline:     deadline,
			Link:         link,
			Notes:        notes,
			Status:       req.Status,
		})
		if err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				util.RespondWithError(w, http.StatusNotFound, "Grant not found", err)
				return
			}
			util.RespondWithError(w, http.StatusInternalServerError, "Failed to update grant", err)
			return
		}
		util.RespondWithJSON(w, http.StatusOK, grantToResponse(grant))
	}
}

func HandlerResetDatabase(db *database.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		err := db.ResetDatabase(r.Context())
		if err != nil {
			util.RespondWithError(w, http.StatusInternalServerError, "Failed to reset database", err)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Database Reset!"))
	}
}
