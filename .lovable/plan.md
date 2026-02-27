

## Plan: Photo Confirmation for Checklist Items

### Database Changes
1. **Migration** — Add two columns:
   - `checklist_items.requires_photo` (boolean, default false) — configures whether a task demands photo proof
   - `checklist_completions.photo_url` (text, nullable) — stores the uploaded photo URL

2. **Storage bucket** — Create `checklist-photos` public bucket with RLS policies for authenticated users to upload/read

### Type Updates
- `ChecklistItem` in `src/types/database.ts`: add `requires_photo: boolean`
- `ChecklistCompletion` in `src/types/database.ts`: add `photo_url: string | null`

### Settings (Admin — Item Form)
- **`src/components/checklists/ChecklistSettings.tsx`**: Add a Switch toggle "Exige foto de confirmação" in the item sheet form (between Points and Save button). Wire it to `requires_photo` in save/edit handlers and props.
- **`src/hooks/useChecklists.ts`**: Pass `requires_photo` through `addItem` and `updateItem`.

### Completion Flow (ChecklistView)
- **`src/components/checklists/ChecklistView.tsx`**:
  - When user taps an uncompleted item that has `requires_photo === true`, instead of immediately toggling, open a photo capture sheet
  - Create an inline photo capture UI (camera input + preview) that uploads to `checklist-photos` bucket
  - Only after successful upload, call `onToggleItem` with the photo URL
  - Show a small camera icon badge on items that require photo
  - Display the photo thumbnail on completed items that have a `photo_url`

- **`src/hooks/useChecklists.ts`**: Update `toggleCompletion` to accept an optional `photoUrl` parameter and save it to the `checklist_completions` record.

### Files
- **Create**: SQL migration (via migration tool)
- **Edit**: `src/types/database.ts` — add fields to interfaces
- **Edit**: `src/hooks/useChecklists.ts` — pass `requires_photo` in CRUD, accept `photoUrl` in toggle
- **Edit**: `src/components/checklists/ChecklistSettings.tsx` — add Switch in item sheet
- **Edit**: `src/components/checklists/ChecklistView.tsx` — photo capture flow + display

