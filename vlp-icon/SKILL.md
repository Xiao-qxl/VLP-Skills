---
name: vlp-icon
description: Build, refactor, or review icons in VLP-Web/VConn-Web with the unified VlpIcon system, Iconify names, local SVGs, and product-registered Iconfont symbols. Use for action configuration, buttons, menus, status visuals, loading icons, icon sizing, and product-level registration.
---

# VLP Icon

Use `VlpIcon` and icon exports from `@vlp/web-base/icons`. Prefer string icon names so configuration remains data-only and every source shares sizing, color, rotation, spin, fallback, and attribute behavior.

## Workflow

1. Determine the icon source:
   - **Iconify** – Use `collection:icon-name` (e.g., `ant-design:reload-outlined`).
   - **Local SVG** – Use `svg:file-name` (the SVG file must be in the shared icon package).
   - **Iconfont** – Use `iconfont:symbol-id` (the Iconfont script must be registered once by the product application).
   - **Vue component** – Use a component exported by `@vlp/web-base/icons` when a component-valued third-party API requires it, or pass it to `VlpIcon` when a string source is unavailable.

2. For toolbar actions, keep the icon as a string in the schema; `CrudToolbarActions` will render it with `VlpIcon`.

3. For custom slots, import `VlpIcon` and use the same string format.

4. Verify that Iconfont symbols are registered globally (by the product plugin) before using them in any page.

## Rules

- **Use the unified package** – use `VlpIcon` for ordinary rendering and import component icons only from `@vlp/web-base/icons` when an API requires a component. Never import `IconifyIcon`, `SvgIcon`, `createFromIconfontCN`, `@antdv-next/icons`, `@ant-design/icons-vue`, or `@iconify-icons/*` in a feature page.
- **Keep toolbar icons as strings** – toolbar action configuration should contain `icon: "ant-design:plus-outlined"`; do not import an icon component only to configure a CRUD action.
- **Product‑level Iconfont registration belongs in the application plugin** – do not call `registerVlpIconfont()` or load Iconfont scripts in a page.
- **Use Iconify names** – follow the `collection:icon-name` pattern (e.g., `ant-design:plus-outlined`, `mdi:home`).
- **Use local SVG names** – prefix with `svg:` and the file name (without extension) that exists in the shared icon package.
- **Use registered Iconfont names** – prefix with `iconfont:` and the symbol‑id defined in the product’s Iconfont project.
- **For complex custom icons** – if a string source is impossible, pass a Vue component via `:icon="Component"` (this is the only exception to the string‑only rule).
- **Keep icons accessible** – an icon-only interactive control needs an accessible name (`aria-label`) and usually a tooltip. Decorative icons should not become the only carrier of meaning.
- **Use built-in presentation props** – prefer `size`, `color`, `rotate`, `spin`, and `fallback` over one-off wrapper CSS when they express the intent.

## Examples

### Toolbar action (schema)
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

### Custom slot (Vue template)
```vue
<template>
  <VlpIcon icon="ant-design:reload-outlined" />
  <VlpIcon icon="svg:download" />
  <VlpIcon icon="iconfont:icon-qiyeweixin3" />
</template>

<script setup lang="ts">
import { VlpIcon } from '@vlp/web-base/icons';
</script>
```

### Iconfont registration (product plugin, once)
```ts
// app/plugins/icon.ts
import { registerVlpIconfont } from '@vlp/web-base/icons';

registerVlpIconfont({
  scriptUrl: '//at.alicdn.com/t/font_xxxxxx.js',
});
```

## Verification

- Confirm that ordinary rendered icons and configuration icons are strings passed to `VlpIcon`; keep component imports limited to component-valued APIs.
- Verify that Iconfont symbols are loaded globally (check the product plugin).
- For local SVG, ensure the SVG file exists in the shared icon package.
- Check icon-only buttons for `aria-label`, focus behavior, and an appropriate tooltip.
