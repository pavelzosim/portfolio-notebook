(() => {
  const view = document.body.dataset.contentIndex || 'blog';
  const pageConfig = {
    blog: {
      file: 'BLOG_INDEX.md',
      title: 'Technical notes index',
      listTitle: 'Breakdowns, lessons, and R&D',
      dek: 'Long-form technical notes about rendering, procedural systems, shaders, production tooling, and the decisions behind real-time work.',
      breadcrumb: '/home/pavel/atlas/blog/index.md',
      footer: 'pavelzosim / technical notes index',
      scope: ['Rendering systems', 'Houdini / procedural', 'Shaders / GPU', 'Production lessons']
    },
    tools: {
      file: 'TOOLS_INDEX.md',
      title: 'Tools and assets',
      listTitle: 'Reusable production resources',
      dek: 'Utilities, procedural systems, scripts, and real-time assets. Each record includes implementation context instead of functioning as a download wall.',
      breadcrumb: '/home/pavel/atlas/tools/index.md',
      footer: 'pavelzosim / tools and assets index',
      scope: ['Houdini tools', 'Python utilities', 'Pipeline helpers', 'Real-time assets']
    }
  };

  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  Promise.all([
    fetch('/content/templates/content-index.html'),
    fetch('/content/posts/index.json')
  ])
    .then(async ([templateResponse, indexResponse]) => {
      if (!templateResponse.ok) throw new Error(`Index template: ${templateResponse.status}`);
      if (!indexResponse.ok) throw new Error(`Content index: ${indexResponse.status}`);
      const [template, data] = await Promise.all([templateResponse.text(), indexResponse.json()]);
      document.body.insertAdjacentHTML('afterbegin', template);
      return data.records;
    })
    .then((allRecords) => {
      const config = pageConfig[view];
      const records = view === 'tools' ? allRecords.filter((record) => record.resource) : allRecords;
      const text = (selector, value) => {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
      };

      document.title = `${config.title} / Pavel Zosim`;
      document.querySelectorAll(`[data-nav="${view}"], [data-rail="${view}"]`).forEach((link) => link.classList.add('active'));
      document.querySelector('[data-blog-guide]')?.toggleAttribute('hidden', view !== 'blog');
      text('[data-index-file]', config.file);
      text('[data-index-title]', config.title);
      text('[data-list-title]', config.listTitle);
      text('[data-index-dek]', config.dek);
      text('[data-breadcrumb]', config.breadcrumb);
      text('[data-footer-label]', config.footer);

      const scope = document.querySelector('[data-scope-list]');
      scope.replaceChildren(...config.scope.map((item) => node('li', '', item)));

      const container = document.querySelector('[data-records]');
      const empty = document.querySelector('[data-empty]');
      const search = document.querySelector('#contentSearch');
      const output = document.querySelector('[data-search-output]');
      const listCount = document.querySelector('[data-list-count]');
      const metaCount = document.querySelector('[data-meta-count]');
      const filterButtons = [...document.querySelectorAll('[data-filter]')];
      let activeFilter = 'all';

      const articleKinds = new Set(['article', 'breakdown', 'case study', 'guide', 'lesson', 'reference']);
      const matchesKind = (record) => activeFilter === 'all' ||
        (activeFilter === 'article' && articleKinds.has(record.kind)) || record.kind === activeFilter;

      const renderRecord = (record) => {
        const link = node('a', 'content-record');
        link.href = record.localPath || record.sourceUrl;
        link.setAttribute('role', 'listitem');
        if (!record.localPath) link.rel = 'external';

        const preview = node('div', 'content-preview');
        if (record.image) {
          const image = node('img');
          image.src = record.image;
          image.alt = `${record.title} preview`;
          image.loading = 'lazy';
          preview.append(image);
        } else {
          preview.append(node('span', '', 'NO PREVIEW'));
        }

        const body = node('div', 'content-record-body');
        const meta = node('div', 'content-record-meta');
        meta.append(node('span', 'record-id', record.id), node('span', 'record-kind', record.kind.toUpperCase()));
        body.append(meta, node('strong', '', record.title), node('p', '', record.summary));
        const tags = node('div', 'content-tags');
        record.tags.forEach((tag) => tags.append(node('span', '', `#${tag}`)));
        body.append(tags);

        const state = node('div', `content-state ${record.state.toLowerCase()}`);
        state.append(node('span', '', record.state), node('b', '', record.localPath ? 'OPEN →' : 'SOURCE ↗'));
        link.append(preview, body, state);
        return link;
      };

      const applyFilters = () => {
        const query = search.value.trim().toLowerCase();
        const visible = records.filter((record) => {
          const haystack = [record.title, record.summary, record.kind, record.group, ...record.tags].join(' ').toLowerCase();
          return matchesKind(record) && (!query || haystack.includes(query));
        });
        container.replaceChildren(...visible.map(renderRecord));
        empty.hidden = visible.length !== 0;
        output.textContent = `${String(visible.length).padStart(2, '0')} records`;
        listCount.textContent = `${String(visible.length).padStart(2, '0')} RECORDS`;
        metaCount.textContent = String(records.length).padStart(2, '0');
      };

      filterButtons.forEach((button) => {
        const filter = button.dataset.filter;
        const exists = filter === 'all' || records.some((record) => {
          if (filter === 'article') return articleKinds.has(record.kind);
          return record.kind === filter;
        });
        button.hidden = !exists;
        button.addEventListener('click', () => {
          activeFilter = filter;
          filterButtons.forEach((item) => item.classList.toggle('active', item === button));
          applyFilters();
        });
      });

      const presetTag = new URLSearchParams(location.search).get('tag');
      if (presetTag) search.value = presetTag;
      search.addEventListener('input', applyFilters);
      document.addEventListener('keydown', (event) => {
        if (event.key === '/' && document.activeElement !== search) {
          event.preventDefault();
          search.focus();
        }
        if (event.key === 'Escape' && document.activeElement === search) {
          search.value = '';
          search.blur();
          applyFilters();
        }
      });
      applyFilters();
    })
    .catch((error) => {
      document.body.dataset.error = error.message;
      document.body.textContent = 'Content index unavailable.';
    });
})();
