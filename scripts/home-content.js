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
    posts.slice(0, 6).forEach(post => {
      const row = make('a');
      row.href = postUrl(post);
      row.setAttribute('role', 'listitem');
      row.append(make('span', 'record-date', post.homepage.date || '—'));
      row.append(make('span', 'record-kind', post.kind.toUpperCase()));
      const main = make('span', 'record-main');
      main.append(make('strong', '', post.title));
      main.append(make('span', 'record-tags', post.tags.slice(0, 3).join(' · ')));
      row.append(main, make('span', 'record-arrow', '→'));
      recentTarget.append(row);
    });
  };

  fetch('/content/posts/index.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error(`Post registry returned ${response.status}`);
      return response.json();
    })
    .then(data => {
      const configured = data.records.filter(post => post.homepage && (post.homepage.highlight || post.homepage.recent));
      renderHighlights(sorted(configured.filter(post => post.homepage.highlight)));
      renderRecent(sorted(configured.filter(post => post.homepage.recent)));
      document.dispatchEvent(new Event('homepage:records-ready'));
    })
    .catch(() => { recentTarget.textContent = 'Post registry unavailable.'; });
})();
