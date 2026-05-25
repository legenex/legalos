import type { CollectionConfig } from 'payload'
import { siteScopedRead, siteScopedWrite } from '../access'
import { auditAfterChange, auditAfterDelete } from '../hooks/audit'

export const Leads: CollectionConfig = {
  slug: 'leads',
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['site', 'status', 'contact.email', 'contact.phone', 'createdAt'],
    group: 'Leads',
  },
  access: {
    read: siteScopedRead,
    create: () => true, // public form submission allowed; server validates site context
    update: siteScopedWrite,
    delete: () => false, // never delete leads from UI; soft-archive via status only
  },
  hooks: {
    afterChange: [auditAfterChange],
    afterDelete: [auditAfterDelete],
  },
  fields: [
    { name: 'site', type: 'relationship', relationTo: 'sites', required: true, index: true },
    {
      name: 'source_entity_type',
      type: 'select',
      required: true,
      options: [
        { label: 'Quiz', value: 'quiz' },
        { label: 'Landing Page', value: 'landing-page' },
        { label: 'Contact Form', value: 'contact-form' },
        { label: 'Page', value: 'page' },
        { label: 'Advertorial', value: 'advertorial' },
      ],
    },
    { name: 'source_entity_id', type: 'text' },
    {
      name: 'test_capture',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { description: 'Synthetic lead created via /admin Test Capture. Filter these out in real metrics.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'Qualified', value: 'qualified' },
        { label: 'Soft DQ', value: 'soft-dq' },
        { label: 'Hard DQ', value: 'hard-dq' },
        { label: 'Sold', value: 'sold' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      name: 'contact',
      type: 'group',
      fields: [
        { name: 'first_name', type: 'text' },
        { name: 'last_name', type: 'text' },
        { name: 'email', type: 'email' },
        { name: 'phone', type: 'text' },
        { name: 'state', type: 'text' },
        { name: 'zip', type: 'text' },
      ],
    },
    { name: 'quiz_answers', type: 'json' },
    { name: 'attribution', type: 'json', admin: { description: 'utm_*, fbclid, gclid, ttclid, referrer, landing_path, session_id, ip, user_agent.' } },
    { name: 'trustedform_cert_url', type: 'text' },
    { name: 'jornaya_lead_id', type: 'text' },
    { name: 'hlr_result', type: 'json', admin: { description: 'Async-populated phone enrichment result.' } },
    { name: 'buyer_id', type: 'text' },
    { name: 'sold_at', type: 'date' },
    { name: 'sale_price', type: 'number' },
    {
      name: 'status_history',
      type: 'array',
      admin: { description: 'Audit trail of status transitions for this Lead.' },
      fields: [
        { name: 'status', type: 'text', required: true },
        { name: 'changed_at', type: 'date', required: true },
        { name: 'changed_by', type: 'relationship', relationTo: 'users' },
        { name: 'note', type: 'textarea' },
      ],
    },
    {
      name: 'delivery_log',
      type: 'array',
      admin: { description: 'Per-pipeline-step delivery results: TrustedForm, CAPI, webhooks, Slack, etc.' },
      fields: [
        { name: 'at', type: 'date', required: true },
        { name: 'step', type: 'text', required: true },
        { name: 'ok', type: 'checkbox', defaultValue: false },
        { name: 'detail', type: 'text' },
      ],
    },
  ],
}
