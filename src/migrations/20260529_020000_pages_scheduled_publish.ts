import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the 'scheduled' value to the pages status enum and a publish_at
 * timestamptz column. When status='scheduled', the public route renders
 * the page only if publish_at <= now() — so authors can pick a future
 * datetime and the page goes live without a manual publish click.
 *
 * Notes on the enum change:
 *   ALTER TYPE ... ADD VALUE has to run OUTSIDE a transaction in
 *   PostgreSQL < 12 and even on >=12 the new value can't be used in the
 *   same transaction that defined it. Payload's migration runner wraps
 *   each migration in a transaction, so we route the ADD VALUE via the
 *   connection pool directly. The column add stays inside the
 *   transaction because that's safe.
 */
export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  // ADD VALUE — bypass the transaction so the new label is usable
  // immediately on connections opened after the migration finishes.
  const pool = (
    payload.db as unknown as {
      pool?: { connect(): Promise<{ query(sql: string): Promise<unknown>; release(): void }> }
    }
  ).pool
  if (pool) {
    const client = await pool.connect()
    try {
      await client.query(
        `ALTER TYPE "public"."enum_pages_status" ADD VALUE IF NOT EXISTS 'scheduled';`,
      )
    } finally {
      client.release()
    }
  } else {
    // Fallback for adapters that don't expose a pool — best-effort, may
    // need a re-run if the same-transaction restriction trips.
    await db.execute(sql`ALTER TYPE "public"."enum_pages_status" ADD VALUE IF NOT EXISTS 'scheduled';`)
  }

  await db.execute(sql`
    ALTER TABLE "pages"
      ADD COLUMN IF NOT EXISTS "publish_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Postgres doesn't support DROP VALUE on an enum without rebuilding it,
  // so we only drop the column. Any pages still on 'scheduled' would
  // need to be migrated out before reverting the enum manually.
  await db.execute(sql`
    ALTER TABLE "pages"
      DROP COLUMN IF EXISTS "publish_at";
  `)
}
