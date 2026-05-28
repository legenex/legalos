import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds `block_meta` (jsonb, nullable) to the `pages` table. Stores
 * per-body_blocks-id metadata — currently hide_mobile / hide_desktop
 * responsive visibility flags toggled from the page builder. Keyed by
 * block id so we don't need to fan column changes across every
 * blockType-specific table.
 *
 * Nullable + jsonb; existing rows are untouched and the renderer treats
 * NULL/empty as 'no per-block metadata', so no backfill is needed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages"
      ADD COLUMN IF NOT EXISTS "block_meta" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages"
      DROP COLUMN IF EXISTS "block_meta";
  `)
}
