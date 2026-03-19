# Study System

SvelteKit + Dexie local-first study system based on FSRS, with optional Supabase cloud snapshot sync.

## Scripts

- `npm run dev`
- `npm run test`
- `npm run build`
- `npm run preview`

## Supabase Cloud Sync

1. Create table/policies running [SUPABASE_SETUP.sql](./SUPABASE_SETUP.sql) in Supabase SQL editor.
2. Copy [.env.example](./.env.example) to `.env` and fill values:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_OWNER_ID`
3. Restart `npm run dev`.

With valid env vars, app will:
- auto-sync changes to Supabase snapshot table,
- restore cloud snapshot on startup when local data is empty,
- allow manual sync/restore in Settings page.

## Legacy Import (`studei_backup.json`)

Settings > Backup e manutencao > `Importar backup` now also accepts the legacy `studei_backup.json` format.
It imports only:
- `app_disciplinas` -> `subjects`
- `app_assuntos` -> `topics`

No history/session/review logs are imported from this legacy format.
