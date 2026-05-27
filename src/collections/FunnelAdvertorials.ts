import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'

// Brandless advertorials for the funnel builder (ported artifact model). A
// native-style story page warmed by Facebook traffic. Bound to a brand (Site) +
// domain via FunnelAdvertorialDeployments. The article body is brand-agnostic;
// only header/colors/phone/CTA/disclaimer resolve per brand at render time.
export const FunnelAdvertorials: CollectionConfig = {
  slug: 'funnel-advertorials',
  labels: { singular: 'Funnel Advertorial', plural: 'Funnel Advertorials' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'template_id', 'status', 'updatedAt'],
    group: 'Funnel Builder',
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  hooks: {
    afterChange: [auditAfterChange],
    afterDelete: [auditAfterDelete],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
    { name: 'template_id', type: 'text', defaultValue: 'personal_story' },
    // Site (brand) used only when previewing the article in isolation.
    { name: 'default_brand_id', type: 'text' },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    // Artifact advertorial section list stored verbatim.
    { name: 'sections', type: 'json' },
  ],
}
