(() => {
  const highlightTarget = document.querySelector('[data-home-highlights]');
  const recentTarget = document.querySelector('[data-home-recent]');
  const blogRecentTarget = document.querySelector('[data-blog-recent]');
  if (!highlightTarget || !recentTarget) return;

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const postUrl = post => post.localPath || post.sourceUrl;
  const sorted = posts => posts.sort((a, b) => (a.homepage.rank ?? 0) - (b.homepage.rank ?? 0));

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

  window.atlasFetchRegistry('/content/posts/index.json')
    .then(data => {
      const highlighted = data.records.filter(post => post.homepage && post.homepage.highlight);
      renderHighlights(sorted(highlighted));
      window.atlasRenderRecentList(recentTarget, data.records, { limit: 5 });
      window.atlasRenderRecentList(blogRecentTarget, data.records, { limit: 5, filter: post => !post.resource });
      document.dispatchEvent(new Event('homepage:records-ready'));
    })
    .catch(() => { recentTarget.textContent = 'Post registry unavailable.'; });
})();
