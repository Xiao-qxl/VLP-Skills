---
name: vlp-form
description: Build, refactor, or review schema-driven forms in VLP-Web/VConn-Web with useVbenForm. Use for standalone forms, modal or drawer forms, dynamic fields, validation, remote or dictionary selects, date mapping, uploads, and reactive schemas.
---

# VLP Form

Build forms with the project-configured `useVbenForm`, a typed `VbenFormSchema[]`, and the returned `formApi`. Prefer schema configuration over manually repeating form-item markup.

## Workflow

1. Inspect the target application's form adapter, entity/API types, adjacent forms, and locale keys. Use the app adapter when it exists so component names and props stay typed.
2. Define a form-value interface and a typed schema. Use the registered component names documented in the reference.
3. Configure layout through `wrapperClass`, `formItemClass`, `layout`, and `commonConfig`. Use `showDefaultActions: false` inside a modal or drawer whose footer owns submission.
4. Express required, format, and cross-field validation with project rules or `z`. Express reactive visibility, disabling, props, and rules with `dependencies`.
5. On each edit/copy open, reset validation and values, normalize API data, then call `setValues`. Do not allow values from the prior record to leak into the next open.
6. Before persistence, call `validate()`, then obtain transformed values with `getValues<T>()`. Keep request loading in the owning page or popup.
7. When schema inputs such as mode, options, or locale change, update the live form with `formApi.setState({ schema })` or use a reactive options object.

## Rules

- Use registered names such as `Input`, `InputNumber`, `InputPassword`, `Textarea`, `Select`, `DictSelect`, `ApiSelect`, `TreeSelect`, `DatePicker`, `RangePicker`, `Switch`, `RadioGroup`, `Upload`, and `IconPicker`.
- Use `DictSelect` for dictionaries and `ApiSelect`/`ApiTreeSelect`/`ApiCascader` for reusable remote option loading. A plain `Select` is fine for already-loaded local options.
- Use `rules: 'required'` for input-like fields and `rules: 'selectRequired'` for selections, or use `z` for richer validation.
- Use `formItemClass`; do not revive legacy `colProps`. Use `dependencies`; do not generate legacy `dynamicRules` or ad-hoc schema mutation watchers for field-to-field behavior.
- Use `InputNumber` for numeric values and numeric props such as `min`, `max`, and `precision`. Do not put `maxlength` on numeric inputs.
- Keep labels and placeholders locale-aware. If online locale packs or runtime switching matter, use computed schema or delayed translation functions and push schema updates to the mounted form.
- Do not include hidden primary-key form items merely to carry an id. Merge identifiers into the submit payload outside the visual schema.
- Do not cast schema or values to `any` to bypass component-prop errors; correct the component name, prop shape, or form-value type.

## Reference

Read [references/form-patterns.md](references/form-patterns.md) before implementing or reviewing a form. It contains registered components, layout, validation, dependencies, value lifecycle, transformation, and popup integration patterns.
