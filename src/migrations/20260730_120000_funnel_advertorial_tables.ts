import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The last two funnel tables, and the end of the F001 schema drift.
 *
 * `funnel_advertorials` and `funnel_advertorial_deployments` are declared by
 * collections but were never created by any migration, so they exist only where
 * Payload's development auto-push happened to run. Production sets
 * NODE_ENV=production, where auto-push is off.
 *
 * These two are more dangerous than the four already fixed, not less. Payload's
 * SELECT enumerates every column a collection declares, so a missing table
 * throws before startup completes - it is not a per-query failure, it takes the
 * whole application down. The advertorial builder reads them the moment anyone
 * opens that screen.
 *
 * Same convergent DDL as the quiz and landing-page migrations: CREATE TABLE IF
 * NOT EXISTS establishes the table when it is absent, then ADD COLUMN IF NOT
 * EXISTS brings an already-auto-pushed copy to the same shape. Both paths end
 * identically, which is the only safe way to write this when the environments
 * provably disagree and neither can be trusted.
 *
 * With this, all six funnel tables are in the migration chain and F001 is
 * closed: the Sites columns were added on 29 July, the quiz and landing-page
 * tables on 28 and 29 July, and these two complete it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_funnel_advertorials_status" AS ENUM ('draft', 'published', 'archived');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_funnel_advertorial_deployments_cta_mode" AS ENUM ('button', 'embed');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "enum_funnel_advertorial_deployments_status" AS ENUM ('draft', 'live', 'paused');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "funnel_advertorials" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "template_id" varchar DEFAULT 'personal_story',
      "default_brand_id" varchar,
      "status" "enum_funnel_advertorials_status" DEFAULT 'draft',
      "sections" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "funnel_advertorials"
      ADD COLUMN IF NOT EXISTS "template_id" varchar DEFAULT 'personal_story',
      ADD COLUMN IF NOT EXISTS "default_brand_id" varchar,
      ADD COLUMN IF NOT EXISTS "status" "enum_funnel_advertorials_status" DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS "sections" jsonb,
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "funnel_advertorials_slug_idx" ON "funnel_advertorials" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "funnel_advertorials_status_idx" ON "funnel_advertorials" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "funnel_advertorials_updated_at_idx" ON "funnel_advertorials" USING btree ("updated_at");
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "funnel_advertorial_deployments" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar,
      "advertorial_id" integer,
      "site_id" integer,
      "domain_id" integer,
      "path" varchar,
      "quiz_deployment_id" varchar,
      "cta_mode" "enum_funnel_advertorial_deployments_cta_mode" DEFAULT 'button',
      "status" "enum_funnel_advertorial_deployments_status" DEFAULT 'draft',
      "utm" jsonb,
      "pixels" jsonb,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    ALTER TABLE "funnel_advertorial_deployments"
      ADD COLUMN IF NOT EXISTS "name" varchar,
      ADD COLUMN IF NOT EXISTS "advertorial_id" integer,
      ADD COLUMN IF NOT EXISTS "site_id" integer,
      ADD COLUMN IF NOT EXISTS "domain_id" integer,
      ADD COLUMN IF NOT EXISTS "path" varchar,
      ADD COLUMN IF NOT EXISTS "quiz_deployment_id" varchar,
      ADD COLUMN IF NOT EXISTS "cta_mode" "enum_funnel_advertorial_deployments_cta_mode" DEFAULT 'button',
      ADD COLUMN IF NOT EXISTS "status" "enum_funnel_advertorial_deployments_status" DEFAULT 'draft',
      ADD COLUMN IF NOT EXISTS "utm" jsonb,
      ADD COLUMN IF NOT EXISTS "pixels" jsonb,
      ADD COLUMN IF NOT EXISTS "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      ADD COLUMN IF NOT EXISTS "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL;
  `)

  // Name-guarded: ADD CONSTRAINT has no IF NOT EXISTS and re-adding one is a
  // hard error. ON DELETE SET NULL matches the rest of the schema, where the
  // Site cascade hook does the real cleanup.
  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_adv_deployments_advertorial_id_fk') THEN
        ALTER TABLE "funnel_advertorial_deployments"
          ADD CONSTRAINT "funnel_adv_deployments_advertorial_id_fk"
          FOREIGN KEY ("advertorial_id") REFERENCES "funnel_advertorials"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_adv_deployments_site_id_fk') THEN
        ALTER TABLE "funnel_advertorial_deployments"
          ADD CONSTRAINT "funnel_adv_deployments_site_id_fk"
          FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'funnel_adv_deployments_domain_id_fk') THEN
        ALTER TABLE "funnel_advertorial_deployments"
          ADD CONSTRAINT "funnel_adv_deployments_domain_id_fk"
          FOREIGN KEY ("domain_id") REFERENCES "domains"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "funnel_adv_deployments_site_path_idx" ON "funnel_advertorial_deployments" USING btree ("site_id", "path");
    CREATE INDEX IF NOT EXISTS "funnel_adv_deployments_advertorial_idx" ON "funnel_advertorial_deployments" USING btree ("advertorial_id");
    CREATE INDEX IF NOT EXISTS "funnel_adv_deployments_domain_idx" ON "funnel_advertorial_deployments" USING btree ("domain_id");
    CREATE INDEX IF NOT EXISTS "funnel_adv_deployments_updated_at_idx" ON "funnel_advertorial_deployments" USING btree ("updated_at");
  `)
}

/**
 * Deliberately a no-op, for the same reason as the quiz and landing-page
 * migrations: this may well have found the tables already present and populated
 * by an auto-push, and a down that dropped them would destroy authored
 * advertorials to undo a migration that, in that case, created nothing.
 */
export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally empty. See the note above.
}
