(() => {
  const highlightTarget = document.querySelector('[data-home-highlights]');
  const recentTarget = document.querySelector('[data-home-recent]');
  const blogRecentTarget = document.querySelector('[data-blog-recent]');
  const envTarget = document.querySelector('[data-env-highlights]');
  if (!highlightTarget || !recentTarget) return;

  const ENV_TAG = 'procedural-environments';

  const make = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  };

  const postUrl = post => post.localPath || post.sourceUrl;
  const sorted = posts => posts.sort((a, b) => (a.homepage.rank ?? 0) - (b.homepage.rank ?? 0));
  const recency = post => Date.parse(post.siteDate || post.datePublished) || 0;

  const renderHighlights = (target, posts) => {
    target.replaceChildren();
    posts.filter(post => post.image).slice(0, 4).forEach(post => {
      const card = make('a', 'highlight-card');
      card.href = postUrl(post);
      const image = document.createElement('img');
      image.src = post.image;
      image.alt = post.imageAlt || post.title;
      image.loading = 'lazy';
      const meta = make('span', 'highlight-meta');
      meta.append(make('span', 'highlight-kind', post.group.toUpperCase()));
      meta.append(make('strong', '', post.title));
      meta.append(make('small', '', post.tags.slice(0, 3).join(' · ')));
      card.append(image, meta);
      target.append(card);
    });
  };

  window.atlasFetchRegistry('/content/posts/index.json')
    .then(data => {
      const highlighted = data.records.filter(post => post.homepage && post.homepage.highlight);
      renderHighlights(highlightTarget, sorted(highlighted));
      if (envTarget) {
        const environment = data.records
          .filter(post => post.state === 'published' && post.indexable !== false && post.tags.includes(ENV_TAG))
          .sort((a, b) => recency(b) - recency(a));
        renderHighlights(envTarget, environment);
      }
      window.atlasRenderRecentList(recentTarget, data.records, { limit: 5 });
      window.atlasRenderRecentList(blogRecentTarget, data.records, { limit: 5, filter: post => !post.resource });
      document.dispatchEvent(new Event('homepage:records-ready'));
    })
    .catch(() => { recentTarget.textContent = 'Post registry unavailable.'; });
})();
