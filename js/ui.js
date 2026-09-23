// Small UI helpers: theme toggle, button ripples, scroll reveal,
// counting numbers and the seed that flies off the send button.
(function () {
  "use strict";

  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  /* ---------- Theme toggle ---------- */

  const toggle = document.getElementById("theme-toggle");

  function currentTheme() {
    return root.getAttribute("data-theme") || (darkQuery.matches ? "dark" : "light");
  }

  function updateToggleLabel() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    toggle.setAttribute("aria-label", `Switch to ${next} theme`);
    const meta = document.querySelectorAll('meta[name="theme-color"]');
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    meta.forEach((tag) => tag.setAttribute("content", bg));
  }

  toggle.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("dandelion-theme", next);
    } catch (e) {
      /* Storage blocked – the choice lasts until the page is closed. */
    }
    updateToggleLabel();
  });

  darkQuery.addEventListener("change", updateToggleLabel);
  updateToggleLabel();

  /* ---------- Ripple on every button ---------- */

  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest(".btn");
    if (!button || button.disabled || reducedMotion.matches) return;

    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  });

  /* ---------- Reveal on scroll ---------- */

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 3, 2) * 90}ms`;
      observer.observe(item);
    });
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- Numbers that count up ---------- */

  const statValues = new Map(); // element -> number currently shown

  function setStat(name, target) {
    const el = document.querySelector(`[data-stat="${name}"]`);
    if (!el) return;
    const from = statValues.get(el) || 0;
    statValues.set(el, target);
    if (from === target) return;

    if (reducedMotion.matches) {
      el.textContent = target.toLocaleString("en");
      return;
    }

    const duration = Math.min(1400, 400 + Math.abs(target - from) * 25);
    const started = performance.now();
    function step(now) {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (target - from) * eased).toLocaleString("en");
      if (t < 1 && statValues.get(el) === target) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- The seed that flies away when you send ---------- */

  function blowSeed(fromElement) {
    if (reducedMotion.matches || !fromElement) return;
    const icon = fromElement.querySelector(".btn__icon") || fromElement;
    const rect = icon.getBoundingClientRect();
    const seed = icon.cloneNode(true);
    seed.classList.add("flying-seed");
    seed.style.left = `${rect.left}px`;
    seed.style.top = `${rect.top}px`;
    document.body.appendChild(seed);

    const dx = 60 + Math.random() * 80;
    const dy = -(160 + Math.random() * 120);
    seed
      .animate(
        [
          { transform: "translate(0, 0) rotate(0deg) scale(1)", opacity: 1 },
          { transform: `translate(${dx * 0.4}px, ${dy * 0.5}px) rotate(-25deg) scale(1.3)`, opacity: 0.9, offset: 0.45 },
          { transform: `translate(${dx}px, ${dy}px) rotate(20deg) scale(0.8)`, opacity: 0 },
        ],
        { duration: 1300, easing: "cubic-bezier(0.25, 0.6, 0.3, 1)" }
      )
      .finished.then(() => seed.remove());
  }

  window.DandelionUI = { setStat, blowSeed };
})();
