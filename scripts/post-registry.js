(() => {
  const cache = new Map();

  window.atlasFetchRegistry = (url) => {
    if (!cache.has(url)) {
      cache.set(
        url,
        fetch(url, { cache: 'no-store' })
          .then((response) => {
            if (!response.ok) throw new Error(`Registry ${url} returned ${response.status}`);
            return response.json();
          })
          .catch((error) => {
            cache.delete(url);
            throw error;
          })
      );
    }
    return cache.get(url);
  };

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const postUrl = post => post.localPath || post.sourceUrl;
  const recencyDate = post => post.siteDate || post.datePublished;
  const recencyKey = post => Date.parse(recencyDate(post)) || 0;
  const displayDate = iso => iso ? iso.slice(0, 7).replace('-', '.') : '—';

  // Renders a live "Latest ..." record-list: sorted by siteDate (falling back to
  // datePublished) descending, newest first, capped at `limit`. No per-post
  // homepage flag needed — a new published record appears on its own, the oldest
  // one already showing rolls off. `filter` narrows the eligible records beyond
  // the baseline published+indexable check (e.g. resource-only, or resource-excluded).
  window.atlasRenderRecentList = (target, records, { limit = 5, filter = () => true } = {}) => {
    if (!target) return;
    target.replaceChildren();
    records
      .filter(post => post.state === 'published' && post.indexable !== false && filter(post))
      .slice()
      .sort((a, b) => recencyKey(b) - recencyKey(a))
      .slice(0, limit)
      .forEach(post => {
        const row = make('a');
        row.href = postUrl(post);
        row.setAttribute('role', 'listitem');
        row.append(make('span', 'record-date', displayDate(recencyDate(post))));
        row.append(make('span', 'record-kind', post.kind.toUpperCase()));
        const main = make('span', 'record-main');
        main.append(make('strong', '', post.title));
        main.append(make('span', 'record-tags', post.tags.slice(0, 3).join(' · ')));
        row.append(main, make('span', 'record-arrow', '→'));
        target.append(row);
      });
  };
})();
