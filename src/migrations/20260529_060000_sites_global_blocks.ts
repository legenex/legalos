import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * NO-OP migration. Originally added top-level `site_nav` and `site_footer`
 * jsonb columns to `sites`, but that broke production environments where
 * the column add hadn't run yet (the SELECT enumerated every column,
 * including the missing ones, and threw before Payload's startup
 * completed). The global-nav / global-footer values are now stored inside
 * the existing `brand_identity` jsonb column instead, which has been on
 * the table since the initial migration — no schema change needed.
 *
 * The DROP statements below are also idempotent so any environment where
 * the original ADD COLUMN ran successfully can safely re-apply this
 * migration and end up in the same state as a fresh install.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "sites"
      DROP COLUMN IF EXISTS "site_nav",
      DROP COLUMN IF EXISTS "site_footer";
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // No-op — see file header. There's nothing to reverse.
}
