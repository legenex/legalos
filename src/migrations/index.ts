import * as migration_20260513_221103_init from './20260513_221103_init';
import * as migration_20260518_134859_site_status_draft from './20260518_134859_site_status_draft';
import * as migration_20260518_134900_site_status_draft_default from './20260518_134900_site_status_draft_default';
import * as migration_20260525_214717_domains_pool_and_funnel_domain from './20260525_214717_domains_pool_and_funnel_domain';
import * as migration_20260528_180000_add_media_collection from './20260528_180000_add_media_collection';
import * as migration_20260528_200000_lead_form_form_fields from './20260528_200000_lead_form_form_fields';
import * as migration_20260528_220000_pages_hidden_blocks from './20260528_220000_pages_hidden_blocks';
import * as migration_20260529_000000_pages_block_meta from './20260529_000000_pages_block_meta';
import * as migration_20260529_020000_pages_scheduled_publish from './20260529_020000_pages_scheduled_publish';
import * as migration_20260529_040000_new_block_types from './20260529_040000_new_block_types';
import * as migration_20260529_060000_sites_global_blocks from './20260529_060000_sites_global_blocks';
import * as migration_20260530_000000_locked_documents_media_rel from './20260530_000000_locked_documents_media_rel';

export const migrations = [
  {
    up: migration_20260513_221103_init.up,
    down: migration_20260513_221103_init.down,
    name: '20260513_221103_init',
  },
  {
    up: migration_20260518_134859_site_status_draft.up,
    down: migration_20260518_134859_site_status_draft.down,
    name: '20260518_134859_site_status_draft',
  },
  {
    up: migration_20260518_134900_site_status_draft_default.up,
    down: migration_20260518_134900_site_status_draft_default.down,
    name: '20260518_134900_site_status_draft_default',
  },
  {
    up: migration_20260525_214717_domains_pool_and_funnel_domain.up,
    down: migration_20260525_214717_domains_pool_and_funnel_domain.down,
    name: '20260525_214717_domains_pool_and_funnel_domain'
  },
  {
    up: migration_20260528_180000_add_media_collection.up,
    down: migration_20260528_180000_add_media_collection.down,
    name: '20260528_180000_add_media_collection',
  },
  {
    up: migration_20260528_200000_lead_form_form_fields.up,
    down: migration_20260528_200000_lead_form_form_fields.down,
    name: '20260528_200000_lead_form_form_fields',
  },
  {
    up: migration_20260528_220000_pages_hidden_blocks.up,
    down: migration_20260528_220000_pages_hidden_blocks.down,
    name: '20260528_220000_pages_hidden_blocks',
  },
  {
    up: migration_20260529_000000_pages_block_meta.up,
    down: migration_20260529_000000_pages_block_meta.down,
    name: '20260529_000000_pages_block_meta',
  },
  {
    up: migration_20260529_020000_pages_scheduled_publish.up,
    down: migration_20260529_020000_pages_scheduled_publish.down,
    name: '20260529_020000_pages_scheduled_publish',
  },
  {
    up: migration_20260529_040000_new_block_types.up,
    down: migration_20260529_040000_new_block_types.down,
    name: '20260529_040000_new_block_types',
  },
  {
    up: migration_20260529_060000_sites_global_blocks.up,
    down: migration_20260529_060000_sites_global_blocks.down,
    name: '20260529_060000_sites_global_blocks',
  },
  {
    up: migration_20260530_000000_locked_documents_media_rel.up,
    down: migration_20260530_000000_locked_documents_media_rel.down,
    name: '20260530_000000_locked_documents_media_rel',
  },
];
