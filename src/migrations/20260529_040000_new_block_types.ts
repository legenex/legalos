import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds four new body_blocks types to the Pages collection:
 *   - video       (single table, no nested arrays)
 *   - gallery     (single table + nested images array)
 *   - logo_cloud  (single table + nested logos array)
 *   - spacer      (single table, no nested arrays)
 *
 * Per the Payload v3 postgres adapter convention, every blockType becomes a
 * table named pages_blocks_<slug> with the bookkeeping columns
 * (_order, _parent_id, _path, id, block_name) plus one column per scalar
 * field. Nested arrays become a child table pages_blocks_<slug>_<arrayfield>
 * with their own _order/_parent_id/id plus per-row fields, FK-bound to the
 * parent with ON DELETE CASCADE.
 *
 * Each enum gets a transaction-safe CREATE TYPE guarded by DO/EXCEPTION; all
 * tables / FKs / indexes use IF NOT EXISTS / IF NOT EXISTS so re-running the
 * migration on an already-partially-applied DB is safe.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    /* -------- enums -------- */
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_video_provider" AS ENUM('youtube', 'vimeo', 'url');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_video_aspect_ratio" AS ENUM('16:9', '4:3', '1:1');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_gallery_columns" AS ENUM('2', '3', '4');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
    DO $$ BEGIN
      CREATE TYPE "public"."enum_pages_blocks_spacer_size" AS ENUM('sm', 'md', 'lg', 'xl');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    /* -------- video -------- */
    CREATE TABLE IF NOT EXISTS "pages_blocks_video" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar,
      "provider" "enum_pages_blocks_video_provider" DEFAULT 'youtube',
      "video_id" varchar,
      "aspect_ratio" "enum_pages_blocks_video_aspect_ratio" DEFAULT '16:9',
      "caption" varchar,
      "block_name" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_video"
        ADD CONSTRAINT "pages_blocks_video_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_video_order_idx" ON "pages_blocks_video" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_video_parent_id_idx" ON "pages_blocks_video" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_video_path_idx" ON "pages_blocks_video" USING btree ("_path");

    /* -------- gallery + images -------- */
    CREATE TABLE IF NOT EXISTS "pages_blocks_gallery_images" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_url" varchar,
      "alt" varchar,
      "caption" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_gallery" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar,
      "columns" "enum_pages_blocks_gallery_columns" DEFAULT '3',
      "block_name" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_gallery_images"
        ADD CONSTRAINT "pages_blocks_gallery_images_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_gallery"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_gallery"
        ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_images_order_idx" ON "pages_blocks_gallery_images" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_images_parent_id_idx" ON "pages_blocks_gallery_images" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");

    /* -------- logo_cloud + logos -------- */
    CREATE TABLE IF NOT EXISTS "pages_blocks_logo_cloud_logos" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "image_url" varchar,
      "alt" varchar,
      "href" varchar
    );

    CREATE TABLE IF NOT EXISTS "pages_blocks_logo_cloud" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "heading" varchar,
      "grayscale" boolean DEFAULT true,
      "block_name" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_logo_cloud_logos"
        ADD CONSTRAINT "pages_blocks_logo_cloud_logos_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_logo_cloud"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_logo_cloud"
        ADD CONSTRAINT "pages_blocks_logo_cloud_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_logo_cloud_logos_order_idx" ON "pages_blocks_logo_cloud_logos" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_logo_cloud_logos_parent_id_idx" ON "pages_blocks_logo_cloud_logos" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_logo_cloud_order_idx" ON "pages_blocks_logo_cloud" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_logo_cloud_parent_id_idx" ON "pages_blocks_logo_cloud" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_logo_cloud_path_idx" ON "pages_blocks_logo_cloud" USING btree ("_path");

    /* -------- spacer -------- */
    CREATE TABLE IF NOT EXISTS "pages_blocks_spacer" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "size" "enum_pages_blocks_spacer_size" DEFAULT 'md',
      "show_divider" boolean DEFAULT false,
      "block_name" varchar
    );

    DO $$ BEGIN
      ALTER TABLE "pages_blocks_spacer"
        ADD CONSTRAINT "pages_blocks_spacer_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "pages_blocks_spacer_order_idx" ON "pages_blocks_spacer" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "pages_blocks_spacer_parent_id_idx" ON "pages_blocks_spacer" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "pages_blocks_spacer_path_idx" ON "pages_blocks_spacer" USING btree ("_path");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "pages_blocks_spacer" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_logo_cloud_logos" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_logo_cloud" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_gallery_images" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_gallery" CASCADE;
    DROP TABLE IF EXISTS "pages_blocks_video" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_spacer_size";
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_gallery_columns";
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_video_aspect_ratio";
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_video_provider";
  `)
}
