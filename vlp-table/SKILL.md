---
name: vlp-table
description: Build, refactor, or review non-standard data tables in VLP-Web/VConn-Web with the configured Vben VXE Grid adapter. Use for custom grids, proxy queries, search forms, cell renderers, toolbar slots, selection, inline behavior, and table API control; use vlp-crud for conventional CRUD pages.
---

# VLP Table

Use the configured `useVbenVxeGrid` wrapper for bespoke tables. For a conventional list with search, pagination, create/edit/delete, import/export, or detail actions, use the CRUD abstraction instead of rebuilding it with VXE Grid.

## Workflow

1. Decide whether the page is standard CRUD or genuinely requires direct grid control. Route standard CRUD work to `vlp-crud`.
2. Inspect the target application's VXE adapter, API response shape, entity type, adjacent grids, and server pagination contract.
3. Import `useVbenVxeGrid` and grid types through the application adapter when available. The adapter owns global defaults and registered cell renderers.
4. Define `gridOptions` with typed columns and either `proxyConfig.ajax` for remote data or `tableData` for caller-owned local data.
5. Put search fields in `formOptions`; do not enable native VXE `formConfig`.
6. Use `toolbar-actions`, `toolbar-tools`, named cell slots, or registered cell renderers only for behavior the schema cannot express cleanly.
7. Control refresh and loading through `gridApi.query`, `reload`, `setLoading`, and `setGridOptions`; do not reach into internal store or mutate rendered rows as a substitute for persistence.
8. Verify initial load, query/reset, pagination, empty state, loading, selection, operation permissions, and narrow/mobile layout.

## Rules

- Use the project's adapter rather than calling `setupVbenVxeTable` in a page. Global defaults and renderers are initialized once by the application.
- The configured proxy response expects `{ items, total }` unless the target adapter or endpoint proves otherwise. Normalize incompatible APIs at the boundary.
- Use `formOptions`, not `gridOptions.formConfig`; the wrapper replaces the native VXE form.
- Use `CellTag`, `CellSwitch`, `CellImage`, `CellLink`, and `CellOperation` only when registered by the inspected adapter.
- For `CellSwitch`, perform persistence in `attrs.beforeChange`; return `false` to reject the visual update.
- Keep operation icons as unified icon strings and enforce access before rendering or executing actions.
- Do not duplicate global pager, sizing, overflow, empty, loading, or toolbar-search behavior in each page.
- Do not use a direct grid to recreate `CrudPage`, `CrudToolbarActions`, or CRUD selection plumbing.

## Reference

Read [references/table-patterns.md](references/table-patterns.md) before implementing or reviewing a direct table. It contains the decision boundary, remote/local patterns, form integration, renderers, slots, and API behavior.
