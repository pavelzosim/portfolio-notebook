(() => {
  const view = document.body.dataset.contentIndex || 'blog';
  const loader = document.currentScript || [...document.scripts].find((script) => script.src.includes('/scripts/content-index.js'));
  const loaderPath = new URL(loader?.src || location.href, location.href).pathname;
  const basePath = loaderPath.replace(/\/scripts\/content-index\.js$/, '');
  const withBase = (path) => {
    if (!path?.startsWith('/') || path.startsWith('//')) return path;
    if (basePath && (path === basePath || path.startsWith(`${basePath}/`))) return path;
    return `${basePath}${path}`;
  };
  const pageConfig = {
    projects: {
      file: 'PROJECTS.md',
      title: 'Selected production records',
      listTitle: 'Projects',
      dek: 'A working index of commercial real-time projects. Each record documents the production context, technical-art scope, and constraints that shaped the implementation.',
      breadcrumb: '/home/pavel/technical-art/projects/index.md',
      footer: 'pavelzosim / project index'
    },
    blog: {
      file: 'BLOG_INDEX.md',
      title: 'Technical notes index',
      listTitle: 'Breakdowns, lessons, and R&D',
      dek: 'Long-form technical notes about rendering, procedural systems, shaders, production tooling, and the decisions behind real-time work.',
      breadcrumb: '/home/pavel/atlas/blog/index.md',
      footer: 'pavelzosim / technical notes index'
    },
    tools: {
      file: 'TOOLS_INDEX.md',
      title: 'Tools and assets',
      listTitle: 'Reusable production resources',
      dek: 'Utilities, procedural systems, scripts, and real-time assets. Each record includes implementation context instead of functioning as a download wall.',
      breadcrumb: '/home/pavel/atlas/tools/index.md',
      footer: 'pavelzosim / tools and assets index'
    }
  };

  const node = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  // Newest first, same fallback as the "Latest" widgets in post-registry.js.
  // Records without any parseable date keep their relative order (stable sort)
  // and sink below every dated record, rather than jumping to the top.
  const recordDate = (record) => Date.parse(record.siteDate || record.datePublished) || 0;
  const byRecency = (a, b) => recordDate(b) - recordDate(a);

  const registryPath = view === 'projects' ? '/content/projects/index.json' : '/content/posts/index.json';

  Promise.all([
    document.getElementById('site-index-registry')
      ? Promise.resolve({ ok: true, text: async () => '' })
      : fetch(`${withBase('/content/templates/content-index.html')}?v=4`, { cache: 'no-store' }),
    document.getElementById('site-index-registry')
      ? Promise.resolve({ ok: true, json: async () => JSON.parse(document.getElementById('site-index-registry').textContent) })
      : fetch(withBase(registryPath), { cache: 'no-store' })
  ])
    .then(async ([templateResponse, indexResponse]) => {
      if (!templateResponse.ok) throw new Error(`Index template: ${templateResponse.status}`);
      if (!indexResponse.ok) throw new Error(`Content index: ${indexResponse.status}`);
      const [template, data] = await Promise.all([templateResponse.text(), indexResponse.json()]);
      document.body.insertAdjacentHTML('afterbegin', template);
      if (view !== 'projects') return data.records;
      return data.projects.map((project) => ({
        id: project.id,
        title: project.title,
        kind: 'project',
        group: 'projects',
        summary: project.summary,
        awards: project.awards || [],
        tags: [...project.type.split('/'), ...project.tools.slice(0, 3)].map((tag) => tag.trim().toLowerCase()),
        image: project.image,
        localPath: `/projects/${project.slug}/`,
        state: project.status
      }));
    })
    .then((allRecords) => {
      const config = pageConfig[view];
      const records = (view === 'tools' ? allRecords.filter((record) => record.resource) : allRecords).slice().sort(byRecency);
      const text = (selector, value) => {
        const element = document.querySelector(selector);
        if (element) element.textContent = value;
      };

      document.title = `${config.title} / Pavel Zosim`;
      document.querySelectorAll(`[data-nav="${view}"], [data-rail="${view}"]`).forEach((link) => link.classList.add('active'));
      document.querySelectorAll('.rail > ol:first-of-type a').forEach(link => link.classList.toggle('active', link.getAttribute('href') === `/${view}/`));
      text('[data-index-file]', config.file);
      text('[data-index-title]', config.title);
      text('[data-list-title]', config.listTitle);
      text('[data-index-dek]', config.dek);
      text('[data-breadcrumb]', config.breadcrumb);
      text('[data-footer-label]', config.footer);

      const container = document.querySelector('[data-records]');
      const empty = document.querySelector('[data-empty]');
      const search = document.querySelector('#contentSearch');
      const searchForm = search.closest('form');
      const output = document.querySelector('[data-search-output]');
      const listCount = document.querySelector('[data-list-count]');
      const filterButtons = [...document.querySelectorAll('[data-filter]')];
      let activeFilter = 'all';
      let seriesDirectoryList = null;
      const updateSeriesSelection = () => {
        seriesDirectoryList?.querySelectorAll('a').forEach((link) => {
          const active = link.hash === location.hash;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      };
      window.addEventListener('hashchange', updateSeriesSelection);
      let sortMode = 'series';
      let viewMode = 'compact';

      if (view === 'blog') {
        const params = new URLSearchParams(location.search);
        try {
          sortMode = params.get('sort') || localStorage.getItem('atlas-blog-sort') || 'series';
          viewMode = params.get('view') || localStorage.getItem('atlas-blog-view') || 'compact';
        } catch (_) {
          sortMode = params.get('sort') || 'series';
          viewMode = params.get('view') || 'compact';
        }
        if (!['series', 'newest', 'oldest', 'title'].includes(sortMode)) sortMode = 'series';
        if (!['cards', 'compact'].includes(viewMode)) viewMode = 'compact';

        const controls = node('div', 'index-control-options');
        const sortGroup = node('div', 'index-control-group');
        sortGroup.append(node('span', 'index-control-label', 'SORT'));
        [['series', 'Series'], ['newest', 'Newest'], ['oldest', 'Oldest'], ['title', 'A–Z']].forEach(([value, label]) => {
          const button = node('button', 'atlas-btn atlas-btn--bracket atlas-btn--sm', label);
          button.type = 'button';
          button.dataset.sort = value;
          sortGroup.append(button);
        });
        const viewGroup = node('div', 'index-control-group');
        viewGroup.append(node('span', 'index-control-label', 'VIEW'));
        [['cards', 'Cards'], ['compact', 'Compact']].forEach(([value, label]) => {
          const button = node('button', 'atlas-btn atlas-btn--bracket atlas-btn--sm', label);
          button.type = 'button';
          button.dataset.view = value;
          viewGroup.append(button);
        });
        controls.append(sortGroup, viewGroup);
        searchForm.append(controls);
        searchForm.classList.add('index-search--sticky');
        document.querySelector('.content-catalog')?.prepend(searchForm);
      }

      {
        const seriesDirectory = node('div', 'meta-block index-series-directory');
        seriesDirectory.append(node('p', '', view === 'blog' ? '[SERIES]' : '[ON THIS PAGE]'));
        seriesDirectoryList = node('ol', 'index-series-list');
        seriesDirectory.append(seriesDirectoryList);
        const metaRail = document.querySelector('.meta-rail');
        metaRail.setAttribute('aria-label', 'On this page');
        metaRail.replaceChildren(seriesDirectory);
      }

      const articleKinds = new Set(['article', 'breakdown', 'case study', 'guide', 'lesson', 'reference']);
      const matchesKind = (record) => activeFilter === 'all' ||
        (activeFilter === 'article' && articleKinds.has(record.kind)) || record.kind === activeFilter;

      const renderRecord = (record) => {
        const link = node('div', 'content-record');
        link.id = `record-${record.id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
        const titleLink = node('a', 'content-record-link', record.title);
        titleLink.href = record.localPath ? withBase(record.localPath) : record.sourceUrl;
        link.setAttribute('role', 'listitem');
        if (!record.localPath) titleLink.rel = 'external';

        const preview = node('div', 'content-preview');
        if (record.image) {
          const image = node('img');
          image.src = withBase(record.image);
          image.alt = `${record.title} preview`;
          image.loading = 'lazy';
          preview.append(image);
        } else {
          preview.append(node('span', '', 'NO PREVIEW'));
        }

        const body = node('div', 'content-record-body');
        const meta = node('div', 'content-record-meta');
        meta.append(
          node('span', 'record-id', record.id),
          node('span', 'record-kind', record.kind.toUpperCase()),
          node('span', 'record-date', record.siteDate || record.datePublished?.slice(0, 7) || '—')
        );
        const title = node('strong');
        title.append(titleLink);
        body.append(meta, title, node('p', '', record.summary));
        if (record.awards?.length) {
          const awards = node('div', 'content-project-awards');
          record.awards.forEach(award => awards.append(node('span', '', award.label)));
          body.append(awards);
        }
        const tags = node('div', 'content-tags');
        record.tags.forEach((tag) => {
          const tagLink = node('a', '', `#${tag}`);
          tagLink.href = withBase(`/${view}/?tag=${encodeURIComponent(tag)}`);
          tagLink.setAttribute('aria-label', `Filter by ${tag}`);
          tags.append(tagLink);
        });
        body.append(tags);

        const state = node('div', `content-state ${record.state.toLowerCase()}`);
        state.append(node('span', '', record.state), node('b', '', record.localPath ? 'OPEN →' : 'SOURCE ↗'));
        link.append(preview, body, state);
        return link;
      };

      const applyFilters = () => {
        const query = search.value.trim().toLowerCase();
        const visible = records.filter((record) => {
          const haystack = [record.title, record.summary, record.kind, record.group, record.series?.title, ...record.tags].join(' ').toLowerCase();
          return matchesKind(record) && (!query || haystack.includes(query));
        });
        if (view === 'blog') {
          const series = new Map();
          const independent = [];
          visible.forEach((record) => {
            if (!record.series?.slug) {
              independent.push(record);
              return;
            }
            if (!series.has(record.series.slug)) series.set(record.series.slug, []);
            series.get(record.series.slug).push(record);
          });

          const renderGroup = (title, items, slug, numbered = true, groupIndex = 0) => {
            const section = node('section', 'content-series');
            section.dataset.series = slug;
            section.id = `series-${slug}`;
            const head = node('header', 'content-series-head');
            const meta = node('div', 'content-series-meta');
            meta.append(
              node('span', '', numbered ? `SERIES ${String(groupIndex).padStart(2, '0')}` : 'STANDALONE'),
              node('em', '', `${String(items.length).padStart(2, '0')} ${items.length === 1 ? 'record' : 'records'}`)
            );
            head.append(node('h3', '', title), meta);
            const list = node('div', 'content-log');
            list.setAttribute('role', 'list');
            const ordered = numbered
              ? items.slice().sort((a, b) => (a.series.order || 0) - (b.series.order || 0))
              : items;
            list.append(...ordered.map(renderRecord));
            section.append(head, list);
            return section;
          };

          const orderedSeries = [...series.entries()].sort(([slugA, a], [slugB, b]) => {
            if (sortMode === 'oldest') return Math.min(...a.map(recordDate)) - Math.min(...b.map(recordDate));
            if (sortMode === 'title') return a[0].series.title.localeCompare(b[0].series.title);
            if (sortMode === 'series') return slugA.localeCompare(slugB);
            return Math.max(...b.map(recordDate)) - Math.max(...a.map(recordDate));
          });
          const seriesSections = orderedSeries
            .map(([slug, items], index) => renderGroup(items[0].series.title, items, slug, true, index + 1));
          if (independent.length) {
            const orderedIndependent = independent.slice().sort((a, b) => {
              if (sortMode === 'oldest') return recordDate(a) - recordDate(b);
              if (sortMode === 'title') return a.title.localeCompare(b.title);
              return byRecency(a, b);
            });
            seriesSections.push(renderGroup('Independent records', orderedIndependent, 'independent', false));
          }
          if (seriesDirectoryList) {
            const directoryItems = orderedSeries.map(([slug, items], index) => {
              const item = node('li');
              const link = node('a');
              link.href = `#series-${slug}`;
              const copy = node('span', 'index-series-copy');
              copy.append(node('b', '', items[0].series.title));
              link.append(node('span', 'index-series-num', String(index + 1).padStart(2, '0')), copy);
              item.append(link);
              return item;
            });
            if (independent.length) {
              const item = node('li');
              const link = node('a');
              link.href = '#series-independent';
              const copy = node('span', 'index-series-copy');
              copy.append(node('b', '', 'Standalone records'));
              link.append(node('span', 'index-series-num', '—'), copy);
              item.append(link);
              directoryItems.push(item);
            }
            seriesDirectoryList.replaceChildren(...directoryItems);
            updateSeriesSelection();
          }
          container.removeAttribute('role');
          container.replaceChildren(...seriesSections);
        } else {
          container.replaceChildren(...visible.map(renderRecord));
          seriesDirectoryList.replaceChildren(...visible.map((record, index) => {
            const item = node('li');
            const link = node('a');
            link.href = `#record-${record.id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
            const copy = node('span', 'index-series-copy');
            copy.append(node('b', '', record.title));
            link.append(node('span', 'index-series-num', String(index + 1).padStart(2, '0')), copy);
            item.append(link);
            return item;
          }));
          updateSeriesSelection();
        }
        seriesDirectoryList.closest('.meta-block').hidden = visible.length === 0;
        empty.hidden = visible.length !== 0;
        output.textContent = `${String(visible.length).padStart(2, '0')} records`;
        listCount.textContent = `${String(visible.length).padStart(2, '0')} RECORDS`;
      };

      const syncControls = () => {
        document.body.classList.toggle('index-view-compact', view === 'blog' && viewMode === 'compact');
        document.querySelectorAll('[data-sort]').forEach((button) => {
          const active = button.dataset.sort === sortMode;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        document.querySelectorAll('[data-view]').forEach((button) => {
          const active = button.dataset.view === viewMode;
          button.classList.toggle('active', active);
          button.setAttribute('aria-pressed', String(active));
        });
      };

      const persistControls = () => {
        const params = new URLSearchParams(location.search);
        params.set('sort', sortMode);
        params.set('view', viewMode);
        history.replaceState(null, '', `${location.pathname}?${params.toString()}${location.hash}`);
        try {
          localStorage.setItem('atlas-blog-sort', sortMode);
          localStorage.setItem('atlas-blog-view', viewMode);
        } catch (_) {}
      };

      document.querySelectorAll('[data-sort]').forEach((button) => button.addEventListener('click', () => {
        sortMode = button.dataset.sort;
        syncControls();
        persistControls();
        applyFilters();
      }));
      document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => {
        viewMode = button.dataset.view;
        syncControls();
        persistControls();
        applyFilters();
      }));
      searchForm.addEventListener('submit', (event) => event.preventDefault());

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
      syncControls();
      applyFilters();
    })
    .catch((error) => {
      document.body.dataset.error = error.message;
      // Retain the built catalogue if enhancement fails; its links still work.
      if (!document.querySelector('[data-records] a[href]')) {
        document.body.textContent = 'Content index unavailable.';
      }
    });
})();
