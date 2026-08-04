# Pavel Zosim — Technical Systems Notebook

Technical-art portfolio, blog, and R&D notebook for Pavel Zosim.

The interface follows an engineering/editorial direction: a dotted-paper
document surface, JetBrains Mono typography, terminal-inspired navigation,
project records, technical notes, tools and assets, and direct contact
information.

## Local preview

Serve the repository root with any static HTTP server, for example:

```sh
python -m http.server 8765
```

Then open `http://127.0.0.1:8765/`.

## Current structure

- `index.html` — homepage content and lightweight interaction
- `styles/atlas.css` — stylesheet orchestrator
- `styles/framework/` — canonical Atlas framework modules
- `styles/home/` — homepage-specific modules
- `content/posts/atlas-html/` — canonical post sources imported from Atlas
- `content/migration/` — content and media provenance maps
- `public/media/` — localized post, project, reel, and shared media
- `scripts/localize_wix_media.py` — repeatable Wix media localization
- `home.css` — compatibility entry point for older embeds

YouTube players and external technical references remain remote by design.
See [ARCHITECTURE.md](ARCHITECTURE.md) for module boundaries and the Wix
migration workflow.
