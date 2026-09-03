# Table Patterns

## Choose the table layer

| Need | Use |
| --- | --- |
| Standard entity list, search, pagination, form panel, row actions | `CrudPage` / `useCrudPage` via `vlp-crud` |
| Highly custom columns, editable cells, unusual proxy behavior, or grid-specific events | configured `useVbenVxeGrid` |
| Small static presentation with no grid behavior | semantic markup or an Antdv table when an adjacent feature establishes that convention |

Direct VXE Grid is an escape hatch for table-specific behavior, not the default CRUD page generator.

## Adapter boundary

VLP-Web-Base configures the grid in `src/adapter/vxe-table`. That adapter supplies:

- centered, resizable, small columns with overflow handling;
- proxy defaults and `{ items, total }` response mapping;
- pager defaults and mobile layouts;
- the VLP form adapter for search;
- `CellImage`, `CellLink`, `CellTag`, `CellSwitch`, and `CellOperation`;
- unified icons inside operation rendering.

Feature code inside that app should import from its adapter. In an L3 product, inspect its established public import before adding a grid. Never import a runtime source file or initialize global VXE configuration in a feature page.

## Remote grid

```vue
<script setup lang="ts">
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import { useVbenVxeGrid } from '#/adapter/vxe-table';

interface Row {
  id: string;
  name: string;
  status: number;
}

const gridOptions: VxeTableGridOptions<Row> = {
  columns: [
    { field: 'name', title: '名称' },
    { cellRender: { name: 'CellTag' }, field: 'status', title: '状态' },
    {
      cellRender: {
        attrs: { nameField: 'name', onClick: handleOperation },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 160,
    },
  ],
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const result = await getList({
          ...formValues,
          pageNo: page.currentPage,
          pageSize: page.pageSize,
        });
        return { items: result.records, total: result.total };
      },
    },
  },
  toolbarConfig: { search: true },
};

const [Grid, gridApi] = useVbenVxeGrid<Row>({
  formOptions: {
    schema: [
      { component: 'Input', fieldName: 'name', label: '名称' },
    ],
  },
  gridOptions,
  tableTitle: '记录',
});

function handleOperation({ code, row }: { code: string; row: Row }) {
  if (code === 'edit') edit(row);
  if (code === 'delete') remove(row);
}
</script>

<template>
  <Grid />
</template>
```

Confirm the actual VXE proxy callback signature and endpoint pagination names in the installed version or an adjacent implementation. The example shows the project response normalization, not a universal backend contract.

The example uses VLP-Web-Base's configured `#/*` alias. If the target package does not expose that alias, use its established relative or public adapter import.

## Local data

For caller-owned data, pass `tableData` and omit `proxyConfig.ajax`. Update through reactive props or `gridApi.setGridOptions`; do not mix local `tableData` with a remote proxy unless the wrapper's behavior is explicitly required and tested.

## Search form

`formOptions` uses the same schema as `vlp-form`. The wrapper automatically:

- renders compact search actions;
- reloads with current form values on submit;
- resets and reloads on reset;
- includes the latest values in later proxy queries;
- supports the toolbar search toggle when `toolbarConfig.search` is true.

Prefix custom form slots with `form-`, for example a form schema slot named `tenant` is provided as `#form-tenant` on `<Grid>`.

## Registered renderers

### CellTag

```ts
cellRender: {
  name: 'CellTag',
  options: [
    { color: 'success', label: '启用', value: 1 },
    { color: 'error', label: '禁用', value: 0 },
  ],
}
```

### CellSwitch

```ts
cellRender: {
  attrs: {
    async beforeChange(value: number, row: Row) {
      await updateStatus({ id: row.id, status: value });
      return true;
    },
  },
  name: 'CellSwitch',
}
```

Return `false` when the server rejects a change without throwing. The renderer owns its per-row loading flag.

### CellOperation

Options may be preset strings or objects. Object properties may be functions of the row; `show: false` removes an operation. The delete preset renders a confirmation and uses `nameField` in its message.

```ts
options: [
  'edit',
  {
    code: 'history',
    icon: 'ant-design:history-outlined',
    show: (row: Row) => canViewHistory(row),
    text: '历史',
  },
  'delete',
]
```

## Slots and API

Use `#table-title`, `#toolbar-actions`, and `#toolbar-tools` for toolbar composition. Native grid slots other than the wrapper-reserved form/loading/empty slots are delegated.

Use:

- `gridApi.query(params)` to query without resetting grid state;
- `gridApi.reload(params)` when a mutation or search should reload;
- `gridApi.setLoading(boolean)` for caller-owned asynchronous work;
- `gridApi.setGridOptions(partial)` for runtime option changes;
- `gridApi.toggleSearchForm(show?)` for explicit search visibility.

After deletion, account for an empty last page according to the endpoint and VXE proxy behavior; do not assume the current page remains valid.
