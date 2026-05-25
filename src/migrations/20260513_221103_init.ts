import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_site_bindings_role" AS ENUM('admin', 'editor', 'analyst');
  CREATE TYPE "public"."enum_users_status" AS ENUM('invited', 'active', 'disabled');
  CREATE TYPE "public"."enum_sites_status" AS ENUM('active', 'paused', 'archived');
  CREATE TYPE "public"."enum_sites_vertical" AS ENUM('mass-tort', 'mva', 'workers-comp', 'personal-injury', 'medical-malpractice', 'class-action', 'multi');
  CREATE TYPE "public"."enum_sites_default_tone" AS ENUM('direct', 'empathetic');
  CREATE TYPE "public"."enum_domains_kind" AS ENUM('preview', 'custom');
  CREATE TYPE "public"."enum_domains_status" AS ENUM('pending', 'verified', 'provisioning', 'active', 'error');
  CREATE TYPE "public"."enum_domains_ssl_status" AS ENUM('unknown', 'pending', 'active', 'error');
  CREATE TYPE "public"."enum_pages_blocks_lead_form_funnel_type" AS ENUM('contact-form', 'quiz', 'landing-page', 'page', 'advertorial');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_pages_template_key" AS ENUM('custom', 'home', 'privacy', 'privacy-policy', 'terms', 'partners', 'thanks-dq', 'submitted', 'tcpa', 'disclosures');
  CREATE TYPE "public"."enum_shared_legal_templates_template_key" AS ENUM('home', 'privacy', 'privacy-policy', 'terms', 'partners', 'thanks-dq', 'submitted', 'tcpa', 'disclosures');
  CREATE TYPE "public"."enum_quizzes_steps_kind" AS ENUM('single', 'multi', 'text', 'date', 'contact');
  CREATE TYPE "public"."enum_quizzes_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_landing_pages_status" AS ENUM('draft', 'published', 'archived');
  CREATE TYPE "public"."enum_leads_source_entity_type" AS ENUM('quiz', 'landing-page', 'contact-form', 'page', 'advertorial');
  CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'contacted', 'qualified', 'soft-dq', 'hard-dq', 'sold', 'archived');
  CREATE TYPE "public"."enum_blog_posts_status" AS ENUM('draft', 'published', 'archived');
  CREATE TABLE "users_site_bindings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"role" "enum_users_site_bindings_role" NOT NULL,
  	"invited_at" timestamp(3) with time zone,
  	"accepted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"avatar_url" varchar,
  	"super_admin" boolean DEFAULT false,
  	"status" "enum_users_status" DEFAULT 'active',
  	"last_login_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "sites_slug_redirects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL
  );
  
  CREATE TABLE "sites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_sites_status" DEFAULT 'active' NOT NULL,
  	"vertical" "enum_sites_vertical" DEFAULT 'multi' NOT NULL,
  	"tagline" varchar,
  	"default_phone" varchar,
  	"default_phone_tel" varchar,
  	"org_name" varchar,
  	"org_address" varchar,
  	"support_email" varchar,
  	"brand_logo_url" varchar,
  	"brand_favicon_url" varchar,
  	"brand_primary" varchar DEFAULT '#0B1F3A',
  	"brand_accent" varchar DEFAULT '#E8B14B',
  	"brand_surface" varchar DEFAULT '#F7F5F0',
  	"brand_ink" varchar DEFAULT '#0E1116',
  	"brand_muted" varchar DEFAULT '#5C6470',
  	"brand_success" varchar DEFAULT '#1F9D55',
  	"brand_warning" varchar DEFAULT '#E8B14B',
  	"brand_danger" varchar DEFAULT '#C03A2B',
  	"brand_font_heading" varchar DEFAULT 'Inter',
  	"brand_font_body" varchar DEFAULT 'Inter',
  	"default_tone" "enum_sites_default_tone" DEFAULT 'empathetic',
  	"default_disclaimer_md" varchar,
  	"archived_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "domains_redirects_from" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"host" varchar NOT NULL
  );
  
  CREATE TABLE "domains" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"host" varchar NOT NULL,
  	"kind" "enum_domains_kind" DEFAULT 'custom' NOT NULL,
  	"primary" boolean DEFAULT false,
  	"status" "enum_domains_status" DEFAULT 'pending',
  	"ssl_status" "enum_domains_ssl_status" DEFAULT 'unknown',
  	"verification_token" varchar,
  	"dns_records" jsonb,
  	"last_checked_at" timestamp(3) with time zone,
  	"plesk_domain_id" varchar,
  	"provisioning_error" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "pages_blocks_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"secondary_cta_label" varchar,
  	"secondary_cta_href" varchar,
  	"image_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_prose" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"markdown" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_image" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"alt" varchar,
  	"caption" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"sub" varchar,
  	"label" varchar,
  	"href" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_bullet_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar
  );
  
  CREATE TABLE "pages_blocks_bullet_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_embed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"html" varchar,
  	"note" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_cards_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"icon" varchar
  );
  
  CREATE TABLE "pages_blocks_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_stats_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_testimonials_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar,
  	"attribution" varchar,
  	"avatar_url" varchar
  );
  
  CREATE TABLE "pages_blocks_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "pages_blocks_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_nav_header_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_nav_header" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"cta_label" varchar,
  	"cta_href" varchar,
  	"show_phone" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_site_footer_columns_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"href" varchar
  );
  
  CREATE TABLE "pages_blocks_site_footer_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar
  );
  
  CREATE TABLE "pages_blocks_site_footer" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"legal_md" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_trust_strip_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_trust_strip" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_services_grid_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"icon" varchar
  );
  
  CREATE TABLE "pages_blocks_services_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_how_it_works_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_how_it_works" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_recent_wins_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"amount" varchar,
  	"case_type" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "pages_blocks_recent_wins" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"disclaimer" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_final_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"primary_cta_label" varchar,
  	"primary_cta_href" varchar,
  	"show_phone" boolean DEFAULT true,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_disclosure" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"markdown" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_custom_html" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"html" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_lead_form" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"sub" varchar,
  	"submit_label" varchar DEFAULT 'See if I qualify',
  	"consent_md" varchar,
  	"funnel_type" "enum_pages_blocks_lead_form_funnel_type" DEFAULT 'contact-form',
  	"funnel_id" varchar,
  	"success_slug" varchar DEFAULT '/submitted',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_slug_redirects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_pages_status" DEFAULT 'draft' NOT NULL,
  	"template_key" "enum_pages_template_key" DEFAULT 'custom' NOT NULL,
  	"uses_shared_template" boolean DEFAULT true,
  	"shared_template_overrides" jsonb,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_url" varchar,
  	"schema_json" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shared_legal_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"template_key" "enum_shared_legal_templates_template_key" NOT NULL,
  	"body_markdown_with_vars" varchar NOT NULL,
  	"default_meta_title" varchar,
  	"default_meta_description" varchar,
  	"last_reviewed_by_id" integer,
  	"last_reviewed_at" timestamp(3) with time zone,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quizzes_steps_choices" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"dq" boolean DEFAULT false,
  	"next_step_id" varchar
  );
  
  CREATE TABLE "quizzes_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"step_id" varchar NOT NULL,
  	"question" varchar NOT NULL,
  	"help_text" varchar,
  	"kind" "enum_quizzes_steps_kind" DEFAULT 'single' NOT NULL,
  	"is_terminal" boolean DEFAULT false
  );
  
  CREATE TABLE "quizzes_slug_redirects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL
  );
  
  CREATE TABLE "quizzes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_quizzes_status" DEFAULT 'draft' NOT NULL,
  	"description" varchar,
  	"dq_destination_slug" varchar DEFAULT '/thanks',
  	"submitted_destination_slug" varchar DEFAULT '/submitted',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "landing_pages_body_sections" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body_markdown" varchar
  );
  
  CREATE TABLE "landing_pages_social_proof" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"attribution" varchar
  );
  
  CREATE TABLE "landing_pages_slug_redirects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL
  );
  
  CREATE TABLE "landing_pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_landing_pages_status" DEFAULT 'draft' NOT NULL,
  	"quiz_id" integer,
  	"hero_eyebrow" varchar,
  	"hero_heading" varchar NOT NULL,
  	"hero_sub" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "leads_status_history" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"status" varchar NOT NULL,
  	"changed_at" timestamp(3) with time zone NOT NULL,
  	"changed_by_id" integer,
  	"note" varchar
  );
  
  CREATE TABLE "leads_delivery_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone NOT NULL,
  	"step" varchar NOT NULL,
  	"ok" boolean DEFAULT false,
  	"detail" varchar
  );
  
  CREATE TABLE "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"source_entity_type" "enum_leads_source_entity_type" NOT NULL,
  	"source_entity_id" varchar,
  	"test_capture" boolean DEFAULT false,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"contact_first_name" varchar,
  	"contact_last_name" varchar,
  	"contact_email" varchar,
  	"contact_phone" varchar,
  	"contact_state" varchar,
  	"contact_zip" varchar,
  	"quiz_answers" jsonb,
  	"attribution" jsonb,
  	"trustedform_cert_url" varchar,
  	"jornaya_lead_id" varchar,
  	"hlr_result" jsonb,
  	"buyer_id" varchar,
  	"sold_at" timestamp(3) with time zone,
  	"sale_price" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "blog_posts_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL
  );
  
  CREATE TABLE "blog_posts_slug_redirects" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL
  );
  
  CREATE TABLE "blog_posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"status" "enum_blog_posts_status" DEFAULT 'draft' NOT NULL,
  	"excerpt" varchar,
  	"body_markdown" varchar NOT NULL,
  	"hero_image_url" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"og_image_url" varchar,
  	"humanizer_passes" numeric DEFAULT 0,
  	"ai_generated" boolean DEFAULT false,
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "numbers_page_paths" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL
  );
  
  CREATE TABLE "numbers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"display" varchar NOT NULL,
  	"tel" varchar NOT NULL,
  	"fallback" boolean DEFAULT false,
  	"truecall_campaign_id" varchar,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tracking_configs_google_ads_conversion_actions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"conversion_id" varchar NOT NULL,
  	"conversion_label" varchar NOT NULL
  );
  
  CREATE TABLE "tracking_configs_truecall_page_path_mapping" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"path" varchar NOT NULL,
  	"campaign_id" varchar NOT NULL
  );
  
  CREATE TABLE "tracking_configs_custom_webhooks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"event_filter" varchar,
  	"hmac_secret" varchar
  );
  
  CREATE TABLE "tracking_configs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_id" integer NOT NULL,
  	"meta_pixel_enabled" boolean DEFAULT false,
  	"meta_pixel_capi_token" varchar,
  	"meta_pixel_test_event_code" varchar,
  	"meta_pixel_dataset_id" varchar,
  	"google_ads_enabled" boolean DEFAULT false,
  	"google_ads_tag_id" varchar,
  	"ga4_enabled" boolean DEFAULT false,
  	"ga4_measurement_id" varchar,
  	"ga4_api_secret" varchar,
  	"tiktok_enabled" boolean DEFAULT false,
  	"tiktok_pixel_code" varchar,
  	"tiktok_access_token" varchar,
  	"tiktok_test_event_code" varchar,
  	"gtm_enabled" boolean DEFAULT false,
  	"gtm_container_id" varchar,
  	"trustedform_enabled" boolean DEFAULT false,
  	"trustedform_account_id" varchar,
  	"trustedform_api_key" varchar,
  	"trustedform_retain_certs" boolean DEFAULT false,
  	"trustedform_auto_claim" boolean DEFAULT true,
  	"truecall_enabled" boolean DEFAULT false,
  	"truecall_api_key" varchar,
  	"truecall_account_id" varchar,
  	"jornaya_enabled" boolean DEFAULT false,
  	"jornaya_account_id" varchar,
  	"jornaya_campaign_id" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"user_id" integer NOT NULL,
  	"action" varchar NOT NULL,
  	"entity_type" varchar NOT NULL,
  	"entity_id" varchar NOT NULL,
  	"site_id" integer,
  	"diff" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"sites_id" integer,
  	"domains_id" integer,
  	"pages_id" integer,
  	"shared_legal_templates_id" integer,
  	"quizzes_id" integer,
  	"landing_pages_id" integer,
  	"leads_id" integer,
  	"blog_posts_id" integer,
  	"numbers_id" integer,
  	"tracking_configs_id" integer,
  	"audit_log_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "integration_config_slack_webhooks" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"events" varchar
  );
  
  CREATE TABLE "integration_config_github_repos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"site_id" integer,
  	"repo_url" varchar
  );
  
  CREATE TABLE "integration_config" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"smtp_host" varchar,
  	"smtp_port" numeric DEFAULT 587,
  	"smtp_user" varchar,
  	"smtp_pass" varchar,
  	"smtp_from_name" varchar DEFAULT 'Legenex LegalOS',
  	"smtp_from_email" varchar DEFAULT 'noreply@legenex.com',
  	"search_console_root_verification_method" varchar,
  	"search_console_root_verification_token" varchar,
  	"billing_plan" varchar DEFAULT 'internal',
  	"billing_notes" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_site_bindings" ADD CONSTRAINT "users_site_bindings_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_site_bindings" ADD CONSTRAINT "users_site_bindings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sites_slug_redirects" ADD CONSTRAINT "sites_slug_redirects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "domains_redirects_from" ADD CONSTRAINT "domains_redirects_from_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "domains" ADD CONSTRAINT "domains_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_hero" ADD CONSTRAINT "pages_blocks_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_prose" ADD CONSTRAINT "pages_blocks_prose_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_image" ADD CONSTRAINT "pages_blocks_image_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_bullet_list_items" ADD CONSTRAINT "pages_blocks_bullet_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_bullet_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_bullet_list" ADD CONSTRAINT "pages_blocks_bullet_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_embed" ADD CONSTRAINT "pages_blocks_embed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards_items" ADD CONSTRAINT "pages_blocks_cards_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cards" ADD CONSTRAINT "pages_blocks_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats_items" ADD CONSTRAINT "pages_blocks_stats_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_stats"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_stats" ADD CONSTRAINT "pages_blocks_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials_items" ADD CONSTRAINT "pages_blocks_testimonials_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_testimonials" ADD CONSTRAINT "pages_blocks_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_items" ADD CONSTRAINT "pages_blocks_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq" ADD CONSTRAINT "pages_blocks_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_nav_header_links" ADD CONSTRAINT "pages_blocks_nav_header_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_nav_header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_nav_header" ADD CONSTRAINT "pages_blocks_nav_header_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_site_footer_columns_links" ADD CONSTRAINT "pages_blocks_site_footer_columns_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_site_footer_columns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_site_footer_columns" ADD CONSTRAINT "pages_blocks_site_footer_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_site_footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_site_footer" ADD CONSTRAINT "pages_blocks_site_footer_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_trust_strip_items" ADD CONSTRAINT "pages_blocks_trust_strip_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_trust_strip"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_trust_strip" ADD CONSTRAINT "pages_blocks_trust_strip_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_grid_items" ADD CONSTRAINT "pages_blocks_services_grid_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_services_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_grid" ADD CONSTRAINT "pages_blocks_services_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_how_it_works_steps" ADD CONSTRAINT "pages_blocks_how_it_works_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_how_it_works"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_how_it_works" ADD CONSTRAINT "pages_blocks_how_it_works_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_recent_wins_items" ADD CONSTRAINT "pages_blocks_recent_wins_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_recent_wins"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_recent_wins" ADD CONSTRAINT "pages_blocks_recent_wins_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_final_cta" ADD CONSTRAINT "pages_blocks_final_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_disclosure" ADD CONSTRAINT "pages_blocks_disclosure_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_custom_html" ADD CONSTRAINT "pages_blocks_custom_html_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_lead_form" ADD CONSTRAINT "pages_blocks_lead_form_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_slug_redirects" ADD CONSTRAINT "pages_slug_redirects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "shared_legal_templates" ADD CONSTRAINT "shared_legal_templates_last_reviewed_by_id_users_id_fk" FOREIGN KEY ("last_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "quizzes_steps_choices" ADD CONSTRAINT "quizzes_steps_choices_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quizzes_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quizzes_steps" ADD CONSTRAINT "quizzes_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quizzes_slug_redirects" ADD CONSTRAINT "quizzes_slug_redirects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages_body_sections" ADD CONSTRAINT "landing_pages_body_sections_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_social_proof" ADD CONSTRAINT "landing_pages_social_proof_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages_slug_redirects" ADD CONSTRAINT "landing_pages_slug_redirects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads_status_history" ADD CONSTRAINT "leads_status_history_changed_by_id_users_id_fk" FOREIGN KEY ("changed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "leads_status_history" ADD CONSTRAINT "leads_status_history_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads_delivery_log" ADD CONSTRAINT "leads_delivery_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "leads" ADD CONSTRAINT "leads_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "blog_posts_tags" ADD CONSTRAINT "blog_posts_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts_slug_redirects" ADD CONSTRAINT "blog_posts_slug_redirects_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "numbers_page_paths" ADD CONSTRAINT "numbers_page_paths_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."numbers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "numbers" ADD CONSTRAINT "numbers_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "tracking_configs_google_ads_conversion_actions" ADD CONSTRAINT "tracking_configs_google_ads_conversion_actions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tracking_configs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tracking_configs_truecall_page_path_mapping" ADD CONSTRAINT "tracking_configs_truecall_page_path_mapping_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tracking_configs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tracking_configs_custom_webhooks" ADD CONSTRAINT "tracking_configs_custom_webhooks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."tracking_configs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "tracking_configs" ADD CONSTRAINT "tracking_configs_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sites_fk" FOREIGN KEY ("sites_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_domains_fk" FOREIGN KEY ("domains_id") REFERENCES "public"."domains"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shared_legal_templates_fk" FOREIGN KEY ("shared_legal_templates_id") REFERENCES "public"."shared_legal_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quizzes_fk" FOREIGN KEY ("quizzes_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_landing_pages_fk" FOREIGN KEY ("landing_pages_id") REFERENCES "public"."landing_pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_posts_fk" FOREIGN KEY ("blog_posts_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_numbers_fk" FOREIGN KEY ("numbers_id") REFERENCES "public"."numbers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tracking_configs_fk" FOREIGN KEY ("tracking_configs_id") REFERENCES "public"."tracking_configs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integration_config_slack_webhooks" ADD CONSTRAINT "integration_config_slack_webhooks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."integration_config"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "integration_config_github_repos" ADD CONSTRAINT "integration_config_github_repos_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "integration_config_github_repos" ADD CONSTRAINT "integration_config_github_repos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."integration_config"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_site_bindings_order_idx" ON "users_site_bindings" USING btree ("_order");
  CREATE INDEX "users_site_bindings_parent_id_idx" ON "users_site_bindings" USING btree ("_parent_id");
  CREATE INDEX "users_site_bindings_site_idx" ON "users_site_bindings" USING btree ("site_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "sites_slug_redirects_order_idx" ON "sites_slug_redirects" USING btree ("_order");
  CREATE INDEX "sites_slug_redirects_parent_id_idx" ON "sites_slug_redirects" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "sites_slug_idx" ON "sites" USING btree ("slug");
  CREATE INDEX "sites_updated_at_idx" ON "sites" USING btree ("updated_at");
  CREATE INDEX "sites_created_at_idx" ON "sites" USING btree ("created_at");
  CREATE INDEX "domains_redirects_from_order_idx" ON "domains_redirects_from" USING btree ("_order");
  CREATE INDEX "domains_redirects_from_parent_id_idx" ON "domains_redirects_from" USING btree ("_parent_id");
  CREATE INDEX "domains_site_idx" ON "domains" USING btree ("site_id");
  CREATE UNIQUE INDEX "domains_host_idx" ON "domains" USING btree ("host");
  CREATE INDEX "domains_updated_at_idx" ON "domains" USING btree ("updated_at");
  CREATE INDEX "domains_created_at_idx" ON "domains" USING btree ("created_at");
  CREATE INDEX "pages_blocks_hero_order_idx" ON "pages_blocks_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_parent_id_idx" ON "pages_blocks_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_hero_path_idx" ON "pages_blocks_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_prose_order_idx" ON "pages_blocks_prose" USING btree ("_order");
  CREATE INDEX "pages_blocks_prose_parent_id_idx" ON "pages_blocks_prose" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_prose_path_idx" ON "pages_blocks_prose" USING btree ("_path");
  CREATE INDEX "pages_blocks_image_order_idx" ON "pages_blocks_image" USING btree ("_order");
  CREATE INDEX "pages_blocks_image_parent_id_idx" ON "pages_blocks_image" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_image_path_idx" ON "pages_blocks_image" USING btree ("_path");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_bullet_list_items_order_idx" ON "pages_blocks_bullet_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_bullet_list_items_parent_id_idx" ON "pages_blocks_bullet_list_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_bullet_list_order_idx" ON "pages_blocks_bullet_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_bullet_list_parent_id_idx" ON "pages_blocks_bullet_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_bullet_list_path_idx" ON "pages_blocks_bullet_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_embed_order_idx" ON "pages_blocks_embed" USING btree ("_order");
  CREATE INDEX "pages_blocks_embed_parent_id_idx" ON "pages_blocks_embed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_embed_path_idx" ON "pages_blocks_embed" USING btree ("_path");
  CREATE INDEX "pages_blocks_cards_items_order_idx" ON "pages_blocks_cards_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_items_parent_id_idx" ON "pages_blocks_cards_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_order_idx" ON "pages_blocks_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_cards_parent_id_idx" ON "pages_blocks_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cards_path_idx" ON "pages_blocks_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_stats_items_order_idx" ON "pages_blocks_stats_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_items_parent_id_idx" ON "pages_blocks_stats_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_order_idx" ON "pages_blocks_stats" USING btree ("_order");
  CREATE INDEX "pages_blocks_stats_parent_id_idx" ON "pages_blocks_stats" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_stats_path_idx" ON "pages_blocks_stats" USING btree ("_path");
  CREATE INDEX "pages_blocks_testimonials_items_order_idx" ON "pages_blocks_testimonials_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_items_parent_id_idx" ON "pages_blocks_testimonials_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_order_idx" ON "pages_blocks_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_testimonials_parent_id_idx" ON "pages_blocks_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_testimonials_path_idx" ON "pages_blocks_testimonials" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_items_order_idx" ON "pages_blocks_faq_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_items_parent_id_idx" ON "pages_blocks_faq_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_order_idx" ON "pages_blocks_faq" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_parent_id_idx" ON "pages_blocks_faq" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_path_idx" ON "pages_blocks_faq" USING btree ("_path");
  CREATE INDEX "pages_blocks_nav_header_links_order_idx" ON "pages_blocks_nav_header_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_nav_header_links_parent_id_idx" ON "pages_blocks_nav_header_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_nav_header_order_idx" ON "pages_blocks_nav_header" USING btree ("_order");
  CREATE INDEX "pages_blocks_nav_header_parent_id_idx" ON "pages_blocks_nav_header" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_nav_header_path_idx" ON "pages_blocks_nav_header" USING btree ("_path");
  CREATE INDEX "pages_blocks_site_footer_columns_links_order_idx" ON "pages_blocks_site_footer_columns_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_site_footer_columns_links_parent_id_idx" ON "pages_blocks_site_footer_columns_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_site_footer_columns_order_idx" ON "pages_blocks_site_footer_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_site_footer_columns_parent_id_idx" ON "pages_blocks_site_footer_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_site_footer_order_idx" ON "pages_blocks_site_footer" USING btree ("_order");
  CREATE INDEX "pages_blocks_site_footer_parent_id_idx" ON "pages_blocks_site_footer" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_site_footer_path_idx" ON "pages_blocks_site_footer" USING btree ("_path");
  CREATE INDEX "pages_blocks_trust_strip_items_order_idx" ON "pages_blocks_trust_strip_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_trust_strip_items_parent_id_idx" ON "pages_blocks_trust_strip_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_trust_strip_order_idx" ON "pages_blocks_trust_strip" USING btree ("_order");
  CREATE INDEX "pages_blocks_trust_strip_parent_id_idx" ON "pages_blocks_trust_strip" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_trust_strip_path_idx" ON "pages_blocks_trust_strip" USING btree ("_path");
  CREATE INDEX "pages_blocks_services_grid_items_order_idx" ON "pages_blocks_services_grid_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_grid_items_parent_id_idx" ON "pages_blocks_services_grid_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_grid_order_idx" ON "pages_blocks_services_grid" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_grid_parent_id_idx" ON "pages_blocks_services_grid" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_grid_path_idx" ON "pages_blocks_services_grid" USING btree ("_path");
  CREATE INDEX "pages_blocks_how_it_works_steps_order_idx" ON "pages_blocks_how_it_works_steps" USING btree ("_order");
  CREATE INDEX "pages_blocks_how_it_works_steps_parent_id_idx" ON "pages_blocks_how_it_works_steps" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_how_it_works_order_idx" ON "pages_blocks_how_it_works" USING btree ("_order");
  CREATE INDEX "pages_blocks_how_it_works_parent_id_idx" ON "pages_blocks_how_it_works" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_how_it_works_path_idx" ON "pages_blocks_how_it_works" USING btree ("_path");
  CREATE INDEX "pages_blocks_recent_wins_items_order_idx" ON "pages_blocks_recent_wins_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_recent_wins_items_parent_id_idx" ON "pages_blocks_recent_wins_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_recent_wins_order_idx" ON "pages_blocks_recent_wins" USING btree ("_order");
  CREATE INDEX "pages_blocks_recent_wins_parent_id_idx" ON "pages_blocks_recent_wins" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_recent_wins_path_idx" ON "pages_blocks_recent_wins" USING btree ("_path");
  CREATE INDEX "pages_blocks_final_cta_order_idx" ON "pages_blocks_final_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_final_cta_parent_id_idx" ON "pages_blocks_final_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_final_cta_path_idx" ON "pages_blocks_final_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_disclosure_order_idx" ON "pages_blocks_disclosure" USING btree ("_order");
  CREATE INDEX "pages_blocks_disclosure_parent_id_idx" ON "pages_blocks_disclosure" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_disclosure_path_idx" ON "pages_blocks_disclosure" USING btree ("_path");
  CREATE INDEX "pages_blocks_custom_html_order_idx" ON "pages_blocks_custom_html" USING btree ("_order");
  CREATE INDEX "pages_blocks_custom_html_parent_id_idx" ON "pages_blocks_custom_html" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_custom_html_path_idx" ON "pages_blocks_custom_html" USING btree ("_path");
  CREATE INDEX "pages_blocks_lead_form_order_idx" ON "pages_blocks_lead_form" USING btree ("_order");
  CREATE INDEX "pages_blocks_lead_form_parent_id_idx" ON "pages_blocks_lead_form" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_lead_form_path_idx" ON "pages_blocks_lead_form" USING btree ("_path");
  CREATE INDEX "pages_slug_redirects_order_idx" ON "pages_slug_redirects" USING btree ("_order");
  CREATE INDEX "pages_slug_redirects_parent_id_idx" ON "pages_slug_redirects" USING btree ("_parent_id");
  CREATE INDEX "pages_site_idx" ON "pages" USING btree ("site_id");
  CREATE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE UNIQUE INDEX "shared_legal_templates_template_key_idx" ON "shared_legal_templates" USING btree ("template_key");
  CREATE INDEX "shared_legal_templates_last_reviewed_by_idx" ON "shared_legal_templates" USING btree ("last_reviewed_by_id");
  CREATE INDEX "shared_legal_templates_updated_at_idx" ON "shared_legal_templates" USING btree ("updated_at");
  CREATE INDEX "shared_legal_templates_created_at_idx" ON "shared_legal_templates" USING btree ("created_at");
  CREATE INDEX "quizzes_steps_choices_order_idx" ON "quizzes_steps_choices" USING btree ("_order");
  CREATE INDEX "quizzes_steps_choices_parent_id_idx" ON "quizzes_steps_choices" USING btree ("_parent_id");
  CREATE INDEX "quizzes_steps_order_idx" ON "quizzes_steps" USING btree ("_order");
  CREATE INDEX "quizzes_steps_parent_id_idx" ON "quizzes_steps" USING btree ("_parent_id");
  CREATE INDEX "quizzes_slug_redirects_order_idx" ON "quizzes_slug_redirects" USING btree ("_order");
  CREATE INDEX "quizzes_slug_redirects_parent_id_idx" ON "quizzes_slug_redirects" USING btree ("_parent_id");
  CREATE INDEX "quizzes_site_idx" ON "quizzes" USING btree ("site_id");
  CREATE INDEX "quizzes_slug_idx" ON "quizzes" USING btree ("slug");
  CREATE INDEX "quizzes_updated_at_idx" ON "quizzes" USING btree ("updated_at");
  CREATE INDEX "quizzes_created_at_idx" ON "quizzes" USING btree ("created_at");
  CREATE INDEX "landing_pages_body_sections_order_idx" ON "landing_pages_body_sections" USING btree ("_order");
  CREATE INDEX "landing_pages_body_sections_parent_id_idx" ON "landing_pages_body_sections" USING btree ("_parent_id");
  CREATE INDEX "landing_pages_social_proof_order_idx" ON "landing_pages_social_proof" USING btree ("_order");
  CREATE INDEX "landing_pages_social_proof_parent_id_idx" ON "landing_pages_social_proof" USING btree ("_parent_id");
  CREATE INDEX "landing_pages_slug_redirects_order_idx" ON "landing_pages_slug_redirects" USING btree ("_order");
  CREATE INDEX "landing_pages_slug_redirects_parent_id_idx" ON "landing_pages_slug_redirects" USING btree ("_parent_id");
  CREATE INDEX "landing_pages_site_idx" ON "landing_pages" USING btree ("site_id");
  CREATE INDEX "landing_pages_slug_idx" ON "landing_pages" USING btree ("slug");
  CREATE INDEX "landing_pages_quiz_idx" ON "landing_pages" USING btree ("quiz_id");
  CREATE INDEX "landing_pages_updated_at_idx" ON "landing_pages" USING btree ("updated_at");
  CREATE INDEX "landing_pages_created_at_idx" ON "landing_pages" USING btree ("created_at");
  CREATE INDEX "leads_status_history_order_idx" ON "leads_status_history" USING btree ("_order");
  CREATE INDEX "leads_status_history_parent_id_idx" ON "leads_status_history" USING btree ("_parent_id");
  CREATE INDEX "leads_status_history_changed_by_idx" ON "leads_status_history" USING btree ("changed_by_id");
  CREATE INDEX "leads_delivery_log_order_idx" ON "leads_delivery_log" USING btree ("_order");
  CREATE INDEX "leads_delivery_log_parent_id_idx" ON "leads_delivery_log" USING btree ("_parent_id");
  CREATE INDEX "leads_site_idx" ON "leads" USING btree ("site_id");
  CREATE INDEX "leads_test_capture_idx" ON "leads" USING btree ("test_capture");
  CREATE INDEX "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX "blog_posts_tags_order_idx" ON "blog_posts_tags" USING btree ("_order");
  CREATE INDEX "blog_posts_tags_parent_id_idx" ON "blog_posts_tags" USING btree ("_parent_id");
  CREATE INDEX "blog_posts_slug_redirects_order_idx" ON "blog_posts_slug_redirects" USING btree ("_order");
  CREATE INDEX "blog_posts_slug_redirects_parent_id_idx" ON "blog_posts_slug_redirects" USING btree ("_parent_id");
  CREATE INDEX "blog_posts_site_idx" ON "blog_posts" USING btree ("site_id");
  CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");
  CREATE INDEX "blog_posts_updated_at_idx" ON "blog_posts" USING btree ("updated_at");
  CREATE INDEX "blog_posts_created_at_idx" ON "blog_posts" USING btree ("created_at");
  CREATE INDEX "numbers_page_paths_order_idx" ON "numbers_page_paths" USING btree ("_order");
  CREATE INDEX "numbers_page_paths_parent_id_idx" ON "numbers_page_paths" USING btree ("_parent_id");
  CREATE INDEX "numbers_site_idx" ON "numbers" USING btree ("site_id");
  CREATE INDEX "numbers_updated_at_idx" ON "numbers" USING btree ("updated_at");
  CREATE INDEX "numbers_created_at_idx" ON "numbers" USING btree ("created_at");
  CREATE INDEX "tracking_configs_google_ads_conversion_actions_order_idx" ON "tracking_configs_google_ads_conversion_actions" USING btree ("_order");
  CREATE INDEX "tracking_configs_google_ads_conversion_actions_parent_id_idx" ON "tracking_configs_google_ads_conversion_actions" USING btree ("_parent_id");
  CREATE INDEX "tracking_configs_truecall_page_path_mapping_order_idx" ON "tracking_configs_truecall_page_path_mapping" USING btree ("_order");
  CREATE INDEX "tracking_configs_truecall_page_path_mapping_parent_id_idx" ON "tracking_configs_truecall_page_path_mapping" USING btree ("_parent_id");
  CREATE INDEX "tracking_configs_custom_webhooks_order_idx" ON "tracking_configs_custom_webhooks" USING btree ("_order");
  CREATE INDEX "tracking_configs_custom_webhooks_parent_id_idx" ON "tracking_configs_custom_webhooks" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "tracking_configs_site_idx" ON "tracking_configs" USING btree ("site_id");
  CREATE INDEX "tracking_configs_updated_at_idx" ON "tracking_configs" USING btree ("updated_at");
  CREATE INDEX "tracking_configs_created_at_idx" ON "tracking_configs" USING btree ("created_at");
  CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");
  CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");
  CREATE INDEX "audit_log_entity_type_idx" ON "audit_log" USING btree ("entity_type");
  CREATE INDEX "audit_log_entity_id_idx" ON "audit_log" USING btree ("entity_id");
  CREATE INDEX "audit_log_site_idx" ON "audit_log" USING btree ("site_id");
  CREATE INDEX "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_sites_id_idx" ON "payload_locked_documents_rels" USING btree ("sites_id");
  CREATE INDEX "payload_locked_documents_rels_domains_id_idx" ON "payload_locked_documents_rels" USING btree ("domains_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_shared_legal_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("shared_legal_templates_id");
  CREATE INDEX "payload_locked_documents_rels_quizzes_id_idx" ON "payload_locked_documents_rels" USING btree ("quizzes_id");
  CREATE INDEX "payload_locked_documents_rels_landing_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("landing_pages_id");
  CREATE INDEX "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX "payload_locked_documents_rels_blog_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_posts_id");
  CREATE INDEX "payload_locked_documents_rels_numbers_id_idx" ON "payload_locked_documents_rels" USING btree ("numbers_id");
  CREATE INDEX "payload_locked_documents_rels_tracking_configs_id_idx" ON "payload_locked_documents_rels" USING btree ("tracking_configs_id");
  CREATE INDEX "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "integration_config_slack_webhooks_order_idx" ON "integration_config_slack_webhooks" USING btree ("_order");
  CREATE INDEX "integration_config_slack_webhooks_parent_id_idx" ON "integration_config_slack_webhooks" USING btree ("_parent_id");
  CREATE INDEX "integration_config_github_repos_order_idx" ON "integration_config_github_repos" USING btree ("_order");
  CREATE INDEX "integration_config_github_repos_parent_id_idx" ON "integration_config_github_repos" USING btree ("_parent_id");
  CREATE INDEX "integration_config_github_repos_site_idx" ON "integration_config_github_repos" USING btree ("site_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_site_bindings" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "sites_slug_redirects" CASCADE;
  DROP TABLE "sites" CASCADE;
  DROP TABLE "domains_redirects_from" CASCADE;
  DROP TABLE "domains" CASCADE;
  DROP TABLE "pages_blocks_hero" CASCADE;
  DROP TABLE "pages_blocks_prose" CASCADE;
  DROP TABLE "pages_blocks_image" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_bullet_list_items" CASCADE;
  DROP TABLE "pages_blocks_bullet_list" CASCADE;
  DROP TABLE "pages_blocks_embed" CASCADE;
  DROP TABLE "pages_blocks_cards_items" CASCADE;
  DROP TABLE "pages_blocks_cards" CASCADE;
  DROP TABLE "pages_blocks_stats_items" CASCADE;
  DROP TABLE "pages_blocks_stats" CASCADE;
  DROP TABLE "pages_blocks_testimonials_items" CASCADE;
  DROP TABLE "pages_blocks_testimonials" CASCADE;
  DROP TABLE "pages_blocks_faq_items" CASCADE;
  DROP TABLE "pages_blocks_faq" CASCADE;
  DROP TABLE "pages_blocks_nav_header_links" CASCADE;
  DROP TABLE "pages_blocks_nav_header" CASCADE;
  DROP TABLE "pages_blocks_site_footer_columns_links" CASCADE;
  DROP TABLE "pages_blocks_site_footer_columns" CASCADE;
  DROP TABLE "pages_blocks_site_footer" CASCADE;
  DROP TABLE "pages_blocks_trust_strip_items" CASCADE;
  DROP TABLE "pages_blocks_trust_strip" CASCADE;
  DROP TABLE "pages_blocks_services_grid_items" CASCADE;
  DROP TABLE "pages_blocks_services_grid" CASCADE;
  DROP TABLE "pages_blocks_how_it_works_steps" CASCADE;
  DROP TABLE "pages_blocks_how_it_works" CASCADE;
  DROP TABLE "pages_blocks_recent_wins_items" CASCADE;
  DROP TABLE "pages_blocks_recent_wins" CASCADE;
  DROP TABLE "pages_blocks_final_cta" CASCADE;
  DROP TABLE "pages_blocks_disclosure" CASCADE;
  DROP TABLE "pages_blocks_custom_html" CASCADE;
  DROP TABLE "pages_blocks_lead_form" CASCADE;
  DROP TABLE "pages_slug_redirects" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "shared_legal_templates" CASCADE;
  DROP TABLE "quizzes_steps_choices" CASCADE;
  DROP TABLE "quizzes_steps" CASCADE;
  DROP TABLE "quizzes_slug_redirects" CASCADE;
  DROP TABLE "quizzes" CASCADE;
  DROP TABLE "landing_pages_body_sections" CASCADE;
  DROP TABLE "landing_pages_social_proof" CASCADE;
  DROP TABLE "landing_pages_slug_redirects" CASCADE;
  DROP TABLE "landing_pages" CASCADE;
  DROP TABLE "leads_status_history" CASCADE;
  DROP TABLE "leads_delivery_log" CASCADE;
  DROP TABLE "leads" CASCADE;
  DROP TABLE "blog_posts_tags" CASCADE;
  DROP TABLE "blog_posts_slug_redirects" CASCADE;
  DROP TABLE "blog_posts" CASCADE;
  DROP TABLE "numbers_page_paths" CASCADE;
  DROP TABLE "numbers" CASCADE;
  DROP TABLE "tracking_configs_google_ads_conversion_actions" CASCADE;
  DROP TABLE "tracking_configs_truecall_page_path_mapping" CASCADE;
  DROP TABLE "tracking_configs_custom_webhooks" CASCADE;
  DROP TABLE "tracking_configs" CASCADE;
  DROP TABLE "audit_log" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "integration_config_slack_webhooks" CASCADE;
  DROP TABLE "integration_config_github_repos" CASCADE;
  DROP TABLE "integration_config" CASCADE;
  DROP TYPE "public"."enum_users_site_bindings_role";
  DROP TYPE "public"."enum_users_status";
  DROP TYPE "public"."enum_sites_status";
  DROP TYPE "public"."enum_sites_vertical";
  DROP TYPE "public"."enum_sites_default_tone";
  DROP TYPE "public"."enum_domains_kind";
  DROP TYPE "public"."enum_domains_status";
  DROP TYPE "public"."enum_domains_ssl_status";
  DROP TYPE "public"."enum_pages_blocks_lead_form_funnel_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum_pages_template_key";
  DROP TYPE "public"."enum_shared_legal_templates_template_key";
  DROP TYPE "public"."enum_quizzes_steps_kind";
  DROP TYPE "public"."enum_quizzes_status";
  DROP TYPE "public"."enum_landing_pages_status";
  DROP TYPE "public"."enum_leads_source_entity_type";
  DROP TYPE "public"."enum_leads_status";
  DROP TYPE "public"."enum_blog_posts_status";`)
}
