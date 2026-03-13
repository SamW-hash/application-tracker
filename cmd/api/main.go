package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"workspace/sam/application-tracker/internal/database"
	"workspace/sam/application-tracker/internal/handlers"

	"github.com/joho/godotenv"
	_ "github.com/lib/pq"
)

type apiConfig struct {
	db *database.Queries
}

func main() {
	const filepathRoot = "."
	const port = "8080"

	godotenv.Load()
	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL must be set")
	}
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatalf("Error opening database connection: %s", err)
	}
	dbQueries := database.New(db)

	apiCfg := apiConfig{
		db: dbQueries,
	}

	router := http.NewServeMux()
	fsHandler := http.StripPrefix("/app", http.FileServer(http.Dir(filepathRoot)))
	router.Handle("/app/", fsHandler)

	router.HandleFunc("POST /api/grants", handlers.HandlerCreateGrant(apiCfg.db))

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	log.Printf("starting server on %s", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
