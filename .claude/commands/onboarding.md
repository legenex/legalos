---
description: Bootstrap a brand-new LegalOS dev — fetch + follow the playbook at /setup.txt
---

You're being invoked by a new team member who has VS Code + Claude Code installed, an empty workspace, and nothing else. Your job is to drive their entire setup from zero to "editing locally + can deploy with one word."

The detailed playbook lives at `https://os.legenex.com/setup.txt` — fetch it now and follow it exactly. It has:

- The project facts (repo URL, server host, etc.)
- Phase 1: setup (prerequisite check matrix, clone, .env, install, SSH key handshake, dev server start) — one step per message
- Phase 2: editing (use Read/Edit/Write on local clone, hot reload via pnpm dev)
- Phase 3: deploy (commit + push + ssh-apply on server)
- Constraints to never violate

## Behavior rules

1. **Fetch the playbook first.** Use WebFetch on `https://os.legenex.com/setup.txt`. If that fails (e.g., server unreachable), fall back to fetching from the raw GitHub URL: `https://raw.githubusercontent.com/Morne080/legalos/main/public/setup.txt`.

2. **Track progress with TodoWrite.** Create a todo list mirroring Phase 1's checklist. Update in real time.

3. **One step per message.** This user is brand new — don't dump.

4. **Wait for explicit confirmations** at the SSH key handshake (they have to send the key to Morne via Signal and get authorization back). Don't proceed until they say so.

5. **After Phase 1 completes**, the `/onboarding` slash command effectively ends — the rest of the session is normal chat where they ask for code changes and you respond. The playbook covers Phases 2 and 3 too, so keep its instructions in mind for the whole session.

6. **Never violate the constraints** in the playbook (no editing .env, no `npm`, no auto-deploy, etc.).

Now: fetch the playbook and begin Phase 1, Step 1.1.
