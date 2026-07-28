import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `is_archived` (boolean, default false) and `archived_at` (timestamptz,
 * nullable) to `funnel_quizzes` so quizzes can be retired from the builder list
 * without deleting them and their deployments.
 *
 * Two deliberate safety properties:
 *
 * 1. TABLE-GUARDED. No committed migration creates `funnel_quizzes` (the six
 *    funnel_* tables predate the migration chain and exist only where Payload's
 *    dev auto-push created them). A bare ALTER TABLE would therefore fail hard
 *    on any environment that does not already have the table. The DO block
 *    makes this a no-op there instead, so `pnpm payload migrate` stays green
 *    and the drift is fixed once, separately, rather than half-fixed here.
 *
 * 2. IDEMPOTENT. ADD COLUMN IF NOT EXISTS / DROP COLUMN IF EXISTS, so a re-run
 *    lands in the same state as a fresh apply.
 *
 * `is_archived` is NOT NULL with a default rather than nullable: Payload's
 * checkbox reads false for existing rows either way, but a default means the
 * backfill is implicit and no existing quiz is left in an indeterminate state.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'funnel_quizzes'
      ) THEN
        ALTER TABLE "funnel_quizzes"
          ADD COLUMN IF NOT EXISTS "is_archived" boolean NOT NULL DEFAULT false,
          ADD COLUMN IF NOT EXISTS "archived_at" timestamp(3) with time zone;

        CREATE INDEX IF NOT EXISTS "funnel_quizzes_is_archived_idx"
          ON "funnel_quizzes" USING btree ("is_archived");
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'funnel_quizzes'
      ) THEN
        DROP INDEX IF EXISTS "funnel_quizzes_is_archived_idx";
        ALTER TABLE "funnel_quizzes"
          DROP COLUMN IF EXISTS "is_archived",
          DROP COLUMN IF EXISTS "archived_at";
      END IF;
    END $$;
  `)
}
