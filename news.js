document.addEventListener("DOMContentLoaded", loadNews);

async function loadNews() {
  try {
    const news = await fetchJson("news.json");
    const items = Array.isArray(news) ? news : news.items || [];

    renderNews(items);
  } catch (error) {
    console.error("News load error:", error);
    setHtml("featuredNews", `<div class="empty-card">Could not load featured news.</div>`);
    setHtml("newsGrid", `<div class="empty-card">Could not load news.</div>`);
  }
}

async function fetchJson(path) {
  const url = typeof socalBiteDataUrl === "function" ? socalBiteDataUrl(path) : path;
  const response = await fetch(url + "?v=" + Date.now());

  if (!response.ok) throw new Error("Could not load " + path);

  return response.json();
}

function renderNews(items) {
  if (!items.length) {
    setHtml("featuredNews", `<div class="empty-card">No news found.</div>`);
    setHtml("newsGrid", "");
    return;
  }

  const sorted = items.slice().sort((a, b) => {
    return new Date(b.date || b.published || 0) - new Date(a.date || a.published || 0);
  });

  const featured = sorted[0];
  const rest = sorted.slice(1);

  setHtml("featuredNews", featuredCard(featured));
  setHtml("newsGrid", rest.map(newsCard).join(""));
}

function featuredCard(item) {
  return `
    <article class="news-feature">
      <span class="page-kicker">${safe(item.category || "Featured")}</span>
      <h2>${safe(item.title)}</h2>
      <p>${safe(item.summary || item.description || "")}</p>
      <div class="news-meta">
        <span>${formatDate(item.date || item.published)}</span>
        <span>${safe(item.source || "The SoCal Bite")}</span>
      </div>
      <a class="primary-btn" href="${safeUrl(item.url || item.link || "#")}" target="_blank" rel="noopener">
        Read story →
      </a>
    </article>
  `;
}

function newsCard(item) {
  return `
    <article class="news-card-love">
      <span>${safe(item.category || "News")}</span>
      <h3>${safe(item.title)}</h3>
      <p>${safe(item.summary || item.description || "")}</p>
      <div class="news-meta">
        <small>${formatDate(item.date || item.published)}</small>
        <small>${safe(item.source || "")}</small>
      </div>
      <a href="${safeUrl(item.url || item.link || "#")}" target="_blank" rel="noopener">
        Read more
      </a>
    </article>
  `;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function formatDate(value) {
  if (!value) return "Recent";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function safe(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value) {
  const url = String(value || "#").trim();
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
    return safe(url);
  }
  return "#";
}
