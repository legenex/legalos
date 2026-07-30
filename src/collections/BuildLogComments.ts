import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'

/**
 * Comments on the build log.
 *
 * The build log records what shipped; this is where the reply goes. An item can
 * be questioned, corrected or given direction without that feedback living in a
 * chat thread that nobody can find again next week.
 *
 * Why a collection rather than the JSON-file approach the agent-plan board uses:
 * that board holds machine-written status that is cheap to regenerate, so a file
 * is the right weight. These are human-written notes about decisions, and losing
 * them to a rebuilt server would be a real loss. They belong in the database,
 * where they are backed up, exportable and covered by the audit hooks.
 *
 * `entry_id` and `item_id` are STABLE SLUGS derived from the log's own content
 * (see buildLogEntryId / buildLogItemId), not row ids. The log is code, not
 * data, so there is nothing to relate to. The trade is that renaming an item's
 * title orphans its comments, which is why the title is stored alongside: an
 * orphan can still be read and re-attached rather than silently disappearing.
 */
export const BuildLogComments: CollectionConfig = {
  slug: 'buildlog-comments',
  labels: { singular: 'Build Log Comment', plural: 'Build Log Comments' },
  admin: {
    useAsTitle: 'body',
    defaultColumns: ['body', 'entry_id', 'item_id', 'status', 'createdAt'],
    group: 'System',
  },
  // Any authenticated user. This is an internal engineering surface with no
  // tenant scoping - it is not per-Site content and must not be filtered by
  // site bindings, which is why the siteScoped* helpers are deliberately unused.
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
    {
      name: 'entry_id',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Stable slug of the build-log entry this comment belongs to.' },
    },
    {
      name: 'item_id',
      type: 'text',
      index: true,
      admin: { description: 'Stable slug of the specific item. Empty means the comment is on the entry as a whole.' },
    },
    {
      name: 'target_label',
      type: 'text',
      admin: {
        description:
          'The title the comment was written against. Kept so a renamed item leaves a readable orphan rather than a dangling slug.',
      },
    },
    { name: 'body', type: 'textarea', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'open',
      index: true,
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Resolved', value: 'resolved' },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { description: 'Set from the session on create. Not editable.' },
    },
    {
      name: 'author_email',
      type: 'text',
      admin: { description: 'Captured at write time so a deleted user still leaves an attributable comment.' },
    },
  ],
}
