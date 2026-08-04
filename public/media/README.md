# Media library

Portfolio media is stored locally by content type and source slug:

```text
media/
|-- home/home/
|-- posts/<slug>/
|-- projects/<slug>/
|-- reel/
`-- shared/
```

The original CDN URL, local path, file size, and checksum are recorded in
`content/migration/media-map.json`. Run `scripts/localize_wix_media.py` after
importing or updating Atlas HTML sources.

YouTube players and external technical references intentionally remain remote.
