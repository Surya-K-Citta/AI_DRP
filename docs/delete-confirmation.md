# Delete confirmation

Nothing is deleted in the app without a confirmation dialog first. The dialog (`client/src/components/ui/ConfirmProvider.tsx`, mounted once in `App.tsx`) shows a title, a sentence naming what will be removed, **Cancel** (focused by default, Esc also cancels) and a red **Delete** button.

## How it applies

- **Automatic:** any button that holds a trash icon (`Trash2` / `Trash` from lucide-react) or carries `data-confirm-delete` is intercepted. The click is held, the dialog asks, and only **Delete** lets the original click through. New delete buttons are covered without extra code.
- **Wording:** a button can set `data-confirm-title`, `data-confirm-body` and `data-confirm-label` (for example “Clear chat”). Without them the dialog says “Delete this item?”.
- **Code paths:** use `const confirm = useConfirm(); if (!(await confirm({ title, body }))) return;`. Never use `window.confirm`.
- **Opt out:** `data-no-auto-confirm` on a button that already asks its own way: the dashboard report dialog (shows progress while deleting) and account deletion (typed `DELETE`).

## Covered today

Dashboard reports and DPR management (All DPRs) cards (own dialog, shared through `lib/dprActions.tsx`), Projects, admin users / policies / documents / vector stores, chat “clear conversation”, report-style editor (custom sections and added blocks; deleting a picture already has its own dialog), and every row-remove button in the DPR forms (promoters, machinery, financial rows and so on).
