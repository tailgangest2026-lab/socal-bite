// SoCal Bite shared browser helpers
// Keep this file small and dependency-free so every page can use it safely.
window.SOCAL_BITE = window.SOCAL_BITE || {};
window.SOCAL_BITE.DATA_VERSION = "2026-06-05";

window.socalBiteDataUrl = function socalBiteDataUrl(path) {
  const separator = String(path).includes("?") ? "&" : "?";
  return String(path) + separator + "v=" + window.SOCAL_BITE.DATA_VERSION;
};

window.socalBiteEscapeHtml = function socalBiteEscapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};
