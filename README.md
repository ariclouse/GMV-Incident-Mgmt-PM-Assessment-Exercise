# Incident Management Prototype

A clickable prototype of an **Incident Management** module for a transit-ops platform, modeled on a real product ("GMV Sync") from provided UI mockups and a requirements document. Built as part of a job-application assessment on using AI tools to design and build software — the app was developed collaboratively with [Claude Code](https://claude.com/claude-code), from initial scaffolding through iterative feature work, bug fixes, and this review pass.

## What's here

- **Incident list** — active/closed tabs, quick-filter pills (Unassigned / Open / My Incidents), search, and a filter drawer (type, route, driver, date, stale-open).
- **Incident detail** — rich-text description with autosave, comment/activity history, assignee picker, file attachments, and vehicle-location history.
- **Status workflow** — a guided Open → In Review → Closed flow (enforced both in the UI and the API) with an optional comment on each status change.
- **Report Incident** — a multi-step creation flow with type-driven defaults (e.g. Emergency incidents auto-set Critical priority) and severity pills.
- **Export** — single or bulk incident export to CSV or PDF, including full descriptions, comments, and activity history.
- **Insights dashboard** — built-in charts (by type, severity, route, assignee, driver, resolution rate, 14-day trends) plus a drag-and-drop layout, hide/restore, and a custom dashboard builder (choose chart type, grouping, and filters) with edit support.
- **Feedback** — a lightweight 1–5 star "Leave Feedback" flow with a rating-dependent follow-up prompt.

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Next.js Route Handlers as a mock backend over an in-memory data store (resets on server restart — there's no database)
- `@dnd-kit` for drag-and-drop dashboard reordering
- `jspdf` / `jspdf-autotable` for client-side PDF export

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Notes

This is a prototype: the "backend" is an in-memory store seeded with sample incidents, so data does not persist across server restarts. It's meant to demonstrate UI/UX, product thinking, and end-to-end interaction design rather than to be production infrastructure.
