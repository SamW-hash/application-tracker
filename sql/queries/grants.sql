-- name: CreateGrant :one
INSERT INTO grants (id, title, organization, amount, deadline, link, notes, status, updated_at, created_at)
VALUES (
    gen_random_uuid(),
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    NOW(),
    NOW()
)
RETURNING *;