import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Makes funnel quizzes renderable in production.
 *
 * Two things happen here, and the second one is the reason the first is not
 * simply another `ALTER TABLE`:
 *
 * 1. `theme_overrides` (jsonb) on `funnel_quiz_deployments` - the per-deployment
 *    look (template, colours, fonts) that lets one brandless quiz run under many
 *    visual identities without touching the parent quiz or the brand.
 *
 * 2. The `funnel_quizzes` / `funnel_quiz_deployments` tables themselves. This is
 *    the F001 drift: no committed migration ever created them, so they exist
 *    only where Payload's dev auto-push happened to run. Production sets
 *    NODE_ENV=production, where auto-push is OFF - so a production database can
 *    legitimately have no funnel tables at all. The public quiz route added in
 *    this commit reads them on every request, which turns "drift" from a latent
 *    problem into a 500 on a customer-facing page.
 *
 * The DDL is written to CONVERGE rather than to assume a starting state:
 * CREATE TABLE IF NOT EXISTS establishes the table when it is missing, then an
 * ADD COLUMN IF NOT EXISTS for every column brings a pre-existing (auto-pushed)
 * table up to the same shape. Running it against a database that already has
 * the tables is a no-op; running it against one that does not creates them
 * correctly. Both paths end identically, which is the only way to write this
 * when the two environments provably disagree and neither can be trusted.
 *
 * FK behaviour matches the rest of the schema: ON DELETE SET NULL, so deleting a
 * Site or Domain orphans a deployment rather than aborting the delete. The Site
 * cascade hook is what actually cleans children up.
 *
 * Scope note: the four other funnel_* tables (advertorials, landing pages and
 * their deployments) are deliberately NOT created here. They have no public
 * renderer yet, so creating them would be schema written ahead of the code that
 * needs it. F001 stays open for those.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  // The `status` select field compiles to a Postgres enum. It has to exist
  // before the table that uses it, and CREATE TYPE has no IF NOT EXISTS.
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_funnel_quiz_deployments_status') THEN
        CREATE TYPE "enum_funnel_quiz_deployments_status" AS ENUM ('draft', 'live', 'paused');
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "funnel_quizzes" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "is_published" boolean DEFAULT false,
      "is_archived" boolean DEFAULT false,
      "archived_at" timestamp(3) with time zone,
      "tiers" jsonb,
      "steps" jsonb,
      "nodes" jsonb,
      "custom_fields" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  // Converge a pre-existing auto-pushed table to the same shape. Every column
  // is listed, not just the new ones, because an auto-pushed table may predate
  // any of them.
  await db.execute(sql`
    ALTER TABLE "funnel_quizzes"
      ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "is_archived" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "archived_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "tiers" jsonb,
      ADD COLUMN IF NOT EXISTS "steps" jsonb,
      ADD COLUMN IF NOT EXISTS "nodes" jsonb,
      ADD COLUMN IF NOT EXISTS "custom_fields" jsonb,
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "funnel_quizzes_slug_idx" ON "funnel_quizzes" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "funnel_quizzes_is_archived_idx" ON "funnel_quizzes" USING btree ("is_archived");
    CREATE INDEX IF NOT EXISTS "funnel_quizzes_updated_at_idx" ON "funnel_quizzes" USING btree ("updated_at");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "funnel_quiz_deployments" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "quiz_id" integer,
      "site_id" integer,
      "domain_id" integer,
      "path" varchar,
      "render_mode" varchar DEFAULT 'standalone',
      "template_id" varchar DEFAULT 'default',
      "status" "enum_funnel_quiz_deployments_status" DEFAULT 'draft',
      "embed_preview_bg" varchar,
      "header_config" jsonb,
      "footer_config" jsonb,
      "body_section_overrides" jsonb,
      "theme_overrides" jsonb,
      "utm" jsonb,
      "pixels" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "funnel_quiz_deployments"
      ADD COLUMN IF NOT EXISTS "name" varchar,
      ADD COLUMN IF NOT EXISTS "quiz_id" integer,
      ADD COLUMN IF NOT EXISTS "site_id" integer,
      ADD COLUMN IF NOT EXISTS "domain_id" integer,
      ADD COLUMN IF NOT EXISTS "path" varchar,
      ADD COLUMN IF NOT EXISTS "render_mode" varchar DEFAULT 'standalone',
      ADD COLUMN IF NOT EXISTS "template_id" varchar DEFAULT 'default',
      ADD COLUMN IF NOT EXISTS "status" "enum_funnel_quiz_deployments_status" DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS "embed_preview_bg" varchar,
      ADD COLUMN IF NOT EXISTS "header_config" jsonb,
      ADD COLUMN IF NOT EXISTS "footer_config" jsonb,
      ADD COLUMN IF NOT EXISTS "body_section_overrides" jsonb,
      ADD COLUMN IF NOT EXISTS "theme_overrides" jsonb,
      ADD COLUMN IF NOT EXISTS "utm" jsonb,
      ADD COLUMN IF NOT EXISTS "pixels" jsonb,
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)

  // FKs are added separately and guarded by name: ALTER TABLE ... ADD CONSTRAINT
  // has no IF NOT EXISTS, and re-adding an existing constraint is a hard error.
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_quiz_deployments_quiz_id_funnel_quizzes_id_fk') THEN
        ALTER TABLE "funnel_quiz_deployments"
          ADD CONSTRAINT "funnel_quiz_deployments_quiz_id_funnel_quizzes_id_fk"
          FOREIGN KEY ("quiz_id") REFERENCES "funnel_quizzes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_quiz_deployments_site_id_sites_id_fk') THEN
        ALTER TABLE "funnel_quiz_deployments"
          ADD CONSTRAINT "funnel_quiz_deployments_site_id_sites_id_fk"
          FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_quiz_deployments_domain_id_domains_id_fk') THEN
        ALTER TABLE "funnel_quiz_deployments"
          ADD CONSTRAINT "funnel_quiz_deployments_domain_id_domains_id_fk"
          FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
    END $$;
  `)

  // The public router resolves a deployment by (site_id, path) on every public
  // request whose path is not the site root, so that exact pair carries a
  // composite index. This is the hot path for the whole feature: without it,
  // every page view on every tenant sequential-scans this table.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "funnel_quiz_deployments_quiz_idx" ON "funnel_quiz_deployments" USING btree ("quiz_id");
    CREATE INDEX IF NOT EXISTS "funnel_quiz_deployments_site_path_idx" ON "funnel_quiz_deployments" USING btree ("site_id", "path");
    CREATE INDEX IF NOT EXISTS "funnel_quiz_deployments_domain_idx" ON "funnel_quiz_deployments" USING btree ("domain_id");
    CREATE INDEX IF NOT EXISTS "funnel_quiz_deployments_updated_at_idx" ON "funnel_quiz_deployments" USING btree ("updated_at");
  `)
}

/**
 * Down drops only `theme_overrides`.
 *
 * It deliberately does NOT drop the tables. This migration may well have found
 * them already present (created by an auto-push long before it ran), and a down
 * that deletes every quiz and deployment in that case would destroy authored
 * work to undo a column addition. Reverting the column is reversible; reverting
 * the tables is not.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'funnel_quiz_deployments'
      ) THEN
        ALTER TABLE "funnel_quiz_deployments" DROP COLUMN IF EXISTS "theme_overrides";
      END IF;
    END $$;
  `)
}
