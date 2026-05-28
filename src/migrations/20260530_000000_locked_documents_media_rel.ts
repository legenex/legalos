import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `media_id` FK column to `payload_locked_documents_rels`.
 *
 * Payload v3 keeps one rels table per relationship target so its document-
 * locking subsystem can record which row a user is currently editing. When
 * we shipped the Media collection in 20260528_180000_add_media_collection,
 * we created the `media` table but didn't add the matching rels column —
 * so every query Payload runs against payload_locked_documents that
 * enumerates all collection FKs blew up with "column media_id does not
 * exist". That bubbles up into the admin builder as a 'Failed query: …'
 * red banner.
 *
 * This migration adds the column + FK (ON DELETE cascade so deleting a
 * media row also clears any lock referencing it) + index, all idempotent
 * via IF NOT EXISTS / DO/EXCEPTION so re-runs are safe.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "media_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_media_fk"
        FOREIGN KEY ("media_id") REFERENCES "public"."media"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx"
      ON "payload_locked_documents_rels" USING btree ("media_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_media_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_media_fk";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "media_id";
  `)
}
