import type { CollectionConfig, Field } from 'payload'
import { siteScopedRead, siteScopedWrite, siteScopedAdmin } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'
import { captureSlugRedirect } from '../hooks/slug-redirects'
import { TEMPLATE_KEYS } from './SharedLegalTemplates'

const bodyBlocks: Field = {
  name: 'body_blocks',
  type: 'blocks',
  blocks: [
    {
      slug: 'hero',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'heading', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        { name: 'primary_cta_label', type: 'text' },
        { name: 'primary_cta_href', type: 'text' },
        { name: 'secondary_cta_label', type: 'text' },
        { name: 'secondary_cta_href', type: 'text' },
        { name: 'image_url', type: 'text' },
      ],
    },
    {
      slug: 'prose',
      fields: [{ name: 'markdown', type: 'textarea', required: true }],
    },
    {
      slug: 'image',
      fields: [
        { name: 'url', type: 'text', required: true },
        { name: 'alt', type: 'text' },
        { name: 'caption', type: 'text' },
      ],
    },
    {
      slug: 'cta',
      fields: [
        { name: 'heading', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        { name: 'label', type: 'text', required: true },
        { name: 'href', type: 'text', required: true },
      ],
    },
    {
      slug: 'bullet_list',
      fields: [
        { name: 'heading', type: 'text' },
        { name: 'items', type: 'array', fields: [{ name: 'item', type: 'text', required: true }] },
      ],
    },
    {
      slug: 'embed',
      fields: [
        { name: 'html', type: 'textarea', required: true },
        { name: 'note', type: 'text', admin: { description: 'For admin reference; not rendered.' } },
      ],
    },
    {
      slug: 'cards',
      fields: [
        { name: 'heading', type: 'text' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'body', type: 'textarea' },
            { name: 'icon', type: 'text' },
          ],
        },
      ],
    },
    {
      slug: 'stats',
      fields: [
        { name: 'heading', type: 'text' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'value', type: 'text', required: true },
            { name: 'label', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      slug: 'testimonials',
      fields: [
        { name: 'heading', type: 'text' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'quote', type: 'textarea', required: true },
            { name: 'attribution', type: 'text' },
            { name: 'avatar_url', type: 'text' },
          ],
        },
      ],
    },
    {
      slug: 'faq',
      fields: [
        { name: 'heading', type: 'text' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'question', type: 'text', required: true },
            { name: 'answer', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      slug: 'nav_header',
      fields: [
        {
          name: 'links',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'href', type: 'text', required: true },
          ],
        },
        { name: 'cta_label', type: 'text' },
        { name: 'cta_href', type: 'text' },
        { name: 'show_phone', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      slug: 'site_footer',
      fields: [
        {
          name: 'columns',
          type: 'array',
          fields: [
            { name: 'heading', type: 'text', required: true },
            {
              name: 'links',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'href', type: 'text', required: true },
              ],
            },
          ],
        },
        { name: 'legal_md', type: 'textarea', admin: { description: 'Disclaimer / attorney-advertising copy.' } },
      ],
    },
    {
      slug: 'trust_strip',
      fields: [
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'value', type: 'text', required: true },
            { name: 'label', type: 'text', required: true },
          ],
        },
      ],
    },
    {
      slug: 'services_grid',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'heading', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'icon', type: 'text', admin: { description: 'Lucide icon name (Car, Truck, HardHat, etc.)' } },
          ],
        },
      ],
    },
    {
      slug: 'how_it_works',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'heading', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        {
          name: 'steps',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
          ],
        },
      ],
    },
    {
      slug: 'recent_wins',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'heading', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        {
          name: 'items',
          type: 'array',
          fields: [
            { name: 'amount', type: 'text', required: true, admin: { description: 'e.g. $1.2M' } },
            { name: 'case_type', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
          ],
        },
        { name: 'disclaimer', type: 'textarea' },
      ],
    },
    {
      slug: 'final_cta',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'heading', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        { name: 'primary_cta_label', type: 'text' },
        { name: 'primary_cta_href', type: 'text' },
        { name: 'show_phone', type: 'checkbox', defaultValue: true },
      ],
    },
    {
      slug: 'disclosure',
      fields: [
        { name: 'markdown', type: 'textarea', required: true, admin: { description: 'Legal disclaimer / advertising disclosure copy.' } },
      ],
    },
    {
      slug: 'custom_html',
      fields: [
        { name: 'html', type: 'textarea', required: true, admin: { description: '<script> tags are stripped at render time.' } },
      ],
    },
    {
      slug: 'lead_form',
      fields: [
        { name: 'eyebrow', type: 'text' },
        { name: 'heading', type: 'text', required: true },
        { name: 'sub', type: 'textarea' },
        { name: 'submit_label', type: 'text', defaultValue: 'See if I qualify' },
        { name: 'consent_md', type: 'textarea', admin: { description: 'TCPA / SMS consent text shown above the submit button.' } },
        {
          name: 'funnel_type',
          type: 'select',
          defaultValue: 'contact-form',
          options: [
            { label: 'Contact form', value: 'contact-form' },
            { label: 'Quiz', value: 'quiz' },
            { label: 'Landing page', value: 'landing-page' },
            { label: 'Page', value: 'page' },
            { label: 'Advertorial', value: 'advertorial' },
          ],
        },
        { name: 'funnel_id', type: 'text', admin: { description: 'Optional quiz/LP id this form belongs to.' } },
        { name: 'success_slug', type: 'text', defaultValue: '/submitted' },
        {
          name: 'form_fields',
          type: 'json',
          admin: {
            description:
              'Custom form fields config. Leave empty to render the default name/email/phone/state/zip set. JSON array of { name, label, placeholder, type, required, half_width, options }.',
          },
        },
      ],
    },
  ],
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'template_key', 'status', 'updatedAt'],
    group: 'Site Content',
    livePreview: {
      url: ({ data, req }) => {
        const slug = (data as { slug?: string })?.slug ?? ''
        const origin = req.headers.get('origin') ?? 'http://localhost:3000'
        return `${origin}/${slug.replace(/^\//, '')}?preview=1&ts=${Date.now()}`
      },
    },
  },
  access: {
    read: siteScopedRead,
    create: siteScopedWrite,
    update: siteScopedWrite,
    delete: siteScopedAdmin,
  },
  hooks: {
    beforeChange: [captureSlugRedirect],
    afterChange: [auditAfterChange],
    afterDelete: [auditAfterDelete],
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true, index: true },
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'Leading slash optional. Use "/" for the home page.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'publish_at',
      type: 'date',
      admin: {
        description:
          'When status is Scheduled, the page becomes public at this time. Ignored for Draft / Published / Archived.',
        condition: (_, siblingData) => siblingData.status === 'scheduled',
      },
    },
    {
      name: 'template_key',
      type: 'select',
      required: true,
      defaultValue: 'custom',
      options: [
        { label: 'Custom', value: 'custom' },
        ...TEMPLATE_KEYS.map((k) => ({ label: `Shared: ${k}`, value: k })),
      ],
    },
    {
      name: 'uses_shared_template',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'When checked, renders the SharedLegalTemplate for this template_key with Site vars substituted. Uncheck to author custom body_blocks.',
        condition: (_, siblingData) => siblingData.template_key !== 'custom',
      },
    },
    {
      name: 'shared_template_overrides',
      type: 'json',
      admin: {
        description: 'Per-Site overrides applied on top of the shared template (markdown patches, meta overrides).',
        condition: (_, siblingData) => Boolean(siblingData.uses_shared_template),
      },
    },
    {
      ...bodyBlocks,
      admin: { condition: (_, siblingData) => !siblingData.uses_shared_template || siblingData.template_key === 'custom' },
    },
    { name: 'meta_title', type: 'text' },
    { name: 'meta_description', type: 'textarea' },
    { name: 'og_image_url', type: 'text' },
    { name: 'schema_json', type: 'json', admin: { description: 'JSON-LD payload for this page.' } },
    {
      name: 'hidden_blocks',
      type: 'json',
      admin: {
        description:
          'Array of body_blocks ids to hide on the public site without deleting. Toggled from the page builder; the renderer skips matching blocks.',
      },
    },
    {
      name: 'block_meta',
      type: 'json',
      admin: {
        description:
          'Per-block metadata keyed by body_blocks id. Currently stores responsive-visibility flags like { [blockId]: { hide_mobile?: true, hide_desktop?: true } } so the public site can hide a section at a breakpoint via CSS.',
      },
    },
    {
      name: 'slug_redirects',
      type: 'array',
      admin: { description: 'Old slugs that 301 to current. Auto-populated when you change a published slug.' },
      fields: [{ name: 'from', type: 'text', required: true }],
    },
    { name: 'published_at', type: 'date', admin: { readOnly: true } },
  ],
}
