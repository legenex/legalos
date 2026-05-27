import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'

export const Sites: CollectionConfig = {
  slug: 'sites',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'vertical', 'status', 'updatedAt'],
    group: 'LegalOS',
  },
  access: {
    read: ({ req }) => {
      const user = req.user as { super_admin?: boolean; siteBindings?: Array<{ site: string | number }> } | null
      if (!user) return false
      if (user.super_admin) return true
      const ids = user.siteBindings?.map((b) => b.site) ?? []
      if (ids.length === 0) return false
      return { id: { in: ids } }
    },
    create: isSuperAdmin,
    update: ({ req, id }) => {
      const user = req.user as { super_admin?: boolean; siteBindings?: Array<{ site: string | number; role: string }> } | null
      if (!user) return false
      if (user.super_admin) return true
      const adminSiteIds = user.siteBindings?.filter((b) => b.role === 'admin').map((b) => b.site) ?? []
      if (!id) return adminSiteIds.length > 0
      return adminSiteIds.includes(id)
    },
    delete: isSuperAdmin,
  },
  hooks: {
    afterChange: [auditAfterChange],
    afterDelete: [auditAfterDelete],
    beforeChange: [
      async ({ data, originalDoc, operation }) => {
        if (operation !== 'update' || !originalDoc) return data
        const prev = (originalDoc as { slug?: string }).slug
        const next = (data as { slug?: string }).slug
        if (!prev || !next || prev === next) return data
        const redirects = ((data as { slug_redirects?: Array<{ from: string }> }).slug_redirects ??
          (originalDoc as { slug_redirects?: Array<{ from: string }> }).slug_redirects) ?? []
        if (redirects.some((r) => r.from === prev)) return data
        return { ...data, slug_redirects: [...redirects, { from: prev }] }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { description: 'URL-safe slug. Used in admin paths and preview overrides.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      admin: {
        description: 'Draft = not publicly served. Active = live. Paused = public router returns 404. Archived = hidden from listings.',
      },
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'vertical',
      type: 'select',
      required: true,
      defaultValue: 'multi',
      options: [
        { label: 'Mass Tort', value: 'mass-tort' },
        { label: 'Motor Vehicle Accident', value: 'mva' },
        { label: 'Workers Comp', value: 'workers-comp' },
        { label: 'Personal Injury', value: 'personal-injury' },
        { label: 'Medical Malpractice', value: 'medical-malpractice' },
        { label: 'Class Action', value: 'class-action' },
        { label: 'Multi-vertical', value: 'multi' },
      ],
    },
    { name: 'tagline', type: 'text' },
    { name: 'default_phone', type: 'text', admin: { description: 'Display format, e.g. (555) 555-5555' } },
    { name: 'default_phone_tel', type: 'text', admin: { description: 'tel: link format, e.g. +15555555555' } },
    { name: 'org_name', type: 'text' },
    { name: 'org_address', type: 'textarea' },
    { name: 'support_email', type: 'email' },
    {
      name: 'brand',
      type: 'group',
      fields: [
        { name: 'logo_url', type: 'text' },
        { name: 'favicon_url', type: 'text' },
        { name: 'primary', type: 'text', defaultValue: '#0B1F3A' },
        { name: 'accent', type: 'text', defaultValue: '#E8B14B' },
        { name: 'surface', type: 'text', defaultValue: '#F7F5F0' },
        { name: 'ink', type: 'text', defaultValue: '#0E1116' },
        { name: 'muted', type: 'text', defaultValue: '#5C6470' },
        { name: 'success', type: 'text', defaultValue: '#1F9D55' },
        { name: 'warning', type: 'text', defaultValue: '#E8B14B' },
        { name: 'danger', type: 'text', defaultValue: '#C03A2B' },
        { name: 'font_heading', type: 'text', defaultValue: 'Inter' },
        { name: 'font_body', type: 'text', defaultValue: 'Inter' },
        { name: 'display_name', type: 'text', admin: { description: 'Brand display name shown across funnels. Defaults to Site name when blank.' } },
        { name: 'short_name', type: 'text', admin: { description: '2-3 letter shortcode like CMC or CAC. Used for initials/logo marks.' } },
        { name: 'logo_url_dark', type: 'text', admin: { description: 'Logo variant for dark backgrounds. Optional.' } },
        { name: 'tagline_brand', type: 'text', admin: { description: 'Brand-level tagline used in funnels. Separate from the top-level Site tagline.' } },
      ],
    },
    {
      name: 'legal',
      type: 'group',
      admin: { description: 'Legal copy surfaced across funnels and footers.' },
      fields: [
        { name: 'copyright', type: 'text', admin: { description: 'e.g. "(c) {year} {brand}". Tokens resolved at render time.' } },
        { name: 'tcpa_text', type: 'textarea' },
        { name: 'privacy_url', type: 'text' },
        { name: 'terms_url', type: 'text' },
        { name: 'default_disclaimer', type: 'textarea' },
      ],
    },
    {
      name: 'typography',
      type: 'group',
      admin: { description: 'Funnel typography used by the public render and builders.' },
      fields: [
        { name: 'headline_font', type: 'text', defaultValue: 'Inter' },
        { name: 'body_font', type: 'text', defaultValue: 'Inter' },
        {
          name: 'base_size',
          type: 'select',
          defaultValue: 'md',
          options: [
            { label: 'Small', value: 'sm' },
            { label: 'Medium', value: 'md' },
            { label: 'Large', value: 'lg' },
          ],
        },
      ],
    },
    {
      name: 'default_tone',
      type: 'select',
      defaultValue: 'empathetic',
      options: [
        { label: 'Direct', value: 'direct' },
        { label: 'Empathetic', value: 'empathetic' },
      ],
    },
    { name: 'default_disclaimer_md', type: 'textarea' },
    {
      name: 'slug_redirects',
      type: 'array',
      admin: { description: 'Old slugs that should 301 to current.' },
      fields: [{ name: 'from', type: 'text', required: true }],
    },
    { name: 'archived_at', type: 'date', admin: { readOnly: true } },
  ],
}
