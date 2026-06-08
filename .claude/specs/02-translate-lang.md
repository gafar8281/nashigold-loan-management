# Arabic Language Support — i18n + RTL

## Context
The Gold Loan app is English-only with a hard-coded LTR layout (`index.html` `lang="en"`, Inter
font, physical Tailwind utilities like `border-r`/`mr-2`). Branch staff in Saudi Arabia need an
Arabic UI. This adds full internationalization (English + Arabic) with proper RTL mirroring, all
static UI text moved into language resource files, a Noto Sans Arabic web font, and a language
toggle near the profile section in the sidebar.

Decisions confirmed with the user:
- **Library:** `react-i18next` (+ `i18next`, `i18next-browser-languagedetector`).
- **Numerals/dates:** keep Latin/Western digits and `DD/MM/YYYY` even in Arabic — only labels translate.
- **RTL scope:** full conversion of physical → logical Tailwind utilities app-wide.

Scope is **static UI text only** (labels, buttons, placeholders, validation/error messages, modals,
table headers, status badges, nav). User-entered data in Firestore (customer names, notes) is left as-is.

## Deliverable note
The user asked to save this plan at `.claude/specs/02-translate-lang.md`. Plan mode only permits
editing the plan file, so **step 0 of implementation is to copy this spec to
`.claude/specs/02-translate-lang.md`** (matching the existing `01-rabc-setup-.md` convention).

---

## 1. Dependencies & font
- Install: `npm i i18next react-i18next i18next-browser-languagedetector`
- `index.html` `<head>`: add the three Google Fonts `<link>` tags for `Cairo` + `Noto Sans Arabic`
  (preconnect + stylesheet) exactly as provided in the request.

## 2. i18n setup (`src/i18n/`)
- `src/i18n/locales/en.json` and `ar.json` — translation resources, organized by feature
  namespaces as nested keys: `common`, `nav`, `auth`, `dashboard`, `customers`, `loans`,
  `reports`, `branches`, `settings`, `status`, `validation`. Flat-ish nested keys, e.g.
  `loans.newLoan.title`, `validation.required`.
- `src/i18n/index.ts` — initialize i18next:
  - `resources: { en, ar }`, `fallbackLng: 'en'`, `interpolation.escapeValue: false`.
  - `LanguageDetector` with `order: ['localStorage','navigator']`, cache to `localStorage`
    (key e.g. `nashi.lang`).
  - Imported once for its side-effect in `src/main.tsx` (before `<App/>` render).

## 3. Direction / RTL wiring
- **`src/main.tsx`**: import `./i18n`. Wrap `<App/>` with the existing
  `DirectionProvider` (`src/components/ui/direction.tsx`, already wraps radix
  `Direction.DirectionProvider`) so all shadcn/radix primitives mirror.
- **New `src/hooks/useDocumentDirection.ts`** (or inline effect in `App.tsx`): subscribe to
  `i18n.language`; on change set `document.documentElement.lang` and `document.documentElement.dir`
  (`ar` → `rtl`, else `ltr`). Pass the same `dir` into `DirectionProvider`.
- `index.css`: add an Arabic font stack and apply it when `dir="rtl"` /  `:lang(ar)`:
  ```css
  @theme inline { --font-arabic: 'Noto Sans Arabic','Inter Variable',sans-serif; }
  html[dir="rtl"], html[dir="rtl"] body { font-family: var(--font-arabic); }
  ```

## 4. Language toggle component
- **New `src/components/layout/LanguageToggle.tsx`**: a small button/switch using
  `useTranslation()` → `i18n.changeLanguage('en'|'ar')`. Shows "العربية" when in English and
  "English" when in Arabic (or an EN/ع pill).
- Render it in **`src/components/layout/AppLayout.tsx`** in the user/profile block at the bottom of
  the sidebar (next to the Settings gear, lines ~71–88).
- Also drop a compact toggle on **`LoginPage.tsx`** (top-right) since login is outside the layout.

