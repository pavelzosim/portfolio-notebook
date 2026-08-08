(() => {
  const slug = document.body.dataset.project;
  const text = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };
  const list = (selector, values) => {
    const node = document.querySelector(selector);
    if (!node) return;
    node.replaceChildren(...values.map((value) => {
      const item = document.createElement('li');
      item.textContent = value;
      return item;
    }));
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
