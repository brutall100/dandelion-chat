// Runs in <head> before the page paints: apply the saved theme so it never flashes.
(function () {
  document.documentElement.classList.add("js");
  try {
    var saved = localStorage.getItem("dandelion-theme");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {
    /* Storage blocked (private mode) – fall back to the system setting. */
  }
})();
