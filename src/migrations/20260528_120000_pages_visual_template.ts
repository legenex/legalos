import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `visual_template` column to `pages` for the per-Site Page Builder
 * (LP-style preview canvas). Only meaningful for custom pages; safely defaults
 * to 'bold_modern' for everything that already exists.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_visual_template" AS ENUM('bold_modern', 'classic_authority', 'editorial_investigation', 'urgent_streamlined');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
    ALTER TABLE "pages" ADD COLUMN IF NOT EXISTS "visual_template" "enum_pages_visual_template" DEFAULT 'bold_modern';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages" DROP COLUMN IF EXISTS "visual_template";
    DROP TYPE IF EXISTS "public"."enum_pages_visual_template";
  `)
}
