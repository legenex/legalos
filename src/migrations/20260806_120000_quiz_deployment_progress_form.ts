import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * A quiz deployment can override its template's progress form.
 *
 * Each of the twenty quiz templates carries one progress treatment, which is
 * what most distinguishes them. This column lets a deployment keep a template's
 * layout and answers while showing progress a different way - dots instead of a
 * bar, a milestone rail instead of a count - without a twenty-first template
 * being invented for the combination.
 *
 * Nullable, and null means "whatever the template says", so no existing row
 * needs backfilling and nothing changes appearance until somebody chooses.
 *
 * Guarded on the table existing, which is unusual and deliberate. The six
 * funnel_* tables are finding F001: they are declared on collections and
 * created by Payload's dev auto-push, and NO committed migration creates them.
 * On a database where that push has never run the table is absent, and an
 * unguarded ALTER would fail the whole migration for a table this migration did
 * not create and is not responsible for. This does not fix F001; it declines to
 * make it worse.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'funnel_quiz_deployments'
      ) THEN
        ALTER TABLE "funnel_quiz_deployments" ADD COLUMN IF NOT EXISTS "progress_form" varchar;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = current_schema() AND table_name = 'funnel_quiz_deployments'
      ) THEN
        ALTER TABLE "funnel_quiz_deployments" DROP COLUMN IF EXISTS "progress_form";
      END IF;
    END $$;
  `)
}
