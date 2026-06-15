window.SOCAL_BITE_BASE_PATH = window.location.hostname.includes("github.io")
  ? "/Socal-Bite-test"
  : "";

window.socalBiteDataUrl = function (path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  return window.SOCAL_BITE_BASE_PATH + "/" + cleanPath + "?v=" + Date.now();
};
