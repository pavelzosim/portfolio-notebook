# Private article drafts

Preview uses the approved Atlas article renderer and this directory's index.json:
http://127.0.0.1:8766/lab/atlas-ui/?page=article&slug=procedural-facade-modules&draft=1

Draft records require state=draft and indexable=false. The lab reads them only with draft=1; public pages do not load the draft registry. Share actions are omitted. The production builder excludes this directory, including media.

## Procedural Facade Modules
- English article: procedural-facade-modules.html
- Eight explicit SVG screenshot placeholders: media/procedural-facade-modules/
- Captions specify the actual captures needed. No placeholder is implementation evidence.
- Reconstructed code examples are labeled; the supplied briefs are the basis for implementation claims.
- Related project context: Controlled Procedurality and The Light System.

Before publication, replace placeholders with local project captures, verify code against the actual graphs and recheck integration status with the author. Then move the article/media into published source locations and register the production URL/date/series explicitly.
