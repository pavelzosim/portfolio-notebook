(() => {
  const canvas = document.getElementById('wireCanvas');
  const shapeNameEl = document.getElementById('shapeName');
  const reshuffleBtn = document.getElementById('reshuffleBtn');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W / 2, cy = H / 2;
  const scale = 125;

  function normalize(v) {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1;
    return [v[0] / len, v[1] / len, v[2] / len];
  }

  function edgesFromFaces(faces) {
    const set = new Set();
    faces.forEach((f) => {
      for (let i = 0; i < f.length; i++) {
        const a = f[i], b = f[(i + 1) % f.length];
        set.add(a < b ? a + ',' + b : b + ',' + a);
      }
    });
    return [...set].map((k) => k.split(',').map(Number));
  }

  function icosahedron() {
    const t = (1 + Math.sqrt(5)) / 2;
    const verts = [
      [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
      [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
    ].map(normalize);
    const faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    return { name: 'ICO', verts, edges: edgesFromFaces(faces) };
  }

  function octahedron() {
    const verts = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ];
    const faces = [
      [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
      [0, 5, 2], [2, 5, 1], [1, 5, 3], [3, 5, 0],
    ];
    return { name: 'OCTA', verts, edges: edgesFromFaces(faces) };
  }

  function cube() {
    const verts = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
    ].map((v) => normalize(v.map((c) => c * 0.85)));
    const faces = [
      [0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [0, 3, 7, 4], [1, 2, 6, 5],
    ];
    return { name: 'CUBE', verts, edges: edgesFromFaces(faces) };
  }

  function tetrahedron() {
    const verts = [
      [1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1],
    ].map(normalize);
    const faces = [
      [0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3],
    ];
    return { name: 'TETRA', verts, edges: edgesFromFaces(faces) };
  }

  function dodecahedron() {
    const phi = (1 + Math.sqrt(5)) / 2;
    const inv = 1 / phi;
    let verts = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) verts.push([x, y, z]);
    for (const i of [-1, 1]) for (const j of [-1, 1]) {
      verts.push([0, i * inv, j * phi]);
      verts.push([i * inv, j * phi, 0]);
      verts.push([i * phi, 0, j * inv]);
    }
    verts = verts.map(normalize);
    const edges = [];
    const used = new Set();
    for (let i = 0; i < verts.length; i++) {
      for (let j = i + 1; j < verts.length; j++) {
        const dx = verts[i][0] - verts[j][0];
        const dy = verts[i][1] - verts[j][1];
        const dz = verts[i][2] - verts[j][2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d > 0.65 && d < 0.85) {
          const key = i + ',' + j;
          if (!used.has(key)) {
            used.add(key);
            edges.push([i, j]);
          }
        }
      }
    }
    return { name: 'DODECA', verts, edges };
  }

  function torus(R = 0.65, r = 0.32, segR = 16, segr = 10) {
    const verts = [];
    for (let i = 0; i < segR; i++) {
      const theta = (i / segR) * Math.PI * 2;
      for (let j = 0; j < segr; j++) {
        const phi = (j / segr) * Math.PI * 2;
        const x = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y = (R + r * Math.cos(phi)) * Math.sin(theta);
        const z = r * Math.sin(phi);
        verts.push([x, y, z]);
      }
    }
    const edges = [];
    for (let i = 0; i < segR; i++) {
      for (let j = 0; j < segr; j++) {
        const a = i * segr + j;
        const b = i * segr + (j + 1) % segr;
        const c = ((i + 1) % segR) * segr + j;
        edges.push([a, b], [a, c]);
      }
    }
    return { name: 'TORUS', verts, edges };
  }

  function stella() {
    const base = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1],
    ];
    const spike = 1.7;
    const verts = base.map((v) => normalize(v));
    const extras = [
      [1, 1, 0], [1, -1, 0], [-1, 1, 0], [-1, -1, 0],
      [1, 0, 1], [1, 0, -1], [-1, 0, 1], [-1, 0, -1],
      [0, 1, 1], [0, 1, -1], [0, -1, 1], [0, -1, -1],
    ].map((v) => normalize(v.map((c) => c * spike * 0.7)));
    verts.push(...extras);
    const edges = [];
    for (let i = 0; i < 6; i++) {
      for (let j = i + 1; j < 6; j++) {
        if (Math.abs(base[i][0] * base[j][0] + base[i][1] * base[j][1] + base[i][2] * base[j][2]) < 0.1) {
          edges.push([i, j]);
        }
      }
    }
    for (let i = 6; i < verts.length; i++) {
      for (let j = 0; j < 6; j++) {
        const d = Math.sqrt(
          (verts[i][0] - verts[j][0]) ** 2 +
          (verts[i][1] - verts[j][1]) ** 2 +
          (verts[i][2] - verts[j][2]) ** 2
        );
        if (d < 1.15) edges.push([i, j]);
      }
    }
    return { name: 'STELLA', verts, edges };
  }

  function pyramid() {
    const verts = [
      [0, 1.1, 0],
      [-1, -0.6, -1], [1, -0.6, -1], [1, -0.6, 1], [-1, -0.6, 1],
    ].map(normalize);
    const faces = [
      [0, 1, 2], [0, 2, 3], [0, 3, 4], [0, 4, 1],
      [1, 2, 3, 4],
    ];
    return { name: 'PYRAMID', verts, edges: edgesFromFaces(faces) };
  }

  // Revolve a radius/height profile, sharing a single vertex at each pole.
  function revolved(name, profile, segments = 12) {
    const verts = [], edges = [], rings = [];
    profile.forEach(([radius, height]) => {
      const ring = [];
      const count = radius === 0 ? 1 : segments;
      for (let i = 0; i < count; i++) {
        const angle = i * Math.PI * 2 / segments;
        ring.push(verts.length);
        verts.push([radius * Math.cos(angle), height, radius * Math.sin(angle)]);
      }
      if (count > 1) ring.forEach((v, i) => edges.push([v, ring[(i + 1) % count]]));
      rings.push(ring);
    });
    for (let r = 1; r < rings.length; r++) {
      const a = rings[r - 1], b = rings[r];
      for (let i = 0; i < Math.max(a.length, b.length); i++) edges.push([a[i % a.length], b[i % b.length]]);
    }
    const radius = Math.max(...verts.map((v) => Math.hypot(...v)));
    return { name, verts: verts.map((v) => v.map((n) => n / radius)), edges };
  }

  function sphere() {
    const profile = [[0, -1]];
    for (let i = 1; i < 8; i++) {
      const angle = i * Math.PI / 8;
      profile.push([Math.sin(angle), -Math.cos(angle)]);
    }
    profile.push([0, 1]);
    return revolved('SPHERE', profile);
  }

  const SHAPES = [
    icosahedron, octahedron, cube, tetrahedron, dodecahedron, torus, stella, pyramid,
    sphere,
    () => revolved('CYLINDER', [[0.7, -0.8], [0.7, 0.8]]),
    () => revolved('CONE', [[0.8, -0.6], [0, 1]]),
    () => revolved('FRUSTUM', [[0.85, -0.65], [0.4, 0.65]]),
    () => revolved('TRI PRISM', [[0.8, -0.7], [0.8, 0.7]], 3),
    () => revolved('HEX PRISM', [[0.8, -0.7], [0.8, 0.7]], 6),
    () => revolved('BIPYRAMID', [[0, -1], [0.75, 0], [0, 1]], 6),
  ];

  let current = null;
  let currentIndex = -1;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let rotX = 0.35, rotY = 0.4;
  let targetRotX = rotX, targetRotY = rotY;
  let mouseActive = false;

  function pickShape() {
    // Every activation changes the shape, even when random picks repeat.
    const offset = 1 + Math.floor(Math.random() * (SHAPES.length - 1));
    currentIndex = currentIndex < 0 ? Math.floor(Math.random() * SHAPES.length) : (currentIndex + offset) % SHAPES.length;
    const fn = SHAPES[currentIndex];
    current = fn();
    if (shapeNameEl) shapeNameEl.textContent = current.name;
    rotX = 0.2 + Math.random() * 0.5;
    rotY = Math.random() * Math.PI * 2;
    targetRotX = rotX;
    targetRotY = rotY;
  }

  pickShape();

  if (reshuffleBtn) {
    reshuffleBtn.addEventListener('click', () => pickShape());
  }

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width - 0.5;
    const my = (e.clientY - r.top) / r.height - 0.5;
    targetRotY = mx * 2.0;
    targetRotX = 0.35 + my * 1.4;
    mouseActive = true;
  });
  canvas.addEventListener('mouseleave', () => { mouseActive = false; });

  function rotate(v, ax, ay) {
    const [x, y, z] = v;
    const x1 = x * Math.cos(ay) - z * Math.sin(ay);
    const z1 = x * Math.sin(ay) + z * Math.cos(ay);
    const y1 = y * Math.cos(ax) - z1 * Math.sin(ax);
    const z2 = y * Math.sin(ax) + z1 * Math.cos(ax);
    return [x1, y1, z2];
  }

  function project(v) {
    const z = v[2] + 2.6;
    const f = 2.1 / z;
    return [cx + v[0] * scale * f, cy + v[1] * scale * f, z];
  }

  function draw() {
    if (!mouseActive && !reducedMotion.matches) targetRotY += 0.007;
    rotX += (targetRotX - rotX) * 0.09;
    rotY += (targetRotY - rotY) * 0.09;

    ctx.clearRect(0, 0, W, H);

    ctx.beginPath();
    ctx.arc(cx, cy, 175, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx, cy, 175, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(26,26,26,0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (!current) {
      requestAnimationFrame(draw);
      return;
    }

    const projected = current.verts.map((v) => project(rotate(v, rotX, rotY)));

    current.edges.forEach(([a, b]) => {
      const pa = projected[a], pb = projected[b];
      if (!pa || !pb) return;
      const avgZ = (pa[2] + pb[2]) / 2;
      const alpha = 0.25 + (2.8 - avgZ) * 0.22;
      ctx.beginPath();
      ctx.moveTo(pa[0], pa[1]);
      ctx.lineTo(pb[0], pb[1]);
      ctx.strokeStyle = `rgba(26,26,26,${Math.min(0.7, Math.max(0.18, alpha))})`;
      ctx.lineWidth = 1.45;
      ctx.stroke();
    });

    projected.forEach((p) => {
      const alpha = 0.35 + (2.8 - p[2]) * 0.25;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.6, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(26,26,26,${Math.min(0.9, alpha)})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  draw();
})();
