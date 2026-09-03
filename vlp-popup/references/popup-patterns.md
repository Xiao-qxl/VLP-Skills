# Popup Patterns

## API surface

Modal and drawer APIs share these operations:

| API | Purpose |
| --- | --- |
| `open()` / `close()` | Change visibility; `close()` respects `onBeforeClose` |
| `setData(payload)` / `getData<T>()` | Pass typed context to a connected popup |
| `setState(partial)` | Update title, width, loading, buttons, or behavior |
| `lock()` / `unlock()` | Protect an async submit from closing and duplicate confirmation |
| `useStore(selector)` | Read reactive popup state when rendering depends on it |

Common lifecycle callbacks are `onBeforeClose`, `onCancel`, `onConfirm`, `onOpenChange`, `onOpened`, and `onClosed`.

## Local modal

```vue
<script setup lang="ts">
import { useVbenModal } from '@vlp/web-base/common-ui';

const [Modal, modalApi] = useVbenModal({
  closeOnClickModal: false,
  draggable: true,
  onConfirm: handleConfirm,
  title: '操作确认',
});

async function handleConfirm() {
  modalApi.lock();
  try {
    await save();
    await modalApi.close();
  } finally {
    modalApi.unlock();
  }
}
</script>

<template>
  <a-button @click="modalApi.open()">打开</a-button>
  <Modal>内容</Modal>
</template>
```

Use a drawer by replacing `useVbenModal`, `Modal`, and `modalApi` with their drawer equivalents. Typical widths are expressed through `class`, for example `w-[640px]`.

## Controlled child

Use this shape when the parent already owns an `open` ref:

```ts
const props = defineProps<{ open: boolean; record: null | RecordItem }>();
const emit = defineEmits<{ 'update:open': [value: boolean] }>();

const [Drawer, drawerApi] = useVbenDrawer({
  closeOnClickModal: false,
  onConfirm: handleSubmit,
  onOpenChange: (open) => emit('update:open', open),
  title: title.value,
});

watch(
  () => props.open,
  async (open) => {
    if (!open) {
      await drawerApi.close();
      return;
    }
    drawerApi.open();
    await resetForRecord(props.record);
  },
  { immediate: true },
);

watch(title, (value) => drawerApi.setState({ title: value }));
```

If `onBeforeClose` can reject closing, emit the actual state from `onOpenChange`; do not optimistically set the parent state to false first.

## Connected component

Parent:

```ts
import EditRecordModal from './EditRecordModal.vue';

const [EditModal, editModalApi] = useVbenModal({
  connectedComponent: EditRecordModal,
});

function edit(record: RecordItem) {
  editModalApi.setData({ mode: 'edit', record }).open();
}
```

Child:

```ts
const emit = defineEmits<{ success: [] }>();

const [Modal, modalApi] = useVbenModal({
  onConfirm: submit,
  onOpenChange(open) {
    if (!open) return;
    const data = modalApi.getData<{
      mode: 'create' | 'edit';
      record?: RecordItem;
    }>();
    reset(data);
  },
});
```

Render `<EditModal @success="reload" />` in the parent and `<Modal>...</Modal>` in the child. Do not pass `title`, `footer`, or other popup-state props to `EditModal`; update them through the child API.

## Form submission

```ts
async function handleSubmit() {
  const { valid } = await formApi.validate();
  if (!valid) return;

  popupApi.setState({ confirmLoading: true, submitting: true });
  try {
    const values = await formApi.getValues<FormValues>();
    await save(values);
    emit('success');
    await popupApi.close();
  } finally {
    popupApi.setState({ confirmLoading: false, submitting: false });
  }
}
```

Do not close in `finally`; a failed request should leave the user's values available for correction or retry.

## Detail drawer

For read-only details, use `footer: false` and render a semantic detail component such as `a-descriptions`. Normalize nullish or empty values to the project placeholder (`--` in current CRUD details).

## Close guard

```ts
const [Modal, modalApi] = useVbenModal({
  async onBeforeClose() {
    if (!dirty.value) return true;
    return await confirmDiscardChanges();
  },
});
```

The guard must return `false` to keep the popup open. Avoid a guard that can recursively call the same popup's `close()`.
