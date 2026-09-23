// Living background: dandelion seeds drifting up through a sunset meadow.
// Every seed gets random size, speed, delay and sway so the wind looks natural.
// Only transform and opacity are animated, so the browser can use the GPU.
(function () {
  "use strict";

  const field = document.getElementById("seeds");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!field || !("animate" in Element.prototype)) return;

  const SVG_NS = "http://www.w3.org/2000/svg";

  // A single dandelion seed: a stalk with a little umbrella of fluff on top.
  function makeSeedSvg(size) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "-20 -20 40 60");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size * 1.5);

    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("stroke", "currentColor");
    group.setAttribute("stroke-width", "0.9");
    group.setAttribute("stroke-linecap", "round");
    group.setAttribute("fill", "none");

    const rays = 11;
    for (let i = 0; i < rays; i++) {
      // Spread the fluff in a half-circle that opens upwards
      const angle = Math.PI + (i / (rays - 1)) * Math.PI;
      const length = 14 + Math.random() * 4;
      const line = document.createElementNS(SVG_NS, "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "0");
      line.setAttribute("x2", (Math.cos(angle) * length).toFixed(1));
      line.setAttribute("y2", (Math.sin(angle) * length).toFixed(1));
      group.appendChild(line);
    }

    const stalk = document.createElementNS(SVG_NS, "path");
    stalk.setAttribute("d", "M0 0 Q1.5 16 0 30");
    group.appendChild(stalk);

    const core = document.createElementNS(SVG_NS, "ellipse");
    core.setAttribute("class", "seed__core");
    core.setAttribute("cx", "0");
    core.setAttribute("cy", "32");
    core.setAttribute("rx", "1.8");
    core.setAttribute("ry", "3.2");
    core.setAttribute("stroke", "none");

    svg.append(group, core);
    return svg;
  }

  const random = (min, max) => min + Math.random() * (max - min);
  let running = [];

  function spawnSeed(firstRun) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const seed = document.createElement("span");
    seed.className = "seed";
    const inner = document.createElement("span");
    inner.className = "seed__inner";
    const size = random(18, 38);
    inner.appendChild(makeSeedSvg(size));
    seed.appendChild(inner);
    field.appendChild(seed);

    const startX = random(-0.05, 1.0) * width;
    const drift = random(0.12, 0.35) * width * (Math.random() < 0.75 ? 1 : -1); // wind mostly blows to the right
    const rise = height + 140;
    const duration = random(16000, 30000) * (size < 20 ? 1.2 : 1); // small seeds float slower
    const peak = random(0.45, 0.95);

    const travel = seed.animate(
      [
        { transform: `translate3d(${startX}px, 0, 0)`, opacity: 0 },
        { opacity: peak, offset: 0.12 },
        { transform: `translate3d(${startX + drift * 0.55}px, ${-rise * 0.5}px, 0)`, opacity: peak, offset: 0.55 },
        { opacity: peak * 0.8, offset: 0.85 },
        { transform: `translate3d(${startX + drift}px, ${-rise}px, 0)`, opacity: 0 },
      ],
      {
        duration,
        // On first load, jump into the middle of the journey so the sky is not empty
        delay: firstRun ? -random(0, duration) : random(0, 4000),
        easing: "linear",
        fill: "both",
      }
    );

    const swing = random(10, 28);
    const sway = inner.animate(
      [
        { transform: `rotate(${-swing}deg) translateX(-6px)` },
        { transform: `rotate(${swing}deg) translateX(6px)` },
      ],
      {
        duration: random(2600, 5200),
        direction: "alternate",
        iterations: Infinity,
        easing: "ease-in-out",
      }
    );

    const entry = { seed, travel, sway };
    running.push(entry);

    travel.onfinish = () => {
      sway.cancel();
      seed.remove();
      running = running.filter((item) => item !== entry);
      if (!reducedMotion.matches && !document.hidden) spawnSeed(false);
    };
  }

  function seedCount() {
    // Fewer seeds on phones to keep the CPU calm
    return window.innerWidth < 700 ? 9 : 18;
  }

  function start() {
    stop();
    if (reducedMotion.matches) return;
    for (let i = 0; i < seedCount(); i++) spawnSeed(true);
  }

  function stop() {
    running.forEach(({ seed, travel, sway }) => {
      travel.onfinish = null;
      travel.cancel();
      sway.cancel();
      seed.remove();
    });
    running = [];
  }

  // Pause when the tab is hidden, so no work is done in the background
  document.addEventListener("visibilitychange", () => {
    running.forEach(({ travel, sway }) => {
      if (document.hidden) {
        travel.pause();
        sway.pause();
      } else {
        travel.play();
        sway.play();
      }
    });
  });

  reducedMotion.addEventListener("change", start);

  let resizeTimer;
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // Only restart for real width changes (phones fire resize while scrolling)
      if (Math.abs(window.innerWidth - lastWidth) > 80) {
        lastWidth = window.innerWidth;
        start();
      }
    }, 300);
  });

  start();
})();
