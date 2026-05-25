import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Sets the default of sites.status to 'draft'. Runs after the sibling
 * migration that added the 'draft' enum value, in its own transaction so
 * Postgres allows referencing the newly-committed enum value.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "sites" ALTER COLUMN "status" SET DEFAULT 'draft';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "sites" ALTER COLUMN "status" SET DEFAULT 'active';`)
}
