CREATE SCHEMA IF NOT EXISTS "public";

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "auth_identities" (
    "provider" VARCHAR(32) NOT NULL,
    "provider_subject" VARCHAR(255) NOT NULL,
    "user_id" UUID NOT NULL,
    CONSTRAINT "auth_identities_pkey" PRIMARY KEY ("provider", "provider_subject")
);

CREATE TABLE "auth_sessions" (
    "token_hash" CHAR(64) NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("token_hash")
);

CREATE TABLE "oauth_attempts" (
    "token_hash" CHAR(64) NOT NULL,
    "platform" VARCHAR(16) NOT NULL,
    "nonce_hash" CHAR(64) NOT NULL,
    "browser_hash" CHAR(64),
    "verifier" VARCHAR(128),
    "expires_at" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "oauth_attempts_pkey" PRIMARY KEY ("token_hash")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "auth_identities_user_id_idx" ON "auth_identities"("user_id");
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");
CREATE INDEX "auth_sessions_expires_at_idx" ON "auth_sessions"("expires_at");
CREATE INDEX "oauth_attempts_expires_at_idx" ON "oauth_attempts"("expires_at");

ALTER TABLE "auth_identities" ADD CONSTRAINT "auth_identities_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
