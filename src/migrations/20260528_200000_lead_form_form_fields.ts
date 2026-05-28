import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds the `form_fields` jsonb column to `pages_blocks_lead_form` so the
 * page builder can author custom form fields per lead_form block. The shape
 * stored in this column is:
 *   [{ name, label, placeholder, type, required, half_width, options?: [{value,label}] }]
 *
 * When NULL or empty, the public LeadForm renderer falls back to the legacy
 * hardcoded fields (first_name/last_name/email/phone/state/zip) so existing
 * pages keep working untouched.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_lead_form"
      ADD COLUMN IF NOT EXISTS "form_fields" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_lead_form"
      DROP COLUMN IF EXISTS "form_fields";
  `)
}
