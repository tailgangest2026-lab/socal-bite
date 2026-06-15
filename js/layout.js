const scriptUrl = document.currentScript?.src || window.location.href;

function resolveComponentUrl(path) {
  return new URL(path, scriptUrl).href;
}

function normalizeHeaderLogo(el) {
  if (!el) return;

  const logo = el.querySelector('img[data-src]');
  if (logo) {
    logo.src = new URL(logo.dataset.src, scriptUrl).href;
  }
}

function normalizeHeaderLinks(el) {
  if (!el) return;

  const links = el.querySelectorAll('[data-href]');
  links.forEach((link) => {
    const path = link.getAttribute('data-href');
    if (path) {
      link.setAttribute('href', new URL(path, scriptUrl).href);
    }
  });
}

async function loadComponent(id, path) {
  const el = document.getElementById(id);
  if (!el) return;

  const url = resolveComponentUrl(path);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to load ${url}`);
    }

    el.innerHTML = await response.text();

    normalizeHeaderLogo(el);
    normalizeHeaderLinks(el);
  } catch (error) {
    console.error("Component load error:", error);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  loadComponent("site-header", "../components/header.html");
  loadComponent("site-footer", "../components/footer.html");
});
