(() => {
  const cleanPath = (value) => value.replace(/\?.*$/, '').replace(/\/$/, '');
  const currentPath = cleanPath(window.location.pathname);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  };
  const makeLink = (href, text, className) => {
    const link = make('a', className, text);
    link.href = href;
    return link;
  };

  const boot = async () => {
    const content = document.querySelector('.atlas-container, .post-shell');
    if (!content || document.querySelector('.article-workspace')) return;
    document.body.classList.add('article-record-page');

    let registry = { records: [] };
    try {
      const response = await fetch('/content/posts/index.json', { cache: 'no-store' });
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
