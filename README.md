# Human Resources and Payroll Module — Grupo 18 (Vite + Vanilla JS)

> **Grupo 18 — Módulo de Recursos Humanos y Planilla.** El diseño de nuestro módulo está en [`specs/001-rrhh-planilla/`](specs/001-rrhh-planilla/):
>
> - [Especificación (`spec.md`)](specs/001-rrhh-planilla/spec.md)
> - [Plan de trabajo (`plan.md`)](specs/001-rrhh-planilla/plan.md)
> - [Modelo Entidad-Relación y diccionario de datos (`data-model.md`)](specs/001-rrhh-planilla/data-model.md) · [imagen del MER](specs/001-rrhh-planilla/mer.png) · [MER resumido](specs/001-rrhh-planilla/mer-resumen.png)
> - [Tareas (`tasks.md`)](specs/001-rrhh-planilla/tasks.md)

Single-page app for the **Human Resources and Payroll** (Recursos Humanos y Planilla) module of an ERP, built with Vite and vanilla HTML, CSS, and JavaScript, with browser `localStorage` persistence.

The user interface is fully in **Spanish**, including labels, validation messages, empty states, and dialogs.

The module covers (user stories US1–US12 in the spec):

- Worker records (fichas de Trabajadores) and catalogs of positions, departments, and cost centers.
- Employment contracts with history and expiry alerts.
- Monthly events (overtime, medical leave, absences) with approval flow.
- Payroll calculation under Chilean law, payslip lifecycle, and period closing.
- Line-by-line payslip explanation and printable / PDF payslip.
- Simulated role-based session, sensitive-data protection, and an append-only audit log.
- Vacations, family allowances, salary simulator, management and pay-equity reports, accounting and payment CSV exports, and versioned legal parameters.

## Setup

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open http://localhost:5173 (or the URL Vite prints).

## Tests

Run the full test suite (unit + integration) with:

```bash
npm test
```

Or a one-off run without watch mode:

```bash
npx vitest run
```

## Code Quality

The project uses ESLint (flat config) and Prettier:

```bash
npm run lint
npm run format:check   # verify formatting
npm run format         # apply formatting
npm run build          # production build with Vite
```

## Configuration

Module settings live in the `userConfig` object at the top of `src/module-config.js`: the module name, the Worker / Contract / Event / Payslip labels, the issuing company data used on payslips, and the `rrhh` block (`enabled`, `label`, `roleSelector`, and `only: true`, which opens the app directly in the HR and Payroll workspace).

## Notes

- Workers are stored under the `localStorage` key `erp_base_module:entities` (shared storage in `src/storage.js`); the rest of the HR tables use the `erp_rrhh:*` prefix. See `specs/001-rrhh-planilla/data-model.md`.
- Workers are never deleted: they are deactivated, and closed payslips are kept as required by law.
- This project intentionally uses vanilla HTML, CSS, and JavaScript for simplicity.
