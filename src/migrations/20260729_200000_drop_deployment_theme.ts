import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Removes per-deployment colour authoring (P0-C).
 *
 * A deployment could generate and store its own palette. That made it a third
 * owner of colour alongside the brand record and the hardcoded values inside
 * components, and three owners of one value produce arbitrary output. Colour
 * now has exactly one owner: the brand.
 *
 * The column is RENAMED, not dropped.
 *
 * The instruction was to report any deployment carrying a custom palette before
 * destroying the data, and this workspace has no database access to run that
 * report. Renaming satisfies both halves: the live path is gone immediately
 * (the collection no longer declares the field, so Payload stops selecting it
 * and nothing can read or write it), while every stored palette survives intact
 * and reviewable:
 *
 *   SELECT d.id, d.path, s.name AS brand, d.theme_overrides_removed_20260729
 *   FROM funnel_quiz_deployments d
 *   LEFT JOIN sites s ON s.id = d.site_id
 *   WHERE d.theme_overrides_removed_20260729 IS NOT NULL;
 *
 * Run that after deploying, confirm each brand's real colours are correct on
 * the brand identity, and a later migration can drop the column for good.
 * Dropping it now would delete the only record of what those deployments were
 * displaying, which is exactly the information needed to check nothing regressed.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'funnel_quiz_deployments'
          AND column_name = 'theme_overrides'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'funnel_quiz_deployments'
          AND column_name = 'theme_overrides_removed_20260729'
      ) THEN
        ALTER TABLE "funnel_quiz_deployments"
          RENAME COLUMN "theme_overrides" TO "theme_overrides_removed_20260729";
      END IF;
    END $$;
  `)
}

/** Restores the column name. The data was never destroyed, so this is lossless. */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'funnel_quiz_deployments'
          AND column_name = 'theme_overrides_removed_20260729'
      ) THEN
        ALTER TABLE "funnel_quiz_deployments"
          RENAME COLUMN "theme_overrides_removed_20260729" TO "theme_overrides";
      END IF;
    END $$;
  `)
}
