(() => {
  const routes = { F10: '/projects/', F3: '#overview', F4: '#role', F5: '#media', F6: '#outcome', F8: '/#contacts' };
  document.addEventListener('keydown', (event) => {
    if (routes[event.key]) {
      event.preventDefault();
      location.assign(routes[event.key]);
    }
  });
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
  const configureVideo = (video, record) => {
    if (!video || !record?.src) return false;
    video.src = record.src;
    video.muted = true;
    video.defaultMuted = true;
    if (record.poster) video.poster = record.poster;
    return true;
  };
  const activateProjectRail = () => {
    const links = [...document.querySelectorAll('.project-outline a[href^="#"]')];
    const records = links
      .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
      .filter(({ section }) => section);
    if (!records.length) return;
    const update = () => {
      const marker = window.scrollY + 150;
      let current = records[0];
      records.forEach((record) => {
        if (record.section.offsetTop <= marker) current = record;
      });
      records.forEach(({ link }) => {
        const active = link === current.link;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  };

  Promise.all([
    fetch('/content/templates/project-page.html', { cache: 'no-store' }),
    fetch('/content/projects/index.json', { cache: 'no-store' })
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
      text('[data-meta-type]', project.metaType || project.type);
      text('[data-meta-client]', project.client || 'Independent');
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
      const metaStack = document.querySelector('[data-meta-stack]');
      const stackValues = project.stack && typeof project.stack === 'object' ? Object.entries(project.stack) : [];
      metaStack.replaceChildren(...stackValues.flatMap(([labelText, valueText]) => {
        const label = document.createElement('dt');
        const value = document.createElement('dd');
        label.textContent = labelText;
        value.textContent = valueText;
        return [label, value];
      }));
      const hasTechnical = hasSolutions || toolValues.length > 0;
      optional('role', hasRole);
      optional('technical', hasTechnical);

      const videoRecord = document.querySelector('[data-video-record]');
      const heroVideoRecord = document.querySelector('[data-hero-video-record]');
      const featuredVideo = Boolean(project.video?.featured);
      if (project.video?.src && featuredVideo) {
        configureVideo(document.querySelector('[data-hero-project-video]'), project.video);
        text('[data-hero-video-caption]', project.video.caption || 'Selected production footage.');
        heroVideoRecord.hidden = false;
        videoRecord.hidden = true;
        document.querySelector('[data-project-cover]').hidden = true;
      } else if (project.video?.src) {
        configureVideo(document.querySelector('[data-project-video]'), project.video);
        text('[data-video-caption]', project.video.caption || 'Selected production footage.');
        videoRecord.hidden = false;
        heroVideoRecord.hidden = true;
      } else {
        videoRecord.hidden = true;
        heroVideoRecord.hidden = true;
      }

      const carousel = document.querySelector('[data-project-carousel]');
      const mediaTrack = document.querySelector('[data-media-track]');
      const mediaValues = Array.isArray(project.media) ? project.media : [];
      mediaTrack.replaceChildren(...mediaValues.map((record, mediaIndex) => {
        const figure = document.createElement('figure');
        const image = document.createElement('img');
        figure.dataset.label = record.caption || `Production record ${mediaIndex + 1}`;
        image.src = record.src;
        image.alt = record.alt || `${project.title} media record`;
        image.loading = mediaIndex < 2 ? 'eager' : 'lazy';
        image.width = 1200;
        image.height = 675;
        figure.append(image);
        return figure;
      }));
      carousel.hidden = mediaValues.length === 0;
      if (mediaValues.length) {
        const caption = carousel.querySelector('[data-carousel-caption]');
        const count = carousel.querySelector('[data-carousel-count]');
        const previousButton = carousel.querySelector('[data-carousel-prev]');
        const nextButton = carousel.querySelector('[data-carousel-next]');
        let mediaIndex = 0;
        const showMedia = (nextIndex) => {
          mediaIndex = (nextIndex + mediaValues.length) % mediaValues.length;
          mediaTrack.style.transform = `translateX(${-mediaIndex * 100}%)`;
          caption.textContent = mediaValues[mediaIndex].caption || `Production record ${mediaIndex + 1}`;
          count.textContent = `${String(mediaIndex + 1).padStart(2, '0')} / ${String(mediaValues.length).padStart(2, '0')} · object-fit contain · arrow keys`;
        };
        previousButton.disabled = mediaValues.length < 2;
        nextButton.disabled = mediaValues.length < 2;
        previousButton.addEventListener('click', () => showMedia(mediaIndex - 1));
        nextButton.addEventListener('click', () => showMedia(mediaIndex + 1));
        carousel.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowLeft') { event.preventDefault(); showMedia(mediaIndex - 1); }
          if (event.key === 'ArrowRight') { event.preventDefault(); showMedia(mediaIndex + 1); }
        });
        showMedia(0);
      }
      const hasMedia = Boolean(project.video?.src || mediaValues.length);
      optional('media', hasMedia);
      const outcomeIndex = 4 + [hasRole, hasTechnical, hasMedia].filter(Boolean).length;
      text('[data-outcome-nav]', String(outcomeIndex).padStart(2, '0'));
      text('[data-outcome-number]', `§ ${String(outcomeIndex).padStart(2, '0')}`);

      const image = document.querySelector('[data-project-image]');
      image.src = project.image;
      image.alt = `${project.title} project record`;

      const metrics = document.querySelector('[data-project-metrics]');
      const metricValues = Array.isArray(project.metrics) ? project.metrics : [];
      metrics.replaceChildren(...metricValues.map((record) => {
        const item = document.createElement('div');
        const value = document.createElement('strong');
        const label = document.createElement('span');
        value.textContent = record.value;
        label.textContent = record.label;
        item.append(value, label);
        return item;
      }));
      metrics.hidden = metricValues.length === 0;
      const metaReach = document.querySelector('[data-meta-reach]');
      const reachValues = project.reach && typeof project.reach === 'object' ? Object.entries(project.reach) : [];
      metaReach.replaceChildren(...reachValues.flatMap(([labelText, valueText]) => {
        const label = document.createElement('dt');
        const value = document.createElement('dd');
        label.textContent = labelText;
        value.textContent = valueText;
        return [label, value];
      }));
      text('[data-project-footer]', `project · ${project.slug}`);

      const previous = projects[(index - 1 + projects.length) % projects.length];
      const next = projects[(index + 1) % projects.length];
      const previousLink = document.querySelector('[data-project-previous]');
      const nextLink = document.querySelector('[data-project-next]');
      previousLink.href = `/projects/${previous.slug}/`;
      previousLink.textContent = `← ${previous.id} / ${previous.title}`;
      nextLink.href = `/projects/${next.slug}/`;
      nextLink.textContent = `${next.id} / ${next.title} →`;
      activateProjectRail();
    })
    .catch((error) => {
      document.querySelector('main')?.setAttribute('data-error', error.message);
      text('[data-field="title"]', 'Project record unavailable');
      text('[data-field="summary"]', 'The local project index could not be loaded.');
    });
})();
