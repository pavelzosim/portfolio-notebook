(() => {
  const loaderSource = document.currentScript?.src || `${window.location.origin}/scripts/article-page.js`;
  const loaderUrl = new URL(loaderSource, window.location.href);
  const basePath = loaderUrl.pathname.split('/scripts/article-page.js')[0];
  const cleanPath = (value) => value.replace(/\?.*$/, '').replace(/\/$/, '');
  const currentPath = cleanPath(window.location.pathname);
  const siteHref = (href) => {
    if (!href || href.startsWith('#') || /^[a-z]+:/i.test(href) || href.startsWith('//')) return href;
    return href.startsWith('/') ? `${basePath}${href}` : href;
  };
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const makeLink = (href, text, className) => {
    const link = make('a', className, text);
    link.href = siteHref(href);
    return link;
  };

  const boot = async () => {
    const content = document.querySelector('.atlas-container, .post-shell');
    if (!content || document.querySelector('.article-workspace')) return;
    document.body.classList.add('article-record-page');

    let registry = { records: [] };
    try {
      const response = await fetch(siteHref('/content/posts/index.json'), { cache: 'no-store' });
      if (response.ok) registry = await response.json();
    } catch (_) { /* The article stays readable if the registry is unavailable. */ }

    const records = Array.isArray(registry.records) ? registry.records : [];
    const recordIndex = records.findIndex((record) => currentPath.endsWith(cleanPath(record.localPath || '')));
    const record = recordIndex >= 0 ? records[recordIndex] : null;

    const workspace = make('div', 'article-workspace');
    const rail = make('aside', 'article-rail');
    rail.setAttribute('aria-label', 'Article contents');
    const main = make('main', 'article-main');
    main.id = 'content';
    const meta = make('aside', 'article-meta');
    meta.setAttribute('aria-label', 'Article metadata');

    const railTitle = make('p', 'article-rail-title', `${record?.id || 'ARTICLE'}.md`);
    const outline = make('ol', 'article-outline');
    const headings = [...document.querySelectorAll('.content-block h2, .content-block h3')];
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `section-${String(index + 1).padStart(2, '0')}`;
      const item = make('li');
      const title = heading.textContent.trim().replace(/^(?:§\s*)?\d+(?:[.\s]+)?/, '');
      const label = `${String(index + 1).padStart(2, '0')} ${title}`;
      item.append(makeLink(`#${heading.id}`, label));
      if (heading.tagName === 'H3') item.classList.add('article-outline--sub');
      outline.append(item);
    });
    rail.append(railTitle);
    if (headings.length) rail.append(outline);
    const indexLink = makeLink('/blog/', '← blog index', 'article-index-link');
    rail.append(indexLink);

    const recordBlock = make('section', 'article-meta-block');
    recordBlock.append(make('p', null, '[RECORD]'));
    const facts = make('dl');
    [['id', record?.id || 'LOCAL'], ['kind', record?.kind || 'article'], ['group', record?.group || 'notes'], ['state', record?.state || 'LOCAL']]
      .forEach(([key, value]) => { facts.append(make('dt', null, key), make('dd', null, value)); });
    recordBlock.append(facts);
    meta.append(recordBlock);

    if (record?.tags?.length) {
      const tags = make('section', 'article-meta-block');
      tags.append(make('p', null, '[TAGS]'));
      const cloud = make('div', 'article-tags');
      record.tags.forEach((tag) => cloud.append(make('span', null, tag)));
      tags.append(cloud);
      meta.append(tags);
    }

    if (recordIndex >= 0 && records.length > 1) {
      const neighbours = make('nav', 'article-neighbours');
      neighbours.setAttribute('aria-label', 'Other articles');
      neighbours.append(make('p', null, '[READ NEXT]'));
      const previous = records[(recordIndex - 1 + records.length) % records.length];
      const next = records[(recordIndex + 1) % records.length];
      neighbours.append(makeLink(previous.localPath, `← ${previous.id} ${previous.title}`));
      neighbours.append(makeLink(next.localPath, `${next.id} ${next.title} →`));
      meta.append(neighbours);
    }

    const footer = document.querySelector('#atlas-footer');
    const canonicalUrl = document.querySelector('link[rel="canonical"]')?.href || window.location.href.split('#')[0];
    const articleTitle = record?.title || document.querySelector('h1')?.textContent?.trim() || document.title;
    const afterword = make('section', 'article-afterword');
    afterword.setAttribute('aria-label', 'Share and continue reading');

    const share = make('section', 'article-share');
    const shareHeader = make('div', 'article-afterword__header');
    shareHeader.append(make('span', null, '[SHARE]'), make('strong', null, 'Share this record'));
    const shareLinks = make('div', 'article-share__links');
    const shareTargets = [
      ['linkedin', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(canonicalUrl)}`],
      ['facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(canonicalUrl)}`],
      ['twitter', `https://twitter.com/intent/tweet?url=${encodeURIComponent(canonicalUrl)}&text=${encodeURIComponent(articleTitle)}`]
    ];
    shareTargets.forEach(([network, href]) => {
      const link = makeLink(href, network);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('aria-label', `Share ${articleTitle} on ${network}`);
      link.addEventListener('click', () => {
        window.gtag?.('event', 'share', {
          method: network,
          content_type: 'article',
          item_id: canonicalUrl
        });
      });
      shareLinks.append(link);
    });
    share.append(shareHeader, shareLinks);
    afterword.append(share);

    const currentTags = new Set(record?.tags || []);
    const related = records
      .map((candidate, index) => {
        if (!candidate.localPath || candidate === record) return null;
        const sharedTags = (candidate.tags || []).filter((tag) => currentTags.has(tag)).length;
        const score = sharedTags * 10 + (record && candidate.group === record.group ? 6 : 0) +
          (record && candidate.kind === record.kind ? 2 : 0) + (candidate.image ? 1 : 0);
        const date = Number(String(candidate.homepage?.date || '').replace('.', '')) || 0;
        return { candidate, score, date, index };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score || b.date - a.date || a.index - b.index)
      .slice(0, 4)
      .map((entry) => entry.candidate);

    if (related.length) {
      const relatedSection = make('section', 'article-related');
      const relatedHeader = make('div', 'article-afterword__header');
      relatedHeader.append(make('span', null, '[RELATED / LATEST]'), make('strong', null, 'Continue reading'));
      const relatedGrid = make('div', 'article-related__grid');
      related.forEach((candidate) => {
        const card = makeLink(candidate.localPath, null, 'article-related-card');
        const media = make('span', 'article-related-card__media');
        if (candidate.image) {
          const image = make('img');
          image.src = siteHref(candidate.image);
          image.alt = `${candidate.title} article preview`;
          image.loading = 'lazy';
          media.append(image);
        } else {
          media.append(make('span', null, 'NO PREVIEW'));
        }
        const body = make('span', 'article-related-card__body');
        body.append(
          make('small', null, `${candidate.id} / ${candidate.kind}`),
          make('strong', null, candidate.title),
          make('span', null, candidate.summary),
          make('i', null, 'open record →')
        );
        card.append(media, body);
        relatedGrid.append(card);
      });
      relatedSection.append(relatedHeader, relatedGrid);
      afterword.append(relatedSection);
    }

    if (footer) footer.before(afterword);
    else content.append(afterword);

    if (footer) {
      const renderLocalFooter = () => {
        if (footer.querySelector('.atlas-local-footer')) return;
        footer.replaceChildren();
        const localFooter = make('div', 'atlas-local-footer');
        const groups = [
          ['PROD_PIPELINES', [
            ['/tools/?tag=houdini', '/ Houdini HDAs'],
            ['/blog/?tag=vfx', '/ Real-time VFX'],
            ['/blog/?tag=procedural', '/ Procedural Systems']
          ]],
          ['R&D_LOGS', [
            ['/blog/?tag=unity', '/ Unity Shaders'],
            ['/blog/?tag=unreal', '/ Unreal Engine'],
            ['/blog/?tag=gpu', '/ GPU Optimization']
          ]],
          ['SYSTEM_ROOT', [
            ['/public/documents/pavel-zosim-technical-artist-cv-2026.pdf', '/ Curriculum Vitae'],
            ['https://github.com/pavelzosim', '/ GitHub Profile']
          ]]
        ];
        groups.forEach(([title, links]) => {
          const group = make('section');
          group.append(make('p', null, title));
          links.forEach(([href, label]) => group.append(makeLink(href, label)));
          localFooter.append(group);
        });
        footer.append(localFooter);
      };
      renderLocalFooter();
      new MutationObserver(renderLocalFooter).observe(footer, { childList: true });
    }

    content.before(workspace);
    main.append(content);
    workspace.append(rail, main, meta);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
