# Online tools

Static, browser-only tools using Atlas CSS and the shared notebook layout.

- `/online-tools/` is the browser-tools catalogue.
- `/online-tools/sprite-sheet-assembly/` is the first tool.
- Existing `/tools/` stays the production tools/assets catalogue. Its shared rail and the homepage link to the browser tools.
- `content/online-tools/index.json` registers tools for the production sitemap.
- `scripts/sprite-sheet-core.js` contains grid calculations and Canvas rendering, ported from Pavel Zosim's MIT-licensed desktop tool.
- `scripts/sprite-sheet-tool.js` owns file decoding, frame ordering, animation, and PNG downloads.

No image-processing dependencies, file uploads, backend endpoints, or persistent file storage are used. Image data lives in memory. Files are decoded sequentially and validated against count, file-size, decoded-pixel, and canvas limits. Source files are not included in analytics events. The existing consent-controlled site analytics and the official Buy Me a Coffee button remain separate page integrations.

## Local checks

Serve the repository root using the existing README instructions, then open `/online-tools/sprite-sheet-assembly/` and choose **try demo**. Confirm preview, ordering, playback, and PNG download. Try your own PNG/JPEG sequence, mixed-size frames, transparent frames, corrupt input, keyboard reorder controls, and mobile widths.

Run `node --test scripts/sprite-sheet-core.test.cjs` for grid, mixed-size, power-of-two, limit, and filename regression checks. Run the existing `scripts/build_github_pages.py` and `scripts/audit_site.py` to check generated routes, canonical URLs, sitemap, metadata, and links. Preview builds retain the existing `--noindex` behavior.

Browser verification during implementation covered exported PNG pixels and alpha, nearest-square reserved rows, POT behavior, real file imports, invalid files, natural sorting, move/remove controls, playback, downloads, and widths 1440/1024/768/390. The supplied official button renders one donation link, with a direct-link fallback only when the widget is unavailable.

The official yellow Buy Me a Coffee button uses the supplied `pavel.zosim` script and 🍵 emoji. Payment happens on Buy Me a Coffee.
