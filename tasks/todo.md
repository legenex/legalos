# Current task — 2026-05-18

Three items, fanned out in parallel:

## 1. Fix Domains 3-dot menu clipping (main thread)
- [ ] `src/app/(app)/admin/sites/[slug]/settings/domains/page.tsx` — outer card has `overflow-hidden` clipping the row dropdown. Switch to a layout that doesn't clip absolutely-positioned children (e.g., move rounded-corner clipping to inner header only, or render the menu in a portal).
- [ ] Verify dropdown is visible on the last row of the list.

## 2. Build real Pages 3-dot dropdown (Agent 1)
- [ ] `src/app/(app)/admin/sites/[slug]/pages/page.tsx` — replace `RowMenu` (currently a fake Link to /cms) with a real dropdown.
- [ ] Actions: **Preview** (open public URL), **Edit** (link to /cms/collections/pages/{id}), **Duplicate** (server action), **Delete** (server action with confirm).
- [ ] Add `actions.ts` next to the page for duplicate/delete server actions, scoped by `site.id`.
- [ ] Match Domains row dropdown UX (no clipping).

## 3. DNS auto-verify (Agent 2)
- [ ] Client-side polling on the Domains page: when at least one domain is `pending`, poll `verifyAndPromoteDomain` (no skipDns) every ~30s while the page is open.
- [ ] Show a "verifying…" indicator with the `last_checked_at` timestamp on each pending custom row.
- [ ] Stop polling once all custom domains are `active` or `error`.
- [ ] Do not auto-promote if the user has already set a primary explicitly (current `verifyAndPromoteDomain` always promotes — that may need a `promote=false` mode).
