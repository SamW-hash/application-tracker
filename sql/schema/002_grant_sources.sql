-- +goose Up
CREATE TABLE grant_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_checked_at TIMESTAMPTZ,
    last_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT grant_sources_source_type_check
        CHECK (source_type IN ('rss', 'html', 'api'))
);

CREATE UNIQUE INDEX grant_sources_grant_id_source_url_key
ON grant_sources(grant_id, source_url);

CREATE TABLE grant_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,
    grant_source_id UUID NOT NULL REFERENCES grant_sources(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT,
    update_url TEXT,
    published_at TIMESTAMPTZ,
    content_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX grant_updates_source_hash_key
ON grant_updates(grant_source_id, content_hash);
-- +goose Down
DROP TABLE grant_sources, grant_updates;