BEGIN;

LOCK TABLE "users" IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "users"
        GROUP BY lower(btrim("email"))
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Resolve users with duplicate normalized emails before enabling registration';
    END IF;
END $$;

UPDATE "users"
SET "email" = lower(btrim("email"))
WHERE "email" <> lower(btrim("email"));

ALTER TABLE "users"
ADD CONSTRAINT "users_email_normalized_check" CHECK ("email" = lower(btrim("email")));

ALTER TABLE "oauth_attempts"
ADD COLUMN "is_registration" BOOLEAN NOT NULL DEFAULT false;

COMMIT;
