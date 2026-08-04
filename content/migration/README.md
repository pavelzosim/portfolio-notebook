# Wix migration workflow

1. Check `atlas-map.json` first. Existing Atlas HTML is the authoritative migration source and must not be reconstructed from Wix.
2. Inventory remaining public post and project URLs in `wix-map.json`.
3. Export only missing material: title, slug, publication and update dates, author, excerpt, categories, tags, SEO fields, and rich-content body.
4. Convert rich content to Markdown while preserving code blocks, headings, lists, tables, captions, and embeds.
5. Download original media into `public/media/<type>/<slug>/`; record source URL, alt text, caption, and display order.
6. Replace Wix media URLs in Markdown with repository-relative paths.
7. Verify the local page against the Atlas source and Wix before marking it `ready`.
8. Publish the new route, then prepare a redirect from the original Wix slug.

Never bulk-delete Wix content. Wix remains the public reference until every migrated route has passed review.
