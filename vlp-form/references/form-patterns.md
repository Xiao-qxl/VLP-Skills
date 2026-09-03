# Form Patterns

## Imports and adapter boundary

Inside VLP-Web-Base feature code, import `useVbenForm`, `z`, `VbenFormSchema`, and `VbenFormProps` from the local application adapter (currently `src/adapter/form`). This preserves the typed component map configured by the application.

In an L3 product package, inspect its public conventions first. `@vlp/web-base/common-ui` and `@vlp/web-base/common-ui/form` expose the runtime form APIs, but do not invent a private or source-tree import path.

The runtime's `@vlp/web-base/core/form-ui` is an infrastructure export used by adapter/bootstrap code. Feature pages should not call `setupVbenForm`.

## Registered schema components

| Category | Components |
| --- | --- |
| Text | `Input`, `InputPassword`, `Textarea`, `Mentions`, `AutoComplete` |
| Numeric | `InputNumber`, `Rate` |
| Selection | `Select`, `Checkbox`, `CheckboxGroup`, `Radio`, `RadioGroup`, `Switch` |
| Hierarchy | `Cascader`, `TreeSelect` |
| Remote | `ApiSelect`, `ApiCascader`, `ApiTreeSelect` |
| Domain | `DictSelect`, `IconPicker` |
| Date/time | `DatePicker`, `RangePicker`, `TimePicker` |
| Content/actions | `Upload`, `Divider`, `Space`, `DefaultButton`, `PrimaryButton` |

Use the exact registered capitalization. `Textarea`, for example, is not `TextArea`.

## Typed schema

```ts
interface FormValues {
  name: string;
  quantity?: number;
  status: number;
}

const schema = computed<VbenFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: {
      allowClear: true,
      placeholder: $t('crud.placeholder.input', [$t('entity.name')]),
    },
    fieldName: 'name',
    formItemClass: 'col-span-2',
    label: $t('entity.name'),
    rules: 'required',
  },
  {
    component: 'InputNumber',
    componentProps: { min: 0, precision: 0 },
    fieldName: 'quantity',
    label: $t('entity.quantity'),
  },
  {
    component: 'DictSelect',
    componentProps: { dictCode: 'valid_status' },
    fieldName: 'status',
    label: $t('common.status'),
    rules: 'selectRequired',
  },
]);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: { class: 'w-full' },
    labelWidth: 80,
  },
  layout: 'vertical',
  schema: schema.value,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});
```

Render `<Form />`. Field spans must match the wrapper grid; use `col-span-2` for a full row in a two-column form.

## Validation

Use the built-in strings for ordinary required checks. Use `z` for constraints:

```ts
rules: z.string().min(1, requiredMessage).max(64, maxMessage)
```

For cross-field validation, validate the related values in the submit handler or use a schema refinement when the error needs to belong to a field. Keep validation messages localized.

## Dependencies

```ts
{
  component: 'Input',
  dependencies: {
    disabled: (values) => values.mode === 'readonly',
    if: (values) => values.kind === 'advanced',
    required: (values) => values.kind === 'advanced',
    triggerFields: ['kind', 'mode'],
  },
  fieldName: 'advancedCode',
  label: $t('entity.advancedCode'),
}
```

- `if` removes the field DOM.
- `show` hides it with CSS while preserving the DOM.
- `disabled`, `required`, `rules`, and `componentProps` can react to `triggerFields`.
- `trigger` is for a necessary side effect; prefer declarative dependency properties when possible.

## Value lifecycle

```ts
async function resetForRecord(record?: Entity) {
  await nextTick();
  await formApi.resetForm();
  await formApi.setValues({
    name: record?.name ?? '',
    quantity: record?.quantity,
    status: record?.status ?? 1,
  });
  await formApi.resetValidate();
}

async function submit() {
  const { valid } = await formApi.validate();
  if (!valid) return;
  const values = await formApi.getValues<FormValues>();
  await save({ ...values, id: activeRecord.value?.id });
}
```

`setValues` filters fields not present in the schema by default. Pass `false` as its second argument only when the extra fields are intentionally part of form state.

Useful API methods include `getValues`, `setValues`, `setFieldValue`, `resetForm`, `resetValidate`, `validate`, `validateField`, `updateSchema`, `removeSchemaByFields`, `setState`, and `getFieldComponentRef`.

## Date ranges and arrays

Use `fieldMappingTime` to map a range field into request keys:

```ts
fieldMappingTime: [
  ['createdAtRange', ['createdAtStart', 'createdAtEnd'], 'YYYY-MM-DD HH:mm:ss'],
],
```

Use `arrayToStringFields` only when the API contract uses a delimited string. Do not manually transform the same field again after `getValues()`.

## Remote options

- Use `DictSelect` for `sysAllDictItems`-style dictionary codes.
- Use `ApiSelect` when the component should own remote loading, result extraction, and label/value mapping.
- Use `Select` when the page intentionally loads several related option lists together or the options require local composition.
- Load independent option lists with `Promise.all`, normalize them to typed `{ label, value }` items, and handle edit values that arrive as delimited strings.

## Reactive schema

Passing `schema.value` to a non-reactive options object captures its current value. When mode, locale, or option refs change, synchronize it:

```ts
watch(schema, () => formApi.setState({ schema: schema.value }), { deep: true });
```

Alternatively, pass a reactive options object supported by `useVbenForm`. Avoid rebuilding the whole form component for routine schema changes.
