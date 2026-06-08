document.addEventListener("DOMContentLoaded", loadLandingDetail);

async function loadLandingDetail() {
  const landingInfo = document.getElementById("landingInfo");
  const params = new URLSearchParams(window.location.search);
  const landingName = params.get("landing");

  if (!landingName) {
    landingInfo.innerHTML = '<div class="loading-card">No landing selected.</div>';
    return;
  }

  try {
    const [landingRes, priceRes, tripTypeRes, indexRes] = await Promise.all([
      fetch(socalBiteDataUrl("landing-detail.json")),
      fetch(socalBiteDataUrl("trip-prices.json")),
      fetch(socalBiteDataUrl("landing-trip-types.json")),
      fetch(socalBiteDataUrl("daily-report-index.json"))
    ]);

    const landings = landingRes.ok ? await landingRes.json() : [];
    const prices = priceRes.ok ? await priceRes.json() : [];
    const tripTypes = tripTypeRes.ok ? await tripTypeRes.json() : [];
    const dailyIndex = indexRes.ok ? await indexRes.json() : [];

    const landing = landings.find(l => normalize(l.landing) === normalize(landingName));

    if (!landing) {
      landingInfo.innerHTML = '<div class="loading-card">Landing not found.</div>';
      return;
    }

    updateSeo(landingName);

    const recentRows = await loadRecentLandingReports(dailyIndex, landingName);

    renderLandingInfo(landing, prices, tripTypes);
    renderLandingBoats(recentRows);
    renderTopSpecies(recentRows);
    renderRecentReports(recentRows);

  } catch (err) {
    console.error("Landing detail error:", err);
    landingInfo.innerHTML = '<div class="loading-card">Landing detail not available.</div>';
  }
}

async function loadRecentLandingReports(dailyIndex, landingName) {
  const recentReports = Array.isArray(dailyIndex) ? dailyIndex.slice(0, 30) : [];
  const allRows = [];

  for (const report of recentReports) {
    const filePath = report.file || `reports/daily-report-${report.date}.json`;

    try {
      const response = await fetch(socalBiteDataUrl(filePath));
      if (!response.ok) continue;

      const rows = await response.json();
      if (!Array.isArray(rows)) continue;

      rows.forEach(row => {
        if (normalize(row.landing) === normalize(landingName)) {
          allRows.push(row);
        }
      });
    } catch (err) {
      console.warn("Skipped report:", filePath, err);
    }
  }

  return allRows;
}

