---
name: frontend
description: Naming conventions, folder hierarchy, and code style for the LMS web admin panel (React + Vite, TypeScript). Use before creating or editing any file under frontend/, so new pages and components match existing house style.
---

# frontend conventions (React + Vite admin panel)

## Folder hierarchy

```
frontend/src/
├── api/           # client.ts (axios instance), <resource>Service.ts
├── components/    # Layout, Modal, DataTable, ProtectedRoute, BulkUploadQuestionsModal
├── context/       # AuthContext.tsx
├── pages/         # one file per route/page
├── utils/         # excelQuestions.ts (bulk upload parsing)
├── types.ts       # shared TS types
├── App.tsx, main.tsx, index.css
└── (public/ holds static SVG assets only)
```

## File naming

- Pages: PascalCase, with no suffix on CRUD/list pages (`Questions.tsx`, `Courses.tsx`, `Subjects.tsx`, `Quizzes.tsx`, `Users.tsx`) — but **not** on `Login.tsx`.
- Generic/reusable components: PascalCase, no suffix, e.g. `DataTable.tsx`, `Modal.tsx`.
- Utils: PascalCase, e.g. `ExcelQuestions.ts`.

## Code style

- Use Tailwind CSS utility classes for styling; do not introduce new per-component CSS files or CSS-in-JS.
- **Components**: **named exports**, not default (`export function DataTable<T>({...}: DataTableProps<T>) { ... }`). This is the opposite of `App/`'s convention — don't mix the two up.
- **Generics**: reusable components are typed with TS generics rather than duplicated per-entity variants (see `Column<T>` / `DataTableProps<T>` in `components/DataTable.tsx`).
- **Styling**: no CSS Modules/Tailwind/styled-components. Plain `className` strings map to hand-written classes in the single global `src/index.css`, which defines CSS custom properties on `:root` (`--bg`, `--surface`, `--primary`, `--radius-md`, etc.) plus utility-ish classes (`.btn`, `.btn-primary`, `.card`, `.badge-success`). Add new classes to `index.css` rather than introducing a new styling approach.
- **State management**: Context API for auth (`context/AuthContext.tsx`, same shape/pattern as `App/`'s `AuthContext`) plus local `useState`/`useEffect` per page for CRUD forms and pagination. No global store library.
- **API layer**: a single axios instance in `api/client.ts` reading `import.meta.env.VITE_API_URL`, storing the token under `admin_token` in `localStorage`, with a response interceptor that redirects to `/login` on 401. Always surface request failures through the exported `apiErrorMessage(err, fallback)` helper (this app's equivalent of `App/`'s `extractErrorMessage`).

## Lint

`oxlint`, not ESLint — see `.oxlintrc.json` (`plugins: ["react", "typescript", "oxc"]`, enforces `react/rules-of-hooks: error` and `react/only-export-components: warn`). No Prettier config in `frontend/`.
