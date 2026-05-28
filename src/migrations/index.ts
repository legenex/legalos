import * as migration_20260513_221103_init from './20260513_221103_init';
import * as migration_20260518_134859_site_status_draft from './20260518_134859_site_status_draft';
import * as migration_20260518_134900_site_status_draft_default from './20260518_134900_site_status_draft_default';
import * as migration_20260525_214717_domains_pool_and_funnel_domain from './20260525_214717_domains_pool_and_funnel_domain';
import * as migration_20260528_180000_add_media_collection from './20260528_180000_add_media_collection';
import * as migration_20260528_200000_lead_form_form_fields from './20260528_200000_lead_form_form_fields';

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
];
