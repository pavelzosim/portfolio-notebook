# Wix migration workflow

1. Inventory every public post and project URL in `wix-map.json`.
2. Export the title, slug, publication and update dates, author, excerpt, categories, tags, SEO fields, and rich-content body.
3. Convert rich content to Markdown while preserving code blocks, headings, lists, tables, captions, and embeds.
4. Download original media into `public/media/<type>/<slug>/`; record source URL, alt text, caption, and display order.
5. Replace Wix media URLs in Markdown with repository-relative paths.
6. Verify the local page against Wix before marking it `ready`.
7. Publish the new route, then prepare a redirect from the original Wix slug.

Never bulk-delete Wix content. Wix remains the public reference until every migrated route has passed review.
