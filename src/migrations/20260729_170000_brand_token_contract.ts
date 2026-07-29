import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * The brand token contract (P0-B).
 *
 * Adds the columns that make a brand the single owner of colour, and backfills
 * them from what each Site already has so no live page changes appearance.
 *
 * The backfill is the delicate part, and it is worth stating why each line is
 * what it is:
 *
 *  - `bg` takes the value of the existing `surface`. Today the public layout
 *    renders the page background from `--site-surface`, so `surface` IS the
 *    page background in practice regardless of its name. Copying it into `bg`
 *    and pointing the layout at `--site-bg` keeps every existing site pixel
 *    identical while giving `surface` back its real meaning: the card colour.
 *
 *  - `cta` takes `primary`. Every site currently draws buttons in the primary
 *    colour because there was no separate action token. Copying preserves that,
 *    and a brand that wants a distinct button colour can now say so.
 *
 *  - `ink_muted` takes `muted`, a rename with no semantic change.
 *
 *  - The `_ink` values, `surface_2` and `border` are deliberately NOT
 *    backfilled. Blank means "derive me", and derivation is contrast-verified
 *    against the surface each one actually sits on. Writing a guess into them
 *    now would freeze today's approximation and defeat the check.
 *
 * COALESCE guards every backfill so re-running is safe and a value someone has
 * already set by hand is never overwritten.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "sites"
      ADD COLUMN IF NOT EXISTS "brand_primary_ink" varchar,
      ADD COLUMN IF NOT EXISTS "brand_accent_ink" varchar,
      ADD COLUMN IF NOT EXISTS "brand_cta" varchar,
      ADD COLUMN IF NOT EXISTS "brand_cta_ink" varchar,
      ADD COLUMN IF NOT EXISTS "brand_bg" varchar,
      ADD COLUMN IF NOT EXISTS "brand_surface_2" varchar,
      ADD COLUMN IF NOT EXISTS "brand_ink_muted" varchar,
      ADD COLUMN IF NOT EXISTS "brand_border" varchar,
      ADD COLUMN IF NOT EXISTS "brand_radius" varchar,
      ADD COLUMN IF NOT EXISTS "brand_radius_lg" varchar,
      ADD COLUMN IF NOT EXISTS "brand_shadow" varchar;
  `)

  await db.execute(sql`
    UPDATE "sites" SET
      "brand_bg"        = COALESCE("brand_bg", NULLIF("brand_surface", '')),
      "brand_cta"       = COALESCE("brand_cta", NULLIF("brand_primary", '')),
      "brand_ink_muted" = COALESCE("brand_ink_muted", NULLIF("brand_muted", ''));
  `)

  // A Site whose colours only ever lived in the brand_identity JSON (the funnel
  // brand store) gets them promoted into the canonical columns, so there is one
  // owner rather than two stores that disagree. Existing column values always
  // win; this only fills holes.
  await db.execute(sql`
    UPDATE "sites" SET
      "brand_primary" = COALESCE(NULLIF("brand_primary", ''), "brand_identity"->'colors'->>'primary'),
      "brand_accent"  = COALESCE(NULLIF("brand_accent", ''),  "brand_identity"->'colors'->>'accent'),
      "brand_bg"      = COALESCE(NULLIF("brand_bg", ''),      "brand_identity"->'colors'->>'background'),
      "brand_surface" = COALESCE(NULLIF("brand_surface", ''), "brand_identity"->'colors'->>'cardBg'),
      "brand_cta"     = COALESCE(NULLIF("brand_cta", ''),     "brand_identity"->'colors'->>'primary')
    WHERE "brand_identity" IS NOT NULL;
  `)

  // Last resort for the four required tokens: a Site with no usable value in
  // either store would throw at render. Rather than let that surface as a 500
  // on a customer page, seed the two structural ones from the neutral defaults
  // the collection already declares. primary and cta are NOT seeded - a wrong
  // brand colour is exactly the failure this whole change exists to prevent,
  // so those stay blank and are caught by the publish gate instead.
  await db.execute(sql`
    UPDATE "sites" SET
      "brand_bg"  = COALESCE(NULLIF("brand_bg", ''), '#FFFFFF'),
      "brand_ink" = COALESCE(NULLIF("brand_ink", ''), '#0E1116');
  `)
}

/**
 * Down drops only the added columns. The backfilled values in pre-existing
 * columns are left alone: they were copies of data that is still there.
 */
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "sites"
      DROP COLUMN IF EXISTS "brand_primary_ink",
      DROP COLUMN IF EXISTS "brand_accent_ink",
      DROP COLUMN IF EXISTS "brand_cta",
      DROP COLUMN IF EXISTS "brand_cta_ink",
      DROP COLUMN IF EXISTS "brand_bg",
      DROP COLUMN IF EXISTS "brand_surface_2",
      DROP COLUMN IF EXISTS "brand_ink_muted",
      DROP COLUMN IF EXISTS "brand_border",
      DROP COLUMN IF EXISTS "brand_radius",
      DROP COLUMN IF EXISTS "brand_radius_lg",
      DROP COLUMN IF EXISTS "brand_shadow";
  `)
}
