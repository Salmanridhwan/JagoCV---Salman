// Theme management (light / dark toggle)

export function initTheme(): void {
  const htmlEl = document.documentElement;
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "light") {
    htmlEl.classList.remove("dark");
  } else {
    htmlEl.classList.add("dark");
  }
}

export function toggleTheme(): void {
  const htmlEl = document.documentElement;
  if (htmlEl.classList.contains("dark")) {
    htmlEl.classList.remove("dark");
    localStorage.setItem("theme", "light");
  } else {
    htmlEl.classList.add("dark");
    localStorage.setItem("theme", "dark");
  }
}

export function bindThemeToggles(): void {
  const themeToggleLanding = document.getElementById("theme-toggle");
  const themeToggleApp = document.getElementById("theme-toggle-app");

  if (themeToggleLanding)
    themeToggleLanding.addEventListener("click", toggleTheme);
  if (themeToggleApp) themeToggleApp.addEventListener("click", toggleTheme);
}
