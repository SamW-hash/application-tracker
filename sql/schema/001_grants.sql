-- +goose Up
CREATE TABLE grants (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    amount INTEGER NOT NULL,
    deadline DATE NOT NULL,
    link TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- +goose Down
DROP TABLE grants;