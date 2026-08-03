import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `buildlog_comments_id` FK column to `payload_locked_documents_rels`.
 *
 * This is the same omission 20260530_000000_locked_documents_media_rel fixed for
 * Media, repeated for BuildLogComments: 20260729_230000_buildlog_comments created
 * the `buildlog_comments` table but not the rels column that Payload's document-
 * locking subsystem needs.
 *
 * The consequence is much wider than the collection that caused it. Payload
 * clears a document's locks as part of deleting it, and that query enumerates
 * EVERY collection's FK column on `payload_locked_documents_rels` in one WHERE
 * clause. One missing column therefore fails the query for a delete of any
 * document in any collection - deleting a Domain raised
 * "column ... buildlog_comments_id does not exist" even though nothing about
 * Domains or the build log was involved. Deletes ran inside a transaction, so
 * they rolled back cleanly and nothing was half-removed; the operation simply
 * became impossible app-wide.
 *
 * Adding a collection is what creates this hazard, so the shape to remember is:
 * a new collection needs its `payload_locked_documents_rels` column in the same
 * migration, not only its own table. `checkLockedDocumentRels` in
 * src/lib/system-health/checks.ts now compares the two and reports drift on
 * /admin/system rather than waiting for someone to try a delete.
 *
 * DDL is idempotent (IF NOT EXISTS + a duplicate_object guard on the
 * constraint) so it converges whether or not a dev auto-push already added the
 * column. ON DELETE cascade matches every other FK on this table: removing a
 * comment clears any lock that referenced it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      ADD COLUMN IF NOT EXISTS "buildlog_comments_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_buildlog_comments_fk"
        FOREIGN KEY ("buildlog_comments_id") REFERENCES "public"."buildlog_comments"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_buildlog_comments_id_idx"
      ON "payload_locked_documents_rels" USING btree ("buildlog_comments_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_locked_documents_rels_buildlog_comments_id_idx";
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_buildlog_comments_fk";
    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "buildlog_comments_id";
  `)
}