function renderLandingInfo(landing, prices, tripTypes) {
  const container = document.getElementById("landingInfo");
  const landingName = landing.landing || "";

  const knownTripTypes = Array.isArray(tripTypes)
    ? tripTypes
        .filter(t => normalize(t.landing) === normalize(landingName))
        .sort((a, b) => sortTripTypes(a.trip_type, b.trip_type))
    : [];

  const foundPrices = Array.isArray(prices)
    ? prices.filter(p => normalize(p.landing) === normalize(landingName))
    : [];

  const priceMap = {};

  foundPrices.forEach(p => {
    const key = normalize(p.trip_type);
    const price = Number(p.price || 0);

    if (!key) return;

    if (!priceMap[key] || price < priceMap[key].price) {
      priceMap[key] = {
        trip_type: p.trip_type,
        price,
        booking_url: p.booking_url || p.source_url || landing.booking_url || landing.website || ""
      };
    }
  });

  const mergedTrips = [];

  knownTripTypes.forEach(t => {
    const key = normalize(t.trip_type);
    const match = priceMap[key];

    mergedTrips.push({
      trip_type: t.trip_type,
      times_seen: t.times_seen || "",
      price: match ? match.price : "",
      booking_url: match ? match.booking_url : landing.booking_url || landing.website || ""
    });
  });

  foundPrices.forEach(p => {
    const key = normalize(p.trip_type);
    const alreadyExists = mergedTrips.some(t => normalize(t.trip_type) === key);

    if (!alreadyExists) {
      mergedTrips.push({
        trip_type: p.trip_type || "Trip",
        times_seen: "",
        price: p.price || "",
        booking_url: p.booking_url || p.source_url || landing.booking_url || landing.website || ""
      });
    }
  });

  mergedTrips.sort((a, b) => sortTripTypes(a.trip_type, b.trip_type));

  const priceHtml = mergedTrips.length
    ? mergedTrips.map(t => `
        <div class="price-row">
          <span>${escapeHtml(t.trip_type || "Trip")}</span>
          <strong>${t.price ? formatPrice(t.price) : "Check Website"}</strong>
        </div>
      `).join("")
    : '<p class="muted">No trip types available yet.</p>';

  const telLink = landing.phone ? String(landing.phone).replace(/[^\d]/g, "") : "";

  container.innerHTML = `
    <article class="region-card landing-card">

      <div class="landing-card-top">
        <h2>${escapeHtml(landing.landing || "Unknown Landing")}</h2>
        <p>${escapeHtml(landing.region || "")}</p>
      </div>

      <div class="landing-stats">
        <div><strong>${number(landing.boats)}</strong><span>Boats</span></div>
        <div><strong>${number(landing.anglers)}</strong><span>Anglers</span></div>
        <div><strong>${number(landing.fish)}</strong><span>Fish</span></div>
        <div><strong>${Number(landing.fpa || 0).toFixed(2)}</strong><span>FPA</span></div>
      </div>

      <div class="landing-info">
        ${
          landing.phone
            ? `<p><i class="fa-solid fa-phone"></i> <a href="tel:${telLink}">${escapeHtml(landing.phone)}</a></p>`
            : ""
        }

        ${
          landing.address
            ? `<p><i class="fa-solid fa-location-dot"></i> ${escapeHtml(landing.address)}</p>`
            : ""
        }
      </div>

      <div class="price-box">
        <h3>Trip Types / Prices</h3>
        ${priceHtml}
      </div>

      <div class="landing-buttons">
        ${
          landing.website
            ? `<a href="${escapeAttr(landing.website)}" target="_blank" rel="noopener"><i class="fa-solid fa-globe"></i><span>Website</span></a>`
            : ""
        }

        ${
          landing.google_maps_link
            ? `<a href="${escapeAttr(landing.google_maps_link)}" target="_blank" rel="noopener"><i class="fa-solid fa-location-dot"></i><span>Directions</span></a>`
            : ""
        }

        ${
          landing.booking_url
            ? `<a href="${escapeAttr(landing.booking_url)}" target="_blank" rel="noopener"><i class="fa-solid fa-ticket"></i><span>Book Trip</span></a>`
            : ""
        }
      </div>

    </article>
  `;
}

function renderLandingBoats(rows) {
  const container = document.getElementById("landingBoats");

  const boatMap = {};

  rows.forEach(row => {
    const boat = row.boat || "Unknown Boat";
    if (!boatMap[boat]) {
      boatMap[boat] = {
        boat,
        trips: 0,
        anglers: 0,
        fish: 0
      };
    }

    boatMap[boat].trips += 1;
    boatMap[boat].anglers += Number(row.anglers || 0);
    boatMap[boat].fish += Number(row.total_fish || 0);
  });

  const boats = Object.values(boatMap)
    .sort((a, b) => b.fish - a.fish);

  if (!boats.length) {
    container.innerHTML = '<div class="loading-card">No boats found for this landing.</div>';
    return;
  }

  container.innerHTML = `
    <div class="ratings-grid">
      ${boats.map(boat => `
        <a class="region-card landing-card" href="boat-detail.html?boat=${encodeURIComponent(boat.boat)}">
          <div class="landing-card-top">
            <h2>${escapeHtml(boat.boat)}</h2>
            <p>${number(boat.trips)} recent trips</p>
          </div>

          <div class="landing-stats">
            <div><strong>${number(boat.anglers)}</strong><span>Anglers</span></div>
            <div><strong>${number(boat.fish)}</strong><span>Fish</span></div>
            <div><strong>${boat.anglers ? (boat.fish / boat.anglers).toFixed(2) : "0.00"}</strong><span>FPA</span></div>
          </div>
        </a>
      `).join("")}
    </div>
  `;
}

