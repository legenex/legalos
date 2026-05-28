import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `media` collection for the page builder's media library.
 *
 * Payload's upload collection generates a fixed set of columns (filename,
 * mime_type, filesize, width, height, focal_x, focal_y, url, thumbnail_u_r_l,
 * created_at, updated_at) plus a row per declared field (site, alt, caption).
 * The upload itself lives on disk under MEDIA_DIR; this table just records
 * metadata + the site relationship for tenant scoping.
 *
 * Idempotent: every CREATE / ALTER is guarded so the migration is safe to
 * re-run, and the down migration drops the table outright (acceptable since
 * the binaries live on disk independently and a future re-up would just
 * re-record the same files).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "media" (
      "id" serial PRIMARY KEY NOT NULL,
      "site_id" integer,
      "alt" varchar,
      "caption" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "url" varchar,
      "thumbnail_u_r_l" varchar,
      "filename" varchar,
      "mime_type" varchar,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric
    );

    DO $$ BEGIN
      ALTER TABLE "media"
        ADD CONSTRAINT "media_site_id_fk"
        FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "media_site_idx" ON "media" USING btree ("site_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
    CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "media" CASCADE;
  `)
}
