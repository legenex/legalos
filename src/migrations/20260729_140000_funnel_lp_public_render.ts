import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Makes funnel landing pages renderable in production.
 *
 * Same situation the quiz tables were in: `funnel_landing_pages` and
 * `funnel_lp_deployments` are declared by collections but were never created by
 * any migration, so they exist only where Payload's development auto-push
 * happened to run. Production sets NODE_ENV=production, where auto-push is off.
 * The public landing-page route added in this commit reads both tables on
 * request, which turns that drift from latent into a 500 on a customer-facing
 * URL.
 *
 * The DDL converges rather than assuming a starting state: CREATE TABLE IF NOT
 * EXISTS establishes the table when missing, then ADD COLUMN IF NOT EXISTS
 * brings an already-auto-pushed table to the same shape. Both paths finish
 * identically, which is the only safe way to write this when the environments
 * provably disagree.
 *
 * With this, four of the six funnel tables are in the migration chain. The two
 * advertorial tables remain outside it; they have no public renderer yet, so
 * creating them here would be schema written ahead of the code that needs it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_funnel_lp_deployments_status" AS ENUM ('draft', 'live', 'paused');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "funnel_landing_pages" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "template_id" varchar DEFAULT 'bold_modern',
      "angle" varchar DEFAULT 'pain',
      "is_published" boolean DEFAULT false,
      "sections" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "funnel_landing_pages"
      ADD COLUMN IF NOT EXISTS "template_id" varchar DEFAULT 'bold_modern',
      ADD COLUMN IF NOT EXISTS "angle" varchar DEFAULT 'pain',
      ADD COLUMN IF NOT EXISTS "is_published" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "sections" jsonb,
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "funnel_landing_pages_slug_idx" ON "funnel_landing_pages" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "funnel_landing_pages_updated_at_idx" ON "funnel_landing_pages" USING btree ("updated_at");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "funnel_lp_deployments" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "landing_page_id" integer,
      "site_id" integer,
      "domain_id" integer,
      "path" varchar,
      "quiz_deployment_id" varchar,
      "status" "enum_funnel_lp_deployments_status" DEFAULT 'draft',
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "funnel_lp_deployments"
      ADD COLUMN IF NOT EXISTS "name" varchar,
      ADD COLUMN IF NOT EXISTS "landing_page_id" integer,
      ADD COLUMN IF NOT EXISTS "site_id" integer,
      ADD COLUMN IF NOT EXISTS "domain_id" integer,
      ADD COLUMN IF NOT EXISTS "path" varchar,
      ADD COLUMN IF NOT EXISTS "quiz_deployment_id" varchar,
      ADD COLUMN IF NOT EXISTS "status" "enum_funnel_lp_deployments_status" DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)

  // FKs are name-guarded: ADD CONSTRAINT has no IF NOT EXISTS and re-adding an
  // existing constraint is a hard error. ON DELETE SET NULL matches the rest of
  // the schema, where the Site cascade hook does the real cleanup.
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_lp_deployments_landing_page_id_fk') THEN
        ALTER TABLE "funnel_lp_deployments"
          ADD CONSTRAINT "funnel_lp_deployments_landing_page_id_fk"
          FOREIGN KEY ("landing_page_id") REFERENCES "funnel_landing_pages"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_lp_deployments_site_id_fk') THEN
        ALTER TABLE "funnel_lp_deployments"
          ADD CONSTRAINT "funnel_lp_deployments_site_id_fk"
          FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_lp_deployments_domain_id_fk') THEN
        ALTER TABLE "funnel_lp_deployments"
          ADD CONSTRAINT "funnel_lp_deployments_domain_id_fk"
          FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
    END $$;
  `)

  // (site_id, path) is the lookup the public router performs on every request
  // whose path is not the site root, so it carries a composite index.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "funnel_lp_deployments_site_path_idx" ON "funnel_lp_deployments" USING btree ("site_id", "path");
    CREATE INDEX IF NOT EXISTS "funnel_lp_deployments_landing_page_idx" ON "funnel_lp_deployments" USING btree ("landing_page_id");
    CREATE INDEX IF NOT EXISTS "funnel_lp_deployments_domain_idx" ON "funnel_lp_deployments" USING btree ("domain_id");
    CREATE INDEX IF NOT EXISTS "funnel_lp_deployments_updated_at_idx" ON "funnel_lp_deployments" USING btree ("updated_at");
  `)
}

/**
 * Deliberately a no-op.
 *
 * This migration may well have found the tables already present, created by an
 * auto-push long before it ran. A down that dropped them would destroy every
 * authored landing page and deployment in order to undo a migration that, in
 * that case, created nothing. There is nothing here safe to reverse.
 */
export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally empty. See the note above.
}
