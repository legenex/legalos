import type { CollectionConfig } from 'payload'
import { isSuperAdmin, isSuperAdminField, isAuthenticated } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7,
    cookies: { sameSite: 'Lax' },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'super_admin', 'status', 'last_login_at'],
    group: 'LegalOS',
  },
  access: {
    read: isAuthenticated,
    create: isSuperAdmin,
    update: ({ req, id }) => {
      if (!req.user) return false
      if ((req.user as { super_admin?: boolean }).super_admin) return true
      return req.user.id === id
    },
    delete: isSuperAdmin,
  },
  hooks: {
    afterChange: [auditAfterChange],
    afterDelete: [auditAfterDelete],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'avatar_url', type: 'text' },
    {
      name: 'super_admin',
      type: 'checkbox',
      defaultValue: false,
      access: {
        read: isSuperAdminField,
        update: isSuperAdminField,
        create: isSuperAdminField,
      },
      admin: { description: 'LegalOS-wide super admin. Bypasses all SiteUser bindings.' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'active',
      options: [
        { label: 'Invited', value: 'invited' },
        { label: 'Active', value: 'active' },
        { label: 'Disabled', value: 'disabled' },
      ],
    },
    { name: 'last_login_at', type: 'date', admin: { readOnly: true } },
    {
      name: 'siteBindings',
      type: 'array',
      label: 'Site role bindings',
      admin: {
        description: 'Per-Site role assignments. Super admins do not need bindings.',
      },
      fields: [
        { name: 'site', type: 'relationship', relationTo: 'sites', required: true },
        {
          name: 'role',
          type: 'select',
          required: true,
          options: [
            { label: 'Admin', value: 'admin' },
            { label: 'Editor', value: 'editor' },
            { label: 'Analyst', value: 'analyst' },
          ],
        },
        { name: 'invited_at', type: 'date', admin: { readOnly: true } },
        { name: 'accepted_at', type: 'date', admin: { readOnly: true } },
      ],
    },
  ],
}
