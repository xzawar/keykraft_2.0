/**
 * Antigravity Particle Effect — Vanilla Three.js port
 * Matches the React Bits component behaviour without a build step.
 * Usage: new Antigravity(containerEl, options)
 */
(function (global) {
  'use strict';

  function Antigravity(container, opts) {
    if (!container) return;

    opts = Object.assign({
      count: 300,
      magnetRadius: 6,
      ringRadius: 7,
      waveSpeed: 0.4,
      waveAmplitude: 1,
      particleSize: 1.5,
      lerpSpeed: 0.05,
      color: '#c8ff00',
      autoAnimate: true,
      particleVariance: 1,
      rotationSpeed: 0,
      depthFactor: 1,
      pulseSpeed: 3,
      fieldStrength: 10
    }, opts);

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1000);
    camera.position.z = 50;

    // ── Resize ────────────────────────────────────────────────
    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ── Viewport helpers ──────────────────────────────────────
    function vpWidth() {
      const h = container.clientHeight;
      const fovRad = (camera.fov * Math.PI) / 180;
      return 2 * Math.tan(fovRad / 2) * camera.position.z * camera.aspect;
    }
    function vpHeight() {
      const fovRad = (camera.fov * Math.PI) / 180;
      return 2 * Math.tan(fovRad / 2) * camera.position.z;
    }

    // ── Mouse tracking ────────────────────────────────────────
    const mouse = { nx: 0, ny: 0 }; // normalised -1..1
    const lastMove = { time: 0, x: 0, y: 0 };
    const virtualMouse = { x: 0, y: 0 };

    container.addEventListener('mousemove', e => {
      const rect = container.getBoundingClientRect();
      mouse.nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const dx = mouse.nx - lastMove.x;
      const dy = mouse.ny - lastMove.y;
      if (Math.sqrt(dx * dx + dy * dy) > 0.001) {
        lastMove.time = Date.now();
        lastMove.x = mouse.nx;
        lastMove.y = mouse.ny;
      }
    });

    // Touch support
    container.addEventListener('touchmove', e => {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      mouse.nx = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.ny = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
      lastMove.time = Date.now();
    }, { passive: false });

    // ── Geometry & Material ───────────────────────────────────
    // CapsuleGeometry added in r142 — use CylinderGeometry as equivalent for r128
    const geo = new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8);
    const mat = new THREE.MeshBasicMaterial({ color: opts.color });
    const mesh = new THREE.InstancedMesh(geo, mat, opts.count);
    scene.add(mesh);

    const dummy = new THREE.Object3D();

    // ── Particles ─────────────────────────────────────────────
    const particles = [];
    for (let i = 0; i < opts.count; i++) {
      const w = vpWidth();
      const h = vpHeight();
      const x = (Math.random() - 0.5) * w;
      const y = (Math.random() - 0.5) * h;
      const z = (Math.random() - 0.5) * 20;
      particles.push({
        t: Math.random() * 100,
        speed: 0.01 + Math.random() / 200,
        mx: x, my: y, mz: z,
        cx: x, cy: y, cz: z,
        randomRadiusOffset: (Math.random() - 0.5) * 2
      });
    }

    // ── Animation loop ────────────────────────────────────────
    const clock = new THREE.Clock();
    let rafId;

    function animate() {
      rafId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      const w = vpWidth();
      const h = vpHeight();

      let destX = (mouse.nx * w) / 2;
      let destY = (mouse.ny * h) / 2;

      if (opts.autoAnimate && Date.now() - lastMove.time > 2000) {
        destX = Math.sin(elapsed * 0.5) * (w / 4);
        destY = Math.cos(elapsed) * (h / 4);
      }

      virtualMouse.x += (destX - virtualMouse.x) * 0.05;
      virtualMouse.y += (destY - virtualMouse.y) * 0.05;

      const targetX = virtualMouse.x;
      const targetY = virtualMouse.y;
      const globalRotation = elapsed * opts.rotationSpeed;

      for (let i = 0; i < opts.count; i++) {
        const p = particles[i];
        p.t += p.speed / 2;

        const projFactor = 1 - p.cz / 50;
        const ptx = targetX * projFactor;
        const pty = targetY * projFactor;

        const dx = p.mx - ptx;
        const dy = p.my - pty;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let tx = p.mx, ty = p.my, tz = p.mz * opts.depthFactor;

        if (dist < opts.magnetRadius) {
          const angle = Math.atan2(dy, dx) + globalRotation;
          const wave = Math.sin(p.t * opts.waveSpeed + angle) * (0.5 * opts.waveAmplitude);
          const dev = p.randomRadiusOffset * (5 / (opts.fieldStrength + 0.1));
          const r = opts.ringRadius + wave + dev;
          tx = ptx + r * Math.cos(angle);
          ty = pty + r * Math.sin(angle);
          tz = p.mz * opts.depthFactor + Math.sin(p.t) * opts.waveAmplitude * opts.depthFactor;
        }

        p.cx += (tx - p.cx) * opts.lerpSpeed;
        p.cy += (ty - p.cy) * opts.lerpSpeed;
        p.cz += (tz - p.cz) * opts.lerpSpeed;

        dummy.position.set(p.cx, p.cy, p.cz);
        dummy.lookAt(ptx, pty, p.cz);
        dummy.rotateX(Math.PI / 2);

        const curDist = Math.sqrt(Math.pow(p.cx - ptx, 2) + Math.pow(p.cy - pty, 2));
        const distFromRing = Math.abs(curDist - opts.ringRadius);
        let scale = Math.max(0, Math.min(1, 1 - distFromRing / 10));
        scale *= (0.8 + Math.sin(p.t * opts.pulseSpeed) * 0.2 * opts.particleVariance) * opts.particleSize;

        dummy.scale.setScalar(scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
      renderer.render(scene, camera);
    }

    animate();

    // ── Public destroy ────────────────────────────────────────
    this.destroy = function () {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }

  global.Antigravity = Antigravity;
})(window);
