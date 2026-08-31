(() => {
  const highlightTarget = document.querySelector('[data-home-highlights]');
  const recentTarget = document.querySelector('[data-home-recent]');
  if (!highlightTarget || !recentTarget) return;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const postUrl = post => post.localPath || post.sourceUrl;
  const sorted = posts => posts.sort((a, b) => (a.homepage.rank ?? 0) - (b.homepage.rank ?? 0));
  const recencyDate = post => post.siteDate || post.datePublished;
  const recencyKey = post => Date.parse(recencyDate(post)) || 0;
  const displayDate = iso => iso ? iso.slice(0, 7).replace('-', '.') : '—';

  const renderHighlights = posts => {
    highlightTarget.replaceChildren();
    posts.filter(post => post.image).slice(0, 4).forEach(post => {
      const card = make('a', 'highlight-card');
      card.href = postUrl(post);
      const image = document.createElement('img');
      image.src = post.image;
      image.alt = post.title;
      image.loading = 'lazy';
      const meta = make('span', 'highlight-meta');
      meta.append(make('span', 'highlight-kind', post.group.toUpperCase()));
      meta.append(make('strong', '', post.title));
      meta.append(make('small', '', post.tags.slice(0, 3).join(' · ')));
      card.append(image, meta);
      highlightTarget.append(card);
    });
  };

  const renderRecent = posts => {
    recentTarget.replaceChildren();
    posts
      .filter(post => post.state === 'published' && post.indexable !== false)
      .slice()
      .sort((a, b) => recencyKey(b) - recencyKey(a))
      .slice(0, 6)
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
        recentTarget.append(row);
      });
  };

  window.atlasFetchRegistry('/content/posts/index.json')
    .then(data => {
      const highlighted = data.records.filter(post => post.homepage && post.homepage.highlight);
      renderHighlights(sorted(highlighted));
      renderRecent(data.records);
      document.dispatchEvent(new Event('homepage:records-ready'));
    })
    .catch(() => { recentTarget.textContent = 'Post registry unavailable.'; });
})();