## 5. RTL layout conversion (full, app-wide)
Convert physical → logical Tailwind v4 utilities across `src/**/*.tsx` (~180 occurrences in ~43 files):
- `ml-* → ms-*`, `mr-* → me-*`, `pl-* → ps-*`, `pr-* → pe-*`
- `left-* → start-*`, `right-* → end-*`
- `border-l → border-s`, `border-r → border-e`, `rounded-l* → rounded-s*`, `rounded-r* → rounded-e*`
- `text-left → text-start`, `text-right → text-end`
- `space-x-*` → prefer `gap-*` on a flex/grid parent (space-x doesn't auto-flip), or add `rtl:space-x-reverse`.
- Representative files: `src/components/layout/AppLayout.tsx` (sidebar `border-r`, icon `mr-2`),
  `src/components/ui/sidebar.tsx`, `dropdown-menu.tsx`, `dialog.tsx`, `sheet.tsx`, `table.tsx`,
  and the 10 pages. Radix primitives handle their own internal direction via `DirectionProvider`;
  the class conversion covers our custom spacing/borders/positioning.
- Keep icon-only directional glyphs (e.g. chevrons) acceptable as-is initially; flag any
  back/forward arrows that need `rtl:rotate-180`.

## 6. Externalize all UI strings
Replace hard-coded JSX text with `t('...')` via `const { t } = useTranslation()` in each file, and
add matching keys to both `en.json` and `ar.json`. Coverage:
- **Pages** (`src/pages/*.tsx`): titles, descriptions, table headers, buttons, empty states,
  loading text. (Dashboard, Customers, CustomerDetail, Loans, NewLoan, LoanDetail, Reports,
  Branches, BranchDetail, Login.)
- **Components**: `AddCustomerDialog`, `ApprovalModal`, `EditLoanDialog`, `CreateBranchDialog`,
  `EditBranchDialog`, `UserSettingsModal`, `StatusBadge` (status labels), `TablePagination`.
- **Layout**: `AppLayout` nav labels (`Dashboard/Customers/Loans/Reports/Branches`), "Sign Out",
  "Administrator", "Account Settings", logo subtitle, loading/error alerts.
- **Form placeholders** (e.g. `you@branch.com`, `••••••••`) → keep symbolic ones, translate textual ones.
- **Validation / error messages**: form validation strings in dialogs/`NewLoanPage`, and the auth
  error strings returned from `src/context/AuthContext.tsx` (`login()`), plus the DataContext error.
  Auth/data layer returns **i18n keys** (e.g. `'auth.errors.invalidCredentials'`); the UI translates
  them with `t()`. (Avoids calling `t` outside React.)
- **Status labels** (`src/components/shared/StatusBadge.tsx`): map `LoanStatus` enum →
  `t('status.active'|'overdue'|'pending'|'closed'|'approved')` for display only; the stored/compared
  value stays the English enum.

## 7. Formatters (minimal)
- `src/lib/formatters.ts`: leave `formatCurrency` (Latin digits, `SAR` prefix) and `formatDate`
  (`DD/MM/YYYY`) **unchanged** per the Latin-numerals decision. The literal `'SAR'` stays a code
  constant (universally understood); only surrounding labels are translated.

---

## Critical files
| File | Change |
|---|---|
| `index.html` | Add Google Font links (Cairo + Noto Sans Arabic) |
| `src/main.tsx` | Import `./i18n`; wrap app in `DirectionProvider`; apply `lang`/`dir` |
| `src/i18n/index.ts` (new) | i18next init + language detector |
| `src/i18n/locales/en.json`, `ar.json` (new) | All UI strings |
| `src/hooks/useDocumentDirection.ts` (new) | Sync `<html dir/lang>` to language |
| `src/components/layout/LanguageToggle.tsx` (new) | Toggle near profile + on login |
| `src/components/layout/AppLayout.tsx` | Toggle placement, nav/labels via `t()`, logical classes |
| `src/pages/*.tsx`, `src/components/**/**.tsx` | `t()` strings + logical Tailwind classes |
| `src/components/shared/StatusBadge.tsx` | Translated status labels (display only) |
| `src/context/AuthContext.tsx`, `DataContext.tsx` | Return i18n keys for errors |
| `src/index.css` | Arabic font applied under `dir="rtl"` |
| `.claude/specs/02-translate-lang.md` (new) | Save this spec (step 0) |

## Reuse (don't re-create)
- `DirectionProvider` / `useDirection` already exist in `src/components/ui/direction.tsx`.
- shadcn/radix primitives already consume direction context — no per-component RTL props needed.

---

## Verification
1. `npm run dev` — app loads in English (LTR), Inter font, layout unchanged from today.
2. Click the toggle in the sidebar profile area → UI switches to Arabic:
   - `<html dir="rtl" lang="ar">` (check DevTools elements).
   - Sidebar moves to the right; borders/margins/icons mirror; text right-aligned.
   - Noto Sans Arabic renders for Arabic text.
   - All nav, buttons, table headers, dialog titles/labels/placeholders show Arabic.
3. Open key dialogs (Add Customer, New Loan approval, Edit Loan, Branch create, User settings) —
   verify titles, fields, buttons, and **validation messages** are translated and RTL-correct.
4. Trigger a login error (wrong password) → Arabic error message shown; numbers/SAR/dates remain
   Latin/`DD/MM/YYYY` in both languages.
5. Reload the page → language persists (localStorage). Switch back to English → fully reverts to LTR.
6. `npm run build` and `npm run lint` — no new errors beyond the known pre-existing shadcn lint items.
