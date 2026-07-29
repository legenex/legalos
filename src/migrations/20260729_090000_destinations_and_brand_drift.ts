import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Destination URLs, and the rest of the Sites half of F001.
 *
 * 1. `destination_overrides` (jsonb) on `funnel_quiz_deployments`. A quiz node
 *    now names a destination ("thank you", "did not qualify") instead of
 *    carrying a URL, and the URL is resolved from the deployment first, then
 *    the brand. This column is the deployment half of that cascade.
 *
 * 2. The columns `src/collections/Sites.ts` has declared for a while but that
 *    no committed migration ever created. Payload's SELECT enumerates every
 *    column a collection declares, so a missing one throws before startup
 *    completes - it is not a per-query failure, it takes the whole app down.
 *    Brand destination URLs are stored in `brand_identity`, which is on that
 *    list, so this stops being theoretical the moment the feature is used.
 *
 *    The header of 20260529_060000_sites_global_blocks.ts asserts that
 *    `brand_identity` "has been on the table since the initial migration".
 *    That is false - grep the migrations and the name appears only in that
 *    comment. This is the migration that actually creates it.
 *
 * All DDL is ADD COLUMN IF NOT EXISTS and nullable, so it converges whether the
 * database already has these columns (from a dev auto-push) or not, and no
 * existing row needs a backfill.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'funnel_quiz_deployments'
      ) THEN
        ALTER TABLE "funnel_quiz_deployments"
          ADD COLUMN IF NOT EXISTS "destination_overrides" jsonb;
      END IF;
    END $$;
  `)

  // Sites: the declared-but-never-created columns. Grouped fields flatten to
  // <group>_<field> in the Payload postgres adapter.
  await db.execute(sql`
    ALTER TABLE "sites"
      ADD COLUMN IF NOT EXISTS "brand_identity" jsonb,
      ADD COLUMN IF NOT EXISTS "brand_display_name" varchar,
      ADD COLUMN IF NOT EXISTS "brand_short_name" varchar,
      ADD COLUMN IF NOT EXISTS "brand_logo_url_dark" varchar,
      ADD COLUMN IF NOT EXISTS "brand_tagline_brand" varchar,
      ADD COLUMN IF NOT EXISTS "legal_copyright" varchar,
      ADD COLUMN IF NOT EXISTS "legal_tcpa_text" varchar,
      ADD COLUMN IF NOT EXISTS "legal_privacy_url" varchar,
      ADD COLUMN IF NOT EXISTS "legal_terms_url" varchar,
      ADD COLUMN IF NOT EXISTS "legal_default_disclaimer" varchar,
      ADD COLUMN IF NOT EXISTS "typography_headline_font" varchar,
      ADD COLUMN IF NOT EXISTS "typography_body_font" varchar,
      ADD COLUMN IF NOT EXISTS "typography_base_size" varchar;
  `)
}

/**
 * Down drops only `destination_overrides`.
 *
 * The Sites columns are deliberately not dropped. They are declared on the
 * collection, so dropping them would take the application down on the next
 * boot - a down migration that breaks the app is worse than an unused column.
 * Removing them means removing the field declarations first.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'funnel_quiz_deployments'
      ) THEN
        ALTER TABLE "funnel_quiz_deployments"
          DROP COLUMN IF EXISTS "destination_overrides";
      END IF;
    END $$;
  `)
}
