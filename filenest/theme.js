(function () {
  const storageKey = "filenestTheme";
  const root = document.documentElement;

  function readSavedTheme() {
    try {
      return localStorage.getItem(storageKey);
    } catch (error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      root.dataset.themeMemory = theme;
    }
  }

  function preferredTheme() {
    const saved = readSavedTheme() || root.dataset.themeMemory;
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    saveTheme(theme);
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const icon = button.querySelector(".material-symbols-rounded");
      if (icon) icon.textContent = theme === "dark" ? "light_mode" : "dark_mode";
      button.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      button.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    });
  }

  applyTheme(preferredTheme());

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-theme-toggle]");
    if (button) {
      event.preventDefault();
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
    }
  });
})();
