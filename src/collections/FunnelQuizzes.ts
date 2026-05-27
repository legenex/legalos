import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'

// Brandless quizzes for the funnel builder (ported artifact model). Bound to a
// brand + domain via FunnelQuizDeployments. Separate from the site-scoped
// `quizzes` collection.
export const FunnelQuizzes: CollectionConfig = {
  slug: 'funnel-quizzes',
  labels: { singular: 'Funnel Quiz', plural: 'Funnel Quizzes' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'is_published', 'updatedAt'],
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
    { name: 'name', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
    { name: 'is_published', type: 'checkbox', defaultValue: false },
    // Artifact quiz shape stored verbatim.
    { name: 'tiers', type: 'json' },
    { name: 'steps', type: 'json' },
    { name: 'nodes', type: 'json' },
    { name: 'custom_fields', type: 'json' },
  ],
}