function renderTopSpecies(rows) {
  const container = document.getElementById("topSpecies");
  const speciesTotals = {};

  rows.forEach(row => {
    parseFishCounts(row.fish_counts).forEach(item => {
      speciesTotals[item.species] = (speciesTotals[item.species] || 0) + item.count;
    });
  });

  const topSpecies = Object.entries(speciesTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!topSpecies.length) {
    container.innerHTML = '<div class="loading-card">No species data found.</div>';
    return;
  }

  container.innerHTML = `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Species</th>
            <th>Fish</th>
          </tr>
        </thead>
        <tbody>
          ${topSpecies.map(([species, count]) => `
            <tr>
              <td>
                <a href="species-detail.html?species=${encodeURIComponent(species)}">
                  ${escapeHtml(species)}
                </a>
              </td>
              <td>${number(count)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderRecentReports(rows) {
  const container = document.getElementById("recentReports");

  const recent = rows.slice(0, 30);

  if (!recent.length) {
    container.innerHTML = '<div class="loading-card">No recent fish reports found.</div>';
    return;
  }

  container.innerHTML = `
    <div class="ratings-grid">
      ${recent.map(row => `
        <article class="region-card landing-card">
          <div class="landing-card-top">
            <h2>${escapeHtml(row.boat || "Unknown Boat")}</h2>
            <p>${escapeHtml(row.trip_date || "")} • ${escapeHtml(row.trip_type || "")}</p>
          </div>

          <div class="landing-stats">
            <div><strong>${number(row.anglers)}</strong><span>Anglers</span></div>
            <div><strong>${number(row.total_fish)}</strong><span>Fish</span></div>
            <div><strong>${Number(row.anglers || 0) ? (Number(row.total_fish || 0) / Number(row.anglers || 1)).toFixed(2) : "0.00"}</strong><span>FPA</span></div>
          </div>

          <div class="landing-info">
            <p>${escapeHtml(row.fish_counts || "No fish count listed")}</p>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function parseFishCounts(fishCounts) {
  if (!fishCounts) return [];

  return String(fishCounts)
    .split(",")
    .map(item => {
      const match = item.trim().match(/^([\d.]+)\s+(.+)$/);
      if (!match) return null;

      const species = match[2]
        .replace(/\bReleased\b/gi, "")
        .replace(/\bRelease\b/gi, "")
        .replace(/\bKept\b/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      return {
        count: Number(match[1]),
        species
      };
    })
    .filter(Boolean);
}

function updateSeo(landingName) {
  const title = `${landingName} Fishing Report | SoCal Bite`;
  const description = `${landingName} sportfishing report with boats, top species, trip types, prices, and recent Southern California fish counts.`;
  const url = `https://thesocalbite.com/landing-detail.html?landing=${encodeURIComponent(landingName)}`;

  document.title = title;

  const landingTitle = document.getElementById("landingTitle");
  const pageTitle = document.getElementById("pageTitle");
  const metaDescription = document.getElementById("metaDescription");
  const canonicalLink = document.getElementById("canonicalLink");
  const ogTitle = document.getElementById("ogTitle");
  const ogDescription = document.getElementById("ogDescription");
  const ogUrl = document.getElementById("ogUrl");

  if (landingTitle) landingTitle.textContent = `${landingName} Fishing Report`;
  if (pageTitle) pageTitle.textContent = title;
  if (metaDescription) metaDescription.setAttribute("content", description);
  if (canonicalLink) canonicalLink.setAttribute("href", url);
  if (ogTitle) ogTitle.setAttribute("content", title);
  if (ogDescription) ogDescription.setAttribute("content", description);
  if (ogUrl) ogUrl.setAttribute("content", url);
}

function sortTripTypes(a, b) {
  const order = [
    "1/2 Day AM",
    "1/2 Day PM",
    "1/2 Day Twilight",
    "Half Day",
    "3/4 Day",
    "Full Day",
    "Overnight",
    "1.5 Day",
    "2 Day",
    "2.5 Day",
    "3 Day",
    "Long Range"
  ];

  const ai = order.indexOf(String(a || ""));
  const bi = order.indexOf(String(b || ""));

  if (ai === -1 && bi === -1) return String(a || "").localeCompare(String(b || ""));
  if (ai === -1) return 1;
  if (bi === -1) return -1;

  return ai - bi;
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function number(value) {
  return Number(value || 0).toLocaleString();
}

function formatPrice(value) {
  const num = Number(value || 0);
  return num ? "$" + num.toFixed(0) : "N/A";
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}
