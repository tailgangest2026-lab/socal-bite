document.addEventListener("DOMContentLoaded", loadLandings);

  async function loadLandings() {
    const container = document.getElementById("landingContainer");

    try {
      const [landingRes, priceRes, tripTypeRes] = await Promise.all([
        fetch(socalBiteDataUrl("landing-detail.json")),
        fetch(socalBiteDataUrl("trip-prices.json")),
        fetch(socalBiteDataUrl("landing-trip-types.json"))
      ]);

      if (!landingRes.ok) {
        throw new Error("Could not load landing-detail.json");
      }

      const landings = await landingRes.json();
      const prices = priceRes.ok ? await priceRes.json() : [];
      const tripTypes = tripTypeRes.ok ? await tripTypeRes.json() : [];

      renderLandings(landings, prices, tripTypes);
    } catch (err) {
      console.error("Landing load error:", err);
      container.innerHTML = '<div class="loading-card">Landing data not available.</div>';
    }
  }

  function renderLandings(landings, prices, tripTypes) {
    const container = document.getElementById("landingContainer");

    if (!Array.isArray(landings) || !landings.length) {
      container.innerHTML = '<div class="loading-card">No landing data found.</div>';
      return;
    }

    const regionOrder = [
      "San Diego",
      "Orange County",
      "Los Angeles",
      "Ventura",
      "Santa Barbara",
      "Central Coast"
    ];

    const grouped = {};

    landings.forEach(landing => {
      const region = landing.region || "Other";

      if (!grouped[region]) {
        grouped[region] = [];
      }

      grouped[region].push(landing);
    });

    const regions = Object.keys(grouped).sort((a, b) => {
      const ai = regionOrder.indexOf(a);
      const bi = regionOrder.indexOf(b);

      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;

      return ai - bi;
    });

    container.innerHTML = regions.map(region => {
      const cards = grouped[region]
        .sort((a, b) => String(a.landing || "").localeCompare(String(b.landing || "")))
        .map(landing => buildLandingCard(landing, prices, tripTypes))
        .join("");

      return `
        <section class="landing-region-section">
          <h2>${escapeHtml(region)} Landings</h2>

          <div class="ratings-grid">
            ${cards}
          </div>
        </section>
      `;
    }).join("");
  }

  function buildLandingCard(landing, prices, tripTypes) {
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
          price: price,
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

    return `
      <article class="region-card landing-card">

        <div class="landing-card-top">
          <h2>
  <a href="landing-detail.html?landing=${encodeURIComponent(landingName)}" class="landing-title-link">
    ${escapeHtml(landing.landing || "Unknown Landing")}
  </a>
</h2>
          <p>${escapeHtml(landing.region || "")}</p>
        </div>

        <div class="landing-stats">
          <div>
            <strong>${number(landing.boats)}</strong>
            <span>Boats</span>
          </div>

          <div>
            <strong>${number(landing.anglers)}</strong>
            <span>Anglers</span>
          </div>

          <div>
            <strong>${number(landing.fish)}</strong>
            <span>Fish</span>
          </div>

          <div>
            <strong>${Number(landing.fpa || 0).toFixed(2)}</strong>
            <span>FPA</span>
          </div>
        </div>

        <div class="landing-info">
          ${
            landing.phone
              ? `
                <p>
                  <i class="fa-solid fa-phone"></i>
                  <a href="tel:${telLink}">${escapeHtml(landing.phone)}</a>
                </p>
              `
              : ""
          }

          ${
            landing.address
              ? `
                <p>
                  <i class="fa-solid fa-location-dot"></i>
                  ${escapeHtml(landing.address)}
                </p>
              `
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
              ? `
                <a href="${escapeAttr(landing.website)}" target="_blank" rel="noopener">
                  <i class="fa-solid fa-globe"></i>
                  <span>Website</span>
                </a>
              `
              : ""
          }

          ${
            landing.google_maps_link
              ? `
                <a href="${escapeAttr(landing.google_maps_link)}" target="_blank" rel="noopener">
                  <i class="fa-solid fa-location-dot"></i>
                  <span>Directions</span>
                </a>
              `
              : ""
          }

          ${
            landing.booking_url
              ? `
                <a href="${escapeAttr(landing.booking_url)}" target="_blank" rel="noopener">
                  <i class="fa-solid fa-ticket"></i>
                  <span>Book Trip</span>
                </a>
              `
              : ""
          }
        </div>

      </article>
    `;
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

    if (ai === -1 && bi === -1) {
      return String(a || "").localeCompare(String(b || ""));
    }

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
