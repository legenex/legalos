import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Comments on the build log.
 *
 * The log records what shipped; this is where the reply goes, so feedback on a
 * specific decision lives next to that decision instead of in a chat thread.
 *
 * `entry_id` / `item_id` are stable slugs derived from the log's own content
 * rather than foreign keys, because the log itself is code, not rows - there is
 * nothing to reference. `target_label` stores the title the comment was written
 * against so a later rename leaves a readable orphan rather than a dangling
 * slug.
 *
 * `author_id` is ON DELETE SET NULL and `author_email` is captured at write
 * time, so removing a user keeps their comments readable and attributable.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "enum_buildlog_comments_status" AS ENUM ('open', 'resolved');
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "buildlog_comments" (
      "id" serial PRIMARY KEY NOT NULL,
      "entry_id" varchar NOT NULL,
      "item_id" varchar,
      "target_label" varchar,
      "body" varchar NOT NULL,
      "status" "enum_buildlog_comments_status" DEFAULT 'open',
      "author_id" integer,
      "author_email" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );
  `)

  await db.execute(sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'buildlog_comments_author_id_users_id_fk') THEN
        ALTER TABLE "buildlog_comments"
          ADD CONSTRAINT "buildlog_comments_author_id_users_id_fk"
          FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
      END IF;
    END $$;
  `)

  // The board reads every comment for the log in one pass and groups them in
  // memory, so the hot lookup is by entry, then by item within it.
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "buildlog_comments_entry_idx" ON "buildlog_comments" USING btree ("entry_id");
    CREATE INDEX IF NOT EXISTS "buildlog_comments_entry_item_idx" ON "buildlog_comments" USING btree ("entry_id", "item_id");
    CREATE INDEX IF NOT EXISTS "buildlog_comments_status_idx" ON "buildlog_comments" USING btree ("status");
    CREATE INDEX IF NOT EXISTS "buildlog_comments_created_at_idx" ON "buildlog_comments" USING btree ("created_at");
  `)
}

/**
 * Drops the table. Unlike the funnel migrations, this one genuinely created it,
 * so reversing it destroys only what it made. It does destroy written comments,
 * which is why it should not be run casually.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE IF EXISTS "buildlog_comments";`)
  await db.execute(sql`DROP TYPE IF EXISTS "enum_buildlog_comments_status";`)
}
