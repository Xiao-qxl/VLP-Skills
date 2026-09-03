# VLP Icon Usage Reference

## Icon Source Quick Reference

| Source | Format | Example | Owner |
|---|---|---|---|
| Iconify | `collection:name` | `ant-design:plus-outlined` | Page or schema |
| Local SVG | `svg:file-name` | `svg:download` | Shared icon package |
| Iconfont | `iconfont:symbol-id` | `iconfont:icon-qiyeweixin3` | Product plugin registers |
| Component export | `DownOutlined` | `icon: DownOutlined` | Component-valued API only |

## Iconify

- Repository: https://icon-sets.iconify.design/
- Common collections: `ant-design`, `mdi`, `carbon`, `ph`, `tabler`, `heroicons`
- Usage: `<VlpIcon icon="ant-design:search-outlined" />`

## Local SVG

- Prefix: `svg:`
- The file name matches the SVG file (without extension) in the shared icon package
- Do not import the SVG as a module; pass the name string to `VlpIcon`
- Example: file `icons/download.svg` → `<VlpIcon icon="svg:download" />`

## Iconfont

- Prefix: `iconfont:`
- The symbol ID must match the id attribute in the Iconfont project
- Registration happens once in the product application plugin via `registerVlpIconfont()`
- Never call `registerVlpIconfont()` or load `//at.alicdn.com` scripts in a page
- Example: `<VlpIcon icon="iconfont:icon-qiyeweixin3" />`

## Forbidden Icon Imports

These imports must never appear in CRUD pages or custom components:

- `import { IconifyIcon } from '@iconify/vue'`
- `import { SvgIcon } from '@/components/SvgIcon'`
- `import { createFromIconfontCN } from '@ant-design/icons-vue'`
- `import { PlusOutlined } from '@ant-design/icons-vue'`
- `import { Icon } from '@antdv-next/icons'`
- Any `@iconify-icons/*` package import

Use `VlpIcon` with a string `icon` prop as the normal rendering path. If a third-party API requires a component, import that component from `@vlp/web-base/icons` rather than from its upstream icon package.

## Presentation and accessibility

`VlpIcon` accepts `size`, `color`, `rotate`, `spin`, and `fallback`, and forwards remaining attributes. Numeric sizes become pixels; string sizes such as `1rem` are preserved.

```vue
<a-tooltip title="刷新">
  <a-button type="text" aria-label="刷新" @click="reload">
    <VlpIcon icon="ant-design:reload-outlined" :size="16" />
  </a-button>
</a-tooltip>
```

Use text plus an icon for unfamiliar actions. For a familiar icon-only action, retain the tooltip and accessible name. Do not communicate status only through icon color.
