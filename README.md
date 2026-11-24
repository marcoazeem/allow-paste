# Allow Paste

A small Chrome extension (Manifest V3) that re-enables pasting into text fields on sites that block it. Useful when retyping things like place names risks typos.

## Install

Works in Chrome, Edge and Brave.

1. Clone or download this repo.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Reload any page where pasting was blocked.

After changing the code, click the reload icon on the extension and refresh the page.

## How it works

`content.js` runs at `document_start` on every page and registers capture-phase listeners on `window`, so it fires before the site's own scripts:

- `paste`, Cmd/Ctrl+V, Shift+Insert and paste `beforeinput` events (plus text drops into fields; file drags are left alone) are hidden from the page's handlers with `stopImmediatePropagation()`, so the site cannot cancel them.
- On `paste`, the extension reads the clipboard text from the event and inserts it itself (`execCommand("insertText")`, falling back to `setRangeText` plus `input`/`change` events), so frameworks such as React notice the change.
- Inline `onpaste`, `ondrop` and `onbeforepaste` attributes are removed as a backup.

## Changelog

- **Fixed:** the extension no longer breaks drag and drop of files into the browser or upload zones.

## Limitations

- Sites that clear the field after pasting (for example with an `input` handler) can still win.
- Custom widgets that aren't real `input`, `textarea` or `contenteditable` elements may not work.
- It runs on all sites. Scope it by editing `matches` in `manifest.json`.
- Only plain text is pasted.

## Files

- `manifest.json` - extension manifest
- `content.js` - the paste-unblocking logic

## License

MIT - see [LICENSE](LICENSE).
