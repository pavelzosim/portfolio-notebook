(() => {
  const slug = document.body.dataset.project;
  const text = (selector, value) => {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = value;
    });
  };
  const list = (selector, values) => {
    const node = document.querySelector(selector);
    if (!node) return false;
    const items = Array.isArray(values) ? values : [];
    node.hidden = items.length === 0;
    node.replaceChildren(...items.map((value) => {
      const item = document.createElement('li');
      item.textContent = value;
      return item;
    }));
    return items.length > 0;
  };
  const optional = (key, visible) => {
    document.querySelector(`[data-optional="${key}"]`)?.toggleAttribute('hidden', !visible);
    document.querySelector(`[data-nav-for="${key}"]`)?.toggleAttribute('hidden', !visible);
  };

  Promise.all([
    fetch('/content/templates/project-page.html'),
    fetch('/content/projects/index.json')
  ])
    .then(async ([templateResponse, indexResponse]) => {
      if (!templateResponse.ok) throw new Error(`Project template: ${templateResponse.status}`);
      if (!indexResponse.ok) throw new Error(`Project index: ${indexResponse.status}`);
      const [template, data] = await Promise.all([templateResponse.text(), indexResponse.json()]);
      document.body.insertAdjacentHTML('afterbegin', template);
      return data;
    })
    .then(({ projects }) => {
      const index = projects.findIndex((project) => project.slug === slug);
      const project = projects[index];
      if (!project) throw new Error(`Unknown project: ${slug}`);

      document.title = `${project.title} / Pavel Zosim`;
      text('[data-field="id"]', project.id);
      text('[data-field="title"]', project.title);
      text('[data-field="summary"]', project.summary);
      text('[data-field="type"]', project.type);
      text('[data-field="role"]', project.role);
      text('[data-field="environment"]', project.environment);
      text('[data-field="status"]', project.status);
      text('[data-field="overview"]', project.overview);
      text('[data-field="outcome"]', project.outcome);
      list('[data-list="scope"]', project.scope);
      list('[data-list="constraints"]', project.constraints);
      const hasRole = list('[data-list="roleDetails"]', project.roleDetails);
      const hasSolutions = list('[data-list="solutions"]', project.solutions);
      list('[data-list="results"]', project.results);

      const tools = document.querySelector('[data-tools]');
      const toolValues = Array.isArray(project.tools) ? project.tools : [];
      tools.replaceChildren(...toolValues.map((value) => {
        const item = document.createElement('code');
        item.textContent = value;
        return item;
      }));
      tools.hidden = toolValues.length === 0;
      const hasTechnical = hasSolutions || toolValues.length > 0;
      optional('role', hasRole);
      optional('technical', hasTechnical);

      const videoRecord = document.querySelector('[data-video-record]');
      const video = document.querySelector('[data-project-video]');
      if (project.video?.src) {
        video.src = project.video.src;
        if (project.video.poster) video.poster = project.video.poster;
        text('[data-video-caption]', project.video.caption || 'Selected production footage.');
        videoRecord.hidden = false;
      } else {
        videoRecord.hidden = true;
      }

      const mediaGrid = document.querySelector('[data-media-grid]');
      const mediaValues = Array.isArray(project.media) ? project.media : [];
      mediaGrid.replaceChildren(...mediaValues.map((record, mediaIndex) => {
        const figure = document.createElement('figure');
        const image = document.createElement('img');
        const caption = document.createElement('figcaption');
        const marker = document.createElement('span');
        image.src = record.src;
        image.alt = record.alt || `${project.title} media record`;
        image.loading = mediaIndex < 2 ? 'eager' : 'lazy';
        marker.textContent = `FIG ${String(mediaIndex + 1).padStart(2, '0')}`;
        caption.append(marker, document.createTextNode(record.caption || 'Production record'));
        figure.append(image, caption);
        return figure;
      }));
      mediaGrid.hidden = mediaValues.length === 0;
      const hasMedia = Boolean(project.video?.src || mediaValues.length);
      optional('media', hasMedia);
      const outcomeIndex = 4 + [hasRole, hasTechnical, hasMedia].filter(Boolean).length;
      text('[data-outcome-nav]', String(outcomeIndex).padStart(2, '0'));
      text('[data-outcome-number]', `§ ${String(outcomeIndex).padStart(2, '0')}`);

      const image = document.querySelector('[data-project-image]');
      image.src = project.image;
      image.alt = `${project.title} project record`;

      const source = document.querySelector('[data-source-link]');
      source.href = project.sourceUrl;

      const previous = projects[(index - 1 + projects.length) % projects.length];
      const next = projects[(index + 1) % projects.length];
      const previousLink = document.querySelector('[data-project-previous]');
      const nextLink = document.querySelector('[data-project-next]');
      previousLink.href = `/projects/${previous.slug}/`;
      previousLink.textContent = `← ${previous.id} / ${previous.title}`;
      nextLink.href = `/projects/${next.slug}/`;
      nextLink.textContent = `${next.id} / ${next.title} →`;
    })
    .catch((error) => {
      document.querySelector('main')?.setAttribute('data-error', error.message);
      text('[data-field="title"]', 'Project record unavailable');
      text('[data-field="summary"]', 'The local project index could not be loaded.');
    });
})();
