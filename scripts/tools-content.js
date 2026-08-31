(() => {
  const highlightTarget = document.querySelector('[data-tools-highlights]');
  const recentTarget = document.querySelector('[data-tools-recent]');
  if (!highlightTarget || !recentTarget) return;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const postUrl = post => post.localPath || post.sourceUrl;
  const sorted = posts => posts.slice().sort((a, b) => (a.toolsHome.rank ?? 0) - (b.toolsHome.rank ?? 0));

  const renderHighlights = posts => {
    highlightTarget.replaceChildren();
    posts.filter(post => post.image).slice(0, 4).forEach(post => {
      const article = make('article', 'highlight-card');
      const cover = make('a', 'card-cover');
      cover.href = postUrl(post);
      const image = document.createElement('img');
      image.src = post.image;
      image.alt = post.imageAlt || post.title;
      image.loading = 'lazy';
      const meta = make('span', 'highlight-meta');
      meta.append(make('span', 'highlight-kind', post.toolsHome.highlightKind));
      meta.append(make('strong', '', post.title));
      meta.append(make('small', '', post.toolsHome.blurb));
      cover.append(image, meta);
      const actions = make('span', 'card-actions');
      const link = make('a', '', 'Download →');
      link.href = postUrl(post);
      actions.append(link);
      article.append(cover, actions);
      highlightTarget.append(article);
    });
  };

  window.atlasFetchRegistry('/content/posts/index.json')
    .then(data => {
      const highlighted = data.records.filter(post => post.resource && post.toolsHome && post.toolsHome.highlight);
      renderHighlights(sorted(highlighted));
      window.atlasRenderRecentList(recentTarget, data.records, { limit: 5, filter: post => post.resource });
      document.dispatchEvent(new Event('tools:records-ready'));
    })
    .catch(() => { recentTarget.textContent = 'Post registry unavailable.'; });
})();
