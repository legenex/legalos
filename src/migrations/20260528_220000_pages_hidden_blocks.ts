import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `hidden_blocks` (jsonb, nullable) to the `pages` table. Stores an
 * array of body_blocks ids the page author has hidden via the builder.
 * The public BlockRenderer filters these out on render; the editor still
 * shows them but greys them out so the user can toggle them back on.
 *
 * Nullable + jsonb means existing rows are unaffected; the renderer treats
 * NULL/empty as 'nothing hidden', so no backfill is needed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages"
      ADD COLUMN IF NOT EXISTS "hidden_blocks" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages"
      DROP COLUMN IF EXISTS "hidden_blocks";
  `)
}
