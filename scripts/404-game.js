(() => {
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const panel = document.getElementById('panel');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W = 0, H = 0, dpr = 1;
    // playfield in CSS pixels
    let field = { x: 0, y: 0, w: 0, h: 0 };

    const COLS = 13, ROWS = 6;
    let bricks = [];
    let brickW = 48, brickH = 22, gap = 8;
    let bricksLeft = 0;

    let paddle = { x: 0, y: 0, w: 88, h: 12 };
    let ball = { x: 0, y: 0, r: 5, vx: 0, vy: 0, stuck: true };
    let score = 0, lives = 3;
    let state = 'ready'; // ready | play | win | dead | gameover
    let keys = { left: false, right: false };
    let particles = [];

    function resize() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const marginX = Math.max(28, W * 0.08);
      const marginTop = 52;
      const marginBot = 36;
      field = {
        x: marginX,
        y: marginTop,
        w: W - marginX * 2,
        h: H - marginTop - marginBot
      };

      brickW = Math.min(56, (field.w - gap * (COLS + 1)) / COLS);
      brickH = Math.max(16, Math.min(24, field.h * 0.035));
      paddle.w = Math.max(70, Math.min(100, field.w * 0.12));
      paddle.y = field.y + field.h - 36;
      if (state === 'ready' || ball.stuck) {
        paddle.x = field.x + field.w / 2 - paddle.w / 2;
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 2;
      }
    }

    function panelRect() {
      const r = panel.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }

    function hitsPanel(bx, by, br) {
      const p = panelRect();
      const pad = 2;
      return bx + br > p.x - pad && bx - br < p.x + p.w + pad &&
             by + br > p.y - pad && by - br < p.y + p.h + pad;
    }

    function buildBricks() {
      bricks = [];
      bricksLeft = 0;
      const totalW = COLS * brickW + (COLS - 1) * gap;
      const startX = field.x + (field.w - totalW) / 2;
      const startY = field.y + 28;
      const pr = panelRect();

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const x = startX + col * (brickW + gap);
          const y = startY + row * (brickH + gap);
          // skip bricks under / overlapping panel (center gap)
          const cx = x + brickW / 2, cy = y + brickH / 2;
          const pad = 12;
          if (cx > pr.left - pad && cx < pr.right + pad &&
              cy > pr.top - pad && cy < pr.bottom + pad) {
            continue;
          }
          // also leave a wider horizontal band around panel center rows-ish
          if (Math.abs(cx - (pr.left + pr.width/2)) < pr.width * 0.55 &&
              cy > pr.top - brickH && cy < pr.bottom + brickH * 0.5) {
            continue;
          }
          bricks.push({ x, y, w: brickW, h: brickH, alive: true });
          bricksLeft++;
        }
      }
      updateHud();
    }

    function resetBall(stuck) {
      ball.stuck = stuck !== false;
      ball.x = paddle.x + paddle.w / 2;
      ball.y = paddle.y - ball.r - 2;
      const angle = -Math.PI / 2 + (Math.random() * 0.6 - 0.3);
      const speed = 6.4;
      ball.vx = Math.cos(angle) * speed;
      ball.vy = Math.sin(angle) * speed;
      if (ball.vy > 0) ball.vy = -Math.abs(ball.vy);
    }

    function fullReset() {
      score = 0; lives = 3; state = 'ready'; particles = [];
      paddle.x = field.x + field.w / 2 - paddle.w / 2;
      buildBricks();
      resetBall(true);
      updateHud();
    }

    function updateHud() {
      document.getElementById('score').textContent = String(score).padStart(4, '0');
      document.getElementById('bricksLeft').textContent = String(bricksLeft).padStart(3, '0');
      document.getElementById('livesNum').textContent = String(lives);
      const el = document.getElementById('lives');
      if (el) {
        el.innerHTML = [0,1,2].map(i =>
          i < lives ? '<span>♥</span>' : '<span class="gone">♥</span>'
        ).join(' ');
      }
    }

    function launch() {
      if (state === 'ready' || ball.stuck) {
        ball.stuck = false;
        state = 'play';
        if (ball.vy >= 0) ball.vy = -Math.abs(ball.vy || 6.4);
      }
      if (state === 'gameover' || state === 'win') fullReset();
    }

    function burst(x, y) {
      for (let i = 0; i < 6; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 2.5,
          vy: (Math.random() - 0.5) * 2.5,
          life: 18 + Math.random() * 12
        });
      }
    }

    function update() {
      if (reduced) return;

      const speed = 5.2;
      if (keys.left) paddle.x -= speed;
      if (keys.right) paddle.x += speed;
      paddle.x = Math.max(field.x + 8, Math.min(field.x + field.w - paddle.w - 8, paddle.x));

      if (ball.stuck) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - ball.r - 2;
        return;
      }
      if (state !== 'play') return;

      ball.x += ball.vx;
      ball.y += ball.vy;

      // walls
      if (ball.x - ball.r < field.x + 4) { ball.x = field.x + 4 + ball.r; ball.vx *= -1; }
      if (ball.x + ball.r > field.x + field.w - 4) { ball.x = field.x + field.w - 4 - ball.r; ball.vx *= -1; }
      if (ball.y - ball.r < field.y + 4) { ball.y = field.y + 4 + ball.r; ball.vy *= -1; }

      // panel as solid obstacle
      if (hitsPanel(ball.x, ball.y, ball.r)) {
        const p = panelRect();
        const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
        // push out by dominant axis
        const dx = ball.x - cx, dy = ball.y - cy;
        if (Math.abs(dx) / p.w > Math.abs(dy) / p.h) {
          ball.vx *= -1;
          ball.x += Math.sign(dx) * 3;
        } else {
          ball.vy *= -1;
          ball.y += Math.sign(dy) * 3;
        }
      }

      // paddle
      if (ball.vy > 0 &&
          ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h + 6 &&
          ball.x >= paddle.x - 2 && ball.x <= paddle.x + paddle.w + 2) {
        ball.y = paddle.y - ball.r;
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        const angle = -Math.PI / 2 + hit * 1.05;
        const spd = Math.min(11, Math.hypot(ball.vx, ball.vy) * 1.02 + 0.1);
        ball.vx = Math.cos(angle) * spd;
        ball.vy = Math.sin(angle) * spd;
      }

      // bottom — lose life
      if (ball.y - ball.r > field.y + field.h) {
        lives--;
        updateHud();
        if (lives <= 0) {
          state = 'gameover';
          ball.stuck = true;
        } else {
          state = 'ready';
          ball.stuck = true;
          resetBall(true);
        }
      }

      // bricks
      for (const b of bricks) {
        if (!b.alive) continue;
        if (ball.x + ball.r < b.x || ball.x - ball.r > b.x + b.w ||
            ball.y + ball.r < b.y || ball.y - ball.r > b.y + b.h) continue;

        b.alive = false;
        bricksLeft--;
        score += 10;
        updateHud();
        burst(b.x + b.w / 2, b.y + b.h / 2);

        // bounce by side
        const prevX = ball.x - ball.vx, prevY = ball.y - ball.vy;
        const fromLeft = prevX + ball.r <= b.x;
        const fromRight = prevX - ball.r >= b.x + b.w;
        const fromTop = prevY + ball.r <= b.y;
        const fromBot = prevY - ball.r >= b.y + b.h;
        if (fromLeft || fromRight) ball.vx *= -1;
        else ball.vy *= -1;

        if (bricksLeft <= 0) state = 'win';
        break;
      }

      // particles
      particles = particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
        return p.life > 0;
      });
    }

    function draw() {
      ctx.fillStyle = '#f3ebe3';
      ctx.fillRect(0, 0, W, H);

      // dots
      const step = 12;
      ctx.fillStyle = 'rgba(42,42,42,0.11)';
      for (let gy = step / 2; gy < H; gy += step) {
        for (let gx = step / 2; gx < W; gx += step) {
          ctx.beginPath();
          ctx.arc(gx, gy, 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // field frame — double line like reference
      ctx.strokeStyle = 'rgba(42,42,42,0.4)';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(field.x + 0.5, field.y + 0.5, field.w - 1, field.h - 1);
      ctx.strokeStyle = 'rgba(42,42,42,0.2)';
      ctx.strokeRect(field.x + 4.5, field.y + 4.5, field.w - 9, field.h - 9);

      // bottom scale ticks
      ctx.strokeStyle = 'rgba(42,42,42,0.25)';
      ctx.lineWidth = 1;
      const baseY = field.y + field.h - 10;
      ctx.beginPath();
      ctx.moveTo(field.x + 16, baseY);
      ctx.lineTo(field.x + field.w - 16, baseY);
      ctx.stroke();
      for (let i = 0; i <= 20; i++) {
        const tx = field.x + 16 + (field.w - 32) * (i / 20);
        const th = i % 5 === 0 ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(tx, baseY - th);
        ctx.lineTo(tx, baseY + 1);
        ctx.stroke();
      }
      // corner circles
      ctx.beginPath();
      ctx.arc(field.x + 14, baseY, 2.5, 0, Math.PI * 2);
      ctx.arc(field.x + field.w - 14, baseY, 2.5, 0, Math.PI * 2);
      ctx.stroke();

      // bricks — outline only
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = 'rgba(42,42,42,0.55)';
      for (const b of bricks) {
        if (!b.alive) continue;
        ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
        // center pen dot
        ctx.fillStyle = 'rgba(42,42,42,0.35)';
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // particles (broken brick crumbs)
      ctx.strokeStyle = 'rgba(42,42,42,0.4)';
      ctx.lineWidth = 1;
      for (const p of particles) {
        ctx.beginPath();
        ctx.moveTo(p.x - 2, p.y);
        ctx.lineTo(p.x + 2, p.y + 1);
        ctx.stroke();
      }

      // paddle — rounded capsule outline + hatch
      const px = paddle.x, py = paddle.y, pw = paddle.w, ph = paddle.h;
      ctx.strokeStyle = 'rgba(42,42,42,0.65)';
      ctx.lineWidth = 1.3;
      roundRect(ctx, px, py, pw, ph, ph / 2);
      ctx.stroke();
      // hatch lines
      ctx.beginPath();
      for (let i = 6; i < pw - 4; i += 5) {
        ctx.moveTo(px + i, py + 3);
        ctx.lineTo(px + i - 2, py + ph - 3);
      }
      ctx.strokeStyle = 'rgba(42,42,42,0.25)';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // ball
      ctx.strokeStyle = 'rgba(42,42,42,0.7)';
      ctx.fillStyle = 'rgba(243,235,227,0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // motion ticks when moving
      if (!ball.stuck && state === 'play') {
        ctx.strokeStyle = 'rgba(42,42,42,0.25)';
        ctx.beginPath();
        ctx.moveTo(ball.x - ball.vx * 2, ball.y - ball.vy * 2);
        ctx.lineTo(ball.x - ball.vx * 4, ball.y - ball.vy * 4);
        ctx.stroke();
      }

      if (state === 'win' || state === 'gameover') {
        ctx.fillStyle = 'rgba(243,235,227,0.45)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = state === 'win' ? '#2a5a2a' : '#8b3a3a';
        ctx.font = '500 14px ' + getComputedStyle(document.body).fontFamily;
        ctx.textAlign = 'center';
        ctx.fillText(
          state === 'win' ? 'BLOCKS CLEARED' : 'GAME OVER — press R or button',
          W / 2, field.y + 22
        );
      }
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function frame() {
      update();
      draw();
      requestAnimationFrame(frame);
    }

    addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') { e.preventDefault(); keys.left = true; }
      if (k === 'arrowright' || k === 'd') { e.preventDefault(); keys.right = true; }
      if (k === ' ' || k === 'enter') { e.preventDefault(); launch(); }
      if (k === 'r') fullReset();
    });
    addEventListener('keyup', e => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') keys.left = false;
      if (k === 'arrowright' || k === 'd') keys.right = false;
    });

    // mouse / touch paddle
    addEventListener('pointermove', e => {
      paddle.x = e.clientX - paddle.w / 2;
      paddle.x = Math.max(field.x + 8, Math.min(field.x + field.w - paddle.w - 8, paddle.x));
    });
    addEventListener('pointerdown', e => {
      if (e.target.closest('.panel')) return;
      launch();
    });

    document.getElementById('btnPlay')?.addEventListener('click', () => {
      if (state === 'gameover' || state === 'win') fullReset();
      launch();
    });

    addEventListener('resize', () => {
      resize();
      buildBricks();
      if (ball.stuck) resetBall(true);
    });

    resize();
    fullReset();
    requestAnimationFrame(frame);
  })();
