# VLP CRUD Patterns

## API Selection

Use standard URLs when endpoints follow `/list`, `/add`, `/copy`, `/edit`, `/deleteById`, `/deleteBatch`, `/exportExcel`, and `/importExcel`:

```ts
const urls = createCrudUrls('/fleet/station');
const api = createRequestCrudApiAdapter<StationRecord>(urls, {
  contextParams: () => ({ mapId: props.mainId }),
});
```

`contextParams` is resolved for every request and is applied to list, create, edit, copy, import, and export. Use `appendPayload` only for payload transformations unrelated to context.

Pass an existing API module to `useCrudPage` when methods already exist. Use `apiResolveOptions.methodMap` only for names that cannot be detected. Use `createCrudApiAdapter` when mapping query parameters, normalizing list rows, or converting form payloads.

## Typed Schema

```ts
export interface StationRecord {
  id?: string;
  isValid?: number;
  stationCode?: string;
  stationName?: string;
  updateTime?: string;
}

export const stationCrudSchema = defineCrudSchema<StationRecord>()({
  name: 'station',
  rowKey: 'id',
  enableSelection: true,
  queryForm: [
    {
      component: 'Input',
      field: 'stationCode',
      label: () => $t('ui.stationCode'),
      queryMode: 'fuzzy',
    },
  ],
  tableColumns: [
    { dataIndex: 'stationCode', title: () => $t('ui.stationCode') },
    {
      dataIndex: 'isValid',
      title: () => $t('ui.isValid'),
      valueType: 'status',
    },
  ],
  drawer: {
    detail: { enabled: true },
    form: {
      enabled: true,
      fields: [
        {
          component: 'Input',
          field: 'stationCode',
          label: () => $t('ui.stationCode'),
          required: true,
        },
        {
          component: 'DictSelect',
          componentProps: { dictKey: 'isValid', stringToNumber: true },
          defaultValue: 1,
          field: 'isValid',
          label: () => $t('ui.isValid'),
          required: true,
        },
      ],
      title: () => $t('ui.station'),
      wrapperClass: 'grid-cols-2',
    },
  },
  rowActions: ['edit', 'delete'],
  toolbarActions: ['create', 'copy', 'batchDelete'],
});
```

## Field Mapping

| Backend field | Form component | Table behavior |
| --- | --- | --- |
| Text/code | `Input` or `Textarea` | Plain column |
| Integer/decimal | `InputNumber` | Plain column |
| `sysAllDictItems` dictionary | `DictSelect` with `dictKey` | Use backend `*_dictText` when present |
| Remote options | `ApiSelect` with dynamic `componentProps` | Display returned text field |
| Binary status | `DictSelect` with `stringToNumber` | `valueType: 'status'` |
| Primary key | No form field | Configure only as `rowKey` |

Use `formItemClass` for grid spans. Use `dependencies` for conditional required, disabled, show, or rule behavior. Use `createCrudDuplicateCheckRule` for the standard duplicate-check endpoint.

## Icons

Use the unified icon component for commands or custom slots:

```vue
<script setup lang="ts">
import { VlpIcon } from '@vlp/web-base/icons';
</script>

<template>
  <VlpIcon icon="ant-design:reload-outlined" />
  <VlpIcon icon="svg:download" />
  <VlpIcon icon="iconfont:icon-qiyeweixin3" />
</template>
```

| Source | `VlpIcon` value | Ownership |
| --- | --- | --- |
| Iconify | `collection:icon-name` | Page or schema |
| Local SVG | `svg:file-name` | Shared icon package |
| Iconfont | `iconfont:symbol-id` | Script registered by the product application |
| Vue component | `:icon="Component"` | Use only when a string icon source is unavailable |

Toolbar action configuration stays data-only:

```ts
toolbarActions: [
  'create',
  {
    icon: 'ant-design:reload-outlined',
    key: 'refresh',
    label: $t('common.refresh'),
    onClick: () => crud.fetchList(),
  },
],
```

Do not initialize Iconfont scripts in a page. The product plugin calls `registerVlpIconfont()` once. Do not generate direct `IconifyIcon`, legacy `SvgIcon`, `createFromIconfontCN`, or Antdv icon imports in CRUD code.

## Thin Page

```ts
const props = withDefaults(defineProps<{ mainId?: string }>(), { mainId: '' });
const urls = createCrudUrls('/fleet/station');
const crud = useCrudPage<StationRecord>({
  api: createRequestCrudApiAdapter(urls, {
    contextParams: () => ({ mapId: props.mainId }),
  }),
  schema: stationCrudSchema,
});

watch(
  () => props.mainId,
  (mainId) => {
    if (mainId) void crud.fetchList({ page: 1 });
    else crud.clearData();
  },
  { immediate: true },
);
```

Render context-dependent CRUD only after a parent is selected:

```vue
<CrudPage v-if="mainId" :model="crud" height="420px" layout-mode="fixed" />
```

## Master-Detail

Use the parent's derived selection instead of searching `dataSource` manually:

```ts
watch(
  () => parentCrud.selectedRow.value,
  (row) => {
    childParams.parentId = `${row?.id || ''}`;
    if (row) void childCrud.fetchList({ page: 1 });
    else childCrud.clearData();
  },
  { immediate: true },
);
```

Do not add a module-specific relation hook. Revisit a shared relation abstraction only after multiple domains require behavior beyond `selectedRow`, `clearData`, and one watcher.

## Verification

- Verify search/reset, pagination, sorting, create, edit, copy, delete, batch delete, import, export, dictionaries, remote options, and duplicate checks in scope.
- Verify custom icons render through `VlpIcon`; for Iconfont, verify the application has registered its script once.
- Verify a context-dependent page cannot create data before its parent is selected.
- Build `VLP-Web-Base` after changing public exports and confirm `dist/crud/index.mjs` and declarations contain them.
- Typecheck both projects and run `scripts/check-crud.mjs` on generated or migrated paths.
