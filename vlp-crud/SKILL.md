---
name: vlp-crud
description: Build, refactor, review, or verify CRUD pages in the VLP-Web/VConn-Web Vue 3 projects with @vlp/web-base/crud. Use for list pages, schema definitions, API adapters, dictionary and remote selects, unified icons, import/export, copy and duplicate checks, master-detail CRUD, or CRUD code-generation cleanup.
---

# VLP CRUD

Build CRUD pages with `useCrudPage + CrudPage + typed schema + API adapter`. Keep entity configuration in a schema file and leave the Vue page responsible only for composition, context, and custom workflows.

## Workflow

1. Inspect the target app, entity/API types, endpoint implementation, adjacent CRUD pages, locale keys, and parent-child relationships before editing.
2. Confirm the list query, result shape, form fields, dictionary fields, remote options, context foreign key, copy endpoint, duplicate checks, and custom actions.
3. Select one API strategy:
   - Use `createCrudUrls` and `createRequestCrudApiAdapter` for conventional endpoints.
   - Pass an existing API module with `apiResolveOptions` when named methods already exist.
   - Use `createCrudApiAdapter` when query, payload, or result transformations are required.
4. Create an entity type and one complete `createStandardCrudSchema<Entity>()` configuration. Use `defineCrudSchema<Entity>()` only when standard actions and drawer defaults do not fit. Put query fields, table columns, form/detail fields, toolbar actions, and row actions in the schema file.
5. Instantiate `useCrudPage<Entity>()` in a thin Vue page. Use `load.enabled/watch` for initial and dependency-driven loading, and `contextParams` for dynamic foreign keys.
6. For tightly coupled master-detail CRUD, create both models in one composition page, derive the child foreign key from `masterCrud.selectedRow`, and render `CrudMasterDetailEmpty` until a master row is selected. Keep each entity schema separate; do not create a Vue component that only wraps one child `CrudPage`.
7. Keep complex user, role, menu, or multilingual forms in the `form-drawer` slot. Do not force them into the automatic form.
8. Run the bundled `scripts/check-crud.mjs <target> --typecheck` from this skill directory. Pass `--workspace <path>` when the current directory is not inside the target workspace. Fix every finding before handoff.

## Generation Rules

- Use `Input`, `InputNumber`, `Textarea`, `DictSelect`, and `ApiSelect`; never generate `JInput`, `JDictSelectTag`, or `IsValidSwitch`.
- Use `DictSelect` for `sysAllDictItems` and `ApiSelect` for remote options.
- Use `valueType: 'status'` for binary status columns instead of copying `bodyCell` status functions.
- Use `formItemClass`, `rules`, and `dependencies`; never generate `colProps`, `show`, `dynamicRules`, or hidden primary-key form items.
- Use `InputNumber` numeric props such as `min`, `max`, and `precision`; never use `maxlength` on it.
- Use delayed schema text such as `label: () => $t('ui.name')` so online locale packs and locale switching remain effective.
- Use `VlpIcon` from `@vlp/web-base/icons` for custom page icons. Use Iconify names such as `ant-design:plus-outlined`, local SVG names such as `svg:download`, and registered Iconfont names such as `iconfont:icon-name`.
- Keep schema toolbar icons as string names because `CrudToolbarActions` renders them with `VlpIcon`. Do not import an icon component only to configure a CRUD action.
- Never generate direct `IconifyIcon`, `SvgIcon`, `createFromIconfontCN`, `@antdv-next/icons`, or `@ant-design/icons-vue` usage in a CRUD page. Product-level Iconfont registration belongs in the application plugin, not the page.
- Use `copyFromForm` behavior through the request adapter. A configured `/copy` endpoint receives the edited copy payload; otherwise CRUD removes the row key and calls create.
- Do not mutate `dataSource` or `pagination` from a business page. Use `load`, `fetchList`, `resetSelection`, and `clearData` through the public model.
- Prefer `load: { immediate: true }` over `onMounted(fetchList)`. For dependent CRUD, use `load: { enabled: () => Boolean(parentId), watch: parentCrud.selectedRow }`; it resets selection and clears disabled child data.
- Keep tightly coupled master and detail CRUD instances in one composition page. Extract a child Vue component only when it has reusable UI, complex slots, dialogs, or independent state.
- Use `CrudMasterDetailEmpty` from `@vlp/web-base/crud` for the unselected detail state instead of copying `div + a-empty` markup.
- Do not introduce domain-specific CRUD composables. Add behavior to the shared base only when it applies across domains.
- Do not emit `as any`, broad compatibility wrappers, mojibake text, or duplicated CRUD plumbing.

## Reference

Read `references/crud-patterns.md` before implementation or review. It contains canonical schemas, adapter choices, master-detail behavior, field mapping, and verification expectations.
