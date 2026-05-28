import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds site_nav and site_footer (both jsonb, nullable) to the `sites` table.
 * Each stores one body_blocks block (a `nav_header` for site_nav, a
 * `site_footer` for site_footer). The public route auto-prepends /
 * auto-appends them when a Page's own body_blocks doesn't include the
 * matching type, so authors can declare the global nav and footer once per
 * Site instead of duplicating them on every page.
 *
 * Existing rows keep working because both columns are NULL by default; the
 * route treats NULL as 'no global block configured' and skips the
 * prepend/append.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "sites"
      ADD COLUMN IF NOT EXISTS "site_nav" jsonb,
      ADD COLUMN IF NOT EXISTS "site_footer" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "sites"
      DROP COLUMN IF EXISTS "site_nav",
      DROP COLUMN IF EXISTS "site_footer";
  `)
}
