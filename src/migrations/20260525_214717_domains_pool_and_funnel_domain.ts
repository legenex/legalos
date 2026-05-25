import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "domains" ALTER COLUMN "site_id" DROP NOT NULL;
  ALTER TABLE "quizzes" ADD COLUMN "domain_id" integer;
  ALTER TABLE "landing_pages" ADD COLUMN "domain_id" integer;
  ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_domain_id_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."domains"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "quizzes_domain_idx" ON "quizzes" USING btree ("domain_id");
  CREATE INDEX "landing_pages_domain_idx" ON "landing_pages" USING btree ("domain_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_domain_id_domains_id_fk";
  
  ALTER TABLE "landing_pages" DROP CONSTRAINT "landing_pages_domain_id_domains_id_fk";
  
  DROP INDEX "quizzes_domain_idx";
  DROP INDEX "landing_pages_domain_idx";
  ALTER TABLE "domains" ALTER COLUMN "site_id" SET NOT NULL;
  ALTER TABLE "quizzes" DROP COLUMN "domain_id";
  ALTER TABLE "landing_pages" DROP COLUMN "domain_id";`)
}
