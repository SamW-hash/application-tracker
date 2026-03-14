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

type UpdateGrantRequest struct {
	Title        string    `json:"title"`
	Organization string    `json:"organization"`
	Amount       int       `json:"amount"`
	Deadline     time.Time `json:"deadline"`
	Link         string    `json:"link"`
	Notes        string    `json:"notes"`
	Status       string    `json:"status"`
}
type CreateGrantRequest struct {
	Title        string    `json:"title"`
	Organization string    `json:"organization"`
	Amount       int       `json:"amount"`
	Deadline     time.Time `json:"deadline"`
	Link         string    `json:"link"`
	Notes        string    `json:"notes"`
	Status       string    `json:"status"`
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
			Deadline:     req.Deadline,
			Link:         link,
			Notes:        notes,
			Status:       req.Status,
		})
		if err != nil {
			util.RespondWithError(w, http.StatusInternalServerError, "Failed to create grant", err)
			return
		}

		util.RespondWithJSON(w, http.StatusCreated, grant)
	}
}

func HandlerGetAllGrants(db *database.Queries) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		grants, err := db.GetAllGrants(r.Context())
		if err != nil {
			util.RespondWithError(w, http.StatusInternalServerError, "Failed to fetch grants", err)
			return
		}
		util.RespondWithJSON(w, http.StatusOK, grants)
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
		util.RespondWithJSON(w, http.StatusOK, grant)
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
			Deadline:     req.Deadline,
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
		util.RespondWithJSON(w, http.StatusOK, grant)
	}
}
