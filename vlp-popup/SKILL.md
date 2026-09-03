---
name: vlp-popup
description: Build, refactor, or review modal and drawer workflows in VLP-Web/VConn-Web with useVbenModal and useVbenDrawer. Use for form dialogs, detail drawers, connected popup components, async submission, open-state synchronization, nested popups, and close guards.
---

# VLP Popup

Use `useVbenModal` and `useVbenDrawer` from `@vlp/web-base/common-ui`. Treat the returned component and API as one unit; render the component once and control it through the API.

## Workflow

1. Inspect nearby popup components and the target app's public imports before editing.
2. Choose a modal for short, focused decisions or compact forms. Choose a drawer for longer forms, details, or workflows that benefit from preserved page context.
3. Choose one ownership model:
   - Local popup: declare `[Modal, modalApi]` or `[Drawer, drawerApi]` in the same component.
   - Extracted popup: the parent uses `connectedComponent`; the child owns its popup options and content.
   - Controlled component: accept `open`, emit `update:open`, and synchronize the external state with the popup API.
4. Pass records or context with `api.setData(payload).open()` and read them with `api.getData<T>()` when using a connected popup. For ordinary controlled children, typed props are also valid.
5. Put validation and persistence in `onConfirm`. Set `submitting`/`confirmLoading` or call `lock()` for the whole async operation, clear it in `finally`, then close only after success.
6. Keep titles, locale text, mode, and other reactive options synchronized with `api.setState(...)`.
7. Verify cancel, mask click, Escape, duplicate submit, validation failure, success, error, and reopen behavior.

## Rules

- Do not build feature dialogs with raw `<a-modal>` or `<a-drawer>` when the VLP popup API fits. Static confirmation helpers such as `Modal.confirm` remain appropriate for a simple destructive confirmation.
- Do not bind a second visibility mechanism directly to the rendered popup. Use `open()`/`close()` and `onOpenChange` to keep one source of truth.
- Use `onBeforeClose` when dirty state or an in-flight operation may block closing.
- Use `destroyOnClose` when content must be recreated; otherwise reset stale form or selection state explicitly on each open.
- Do not leave the popup locked after a rejected request. Loading state must be released in `finally`.
- When `connectedComponent` is used, configure popup state inside the connected child or through its API; do not also pass popup-state props from the parent.
- Keep nested popup APIs distinct and close only the active layer.

## Reference

Read [references/popup-patterns.md](references/popup-patterns.md) before implementing or reviewing a popup. It contains local, controlled, connected, form-submit, detail, and close-guard patterns.
