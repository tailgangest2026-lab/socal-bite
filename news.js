(function () {
  "use strict";

  function getDataUrl(path) {
    // Use the shared cache-busting helper when it is available, but keep this
    // page working even if site-config.js fails to load for any reason.
    if (typeof window.socalBiteDataUrl === "function") {
      return window.socalBiteDataUrl(path);
    }

    var separator = String(path).includes("?") ? "&" : "?";
    return String(path) + separator + "v=" + Date.now();
  }

  function escapeHtml(value) {
    if (typeof window.socalBiteEscapeHtml === "function") {
      return window.socalBiteEscapeHtml(value);
    }

    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatNewsDate(value) {
    if (!value) return "";

    var parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  }

  function normalizeNewsItem(item) {
    item = item || {};

    return {
      headline: item.headline || item.title || item.name || "No headline",
      source: item.source || item.publisher || "Fishing News",
      link: item.link || item.url || item.article_url || "#",
      date: item.date || item.published || item.pubDate || item.created_at || "",
      summary: item.summary || item.description || item.snippet || ""
    };
  }

  async function loadFishingNews() {
    var container = document.getElementById("newsList");

    if (!container) return;

    try {
      // Keep this path relative. A leading slash can fail in local previews or
      // project-page style GitHub Pages URLs.
      var response = await fetch(getDataUrl("news.json"));

      if (!response.ok) {
        throw new Error("Could not load news.json. Status: " + response.status);
      }

      var news = await response.json();

      if (!Array.isArray(news) || news.length === 0) {
        container.innerHTML = '<p class="empty-state">No fishing news available right now.</p>';
        return;
      }

      var html = news.map(function(rawItem) {
        var item = normalizeNewsItem(rawItem);
        var headline = escapeHtml(item.headline);
        var source = escapeHtml(item.source);
        var link = escapeHtml(item.link);
        var date = formatNewsDate(item.date);
        var summary = escapeHtml(item.summary);
        var hasRealLink = item.link && item.link !== "#";

        var titleHtml = hasRealLink
          ? '<a href="' + link + '" target="_blank" rel="noopener noreferrer">' + headline + '</a>'
          : headline;

        return '' +
          '<article class="news-card">' +
            '<h2>' + titleHtml + '</h2>' +
            '<div class="news-meta">' +
              '<span>' + source + '</span>' +
              (date ? '<span>' + escapeHtml(date) + '</span>' : '') +
            '</div>' +
            (summary ? '<p>' + summary + '</p>' : '') +
          '</article>';
      }).join("");

      container.innerHTML = html;
    } catch (error) {
      console.error("Fishing news error:", error);
      container.innerHTML = '' +
        '<p class="empty-state">Fishing news could not be loaded.</p>' +
        '<p class="empty-state small">Try refreshing the page. If this keeps happening, check that news.json exists in the repository root.</p>';
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadFishingNews);
  } else {
    loadFishingNews();
  }
})();
