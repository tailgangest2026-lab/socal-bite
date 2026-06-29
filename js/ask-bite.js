document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("askBiteForm");
  const input = document.getElementById("askBiteInput");
  const messages = document.getElementById("askBiteMessages");

  if (!form || !input || !messages) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const question = input.value.trim();
    if (!question) return;

    addMessage(question, "user");
    input.value = "";

    addMessage("Checking the bite...", "bot loading");

    try {
      const [home, conditions] = await Promise.all([
        fetchJson("../home.json"),
        fetchJson("../conditions.json").catch(() => null)
      ]);

      removeLoading();

      const answer = answerBiteQuestion(question, home, conditions);
      addMessage(answer, "bot");
    } catch (error) {
      console.error("Ask The Bite error:", error);
      removeLoading();
      addMessage("I could not load the latest bite data right now.", "bot");
    }
  });

  function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = `bite-message ${type}`;
    div.innerHTML = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeLoading() {
    const loading = messages.querySelector(".loading");
    if (loading) loading.remove();
  }
});

async function fetchJson(path) {
  const cleanPath = String(path).replace(/^\.?\/*data\//, "");

  const url =
    typeof socalBiteDataUrl === "function"
      ? socalBiteDataUrl(cleanPath)
      : cleanPath;

  const separator = url.includes("?") ? "&" : "?";
  const res = await fetch(url + separator + "v=" + Date.now());

  if (!res.ok) {
    throw new Error("Could not load " + url);
  }

  return res.json();
}

function answerBiteQuestion(question, home, conditions) {
  const q = question.toLowerCase();

  const regions =
    Array.isArray(home?.regions)
      ? home.regions
      : Array.isArray(home)
        ? home
        : [];

  if (!regions.length) {
    return "I do not see current bite data yet.";
  }

  const ranked = rankRegions(regions, conditions);

  if (q.includes("yellowtail") || q.includes("yellow tail")) {
    return speciesAnswer(ranked, "Yellowtail");
  }

  if (q.includes("bluefin") || q.includes("tuna")) {
    return speciesAnswer(ranked, "Bluefin Tuna");
  }

  if (q.includes("yellowfin")) {
    return speciesAnswer(ranked, "Yellowfin Tuna");
  }

  if (q.includes("rockfish") || q.includes("cod")) {
    return speciesAnswer(ranked, "Rockfish");
  }

  if (q.includes("calico") || q.includes("bass")) {
    return speciesAnswer(ranked, "Calico Bass");
  }

  if (q.includes("halibut")) {
    return speciesAnswer(ranked, "Halibut");
  }

  if (q.includes("white seabass") || q.includes("seabass")) {
    return speciesAnswer(ranked, "White Seabass");
  }

  if (
    q.includes("condition") ||
    q.includes("weather") ||
    q.includes("wind") ||
    q.includes("waves") ||
    q.includes("swell")
  ) {
    return conditionAnswer(ranked);
  }

  if (q.includes("boat")) {
    return boatAnswer(ranked);
  }

  if (q.includes("landing") || q.includes("kid") || q.includes("family")) {
    return landingAnswer(ranked);
  }

  if (q.includes("la") || q.includes("los angeles")) {
    return regionAnswer(ranked, "Los Angeles County");
  }

  if (q.includes("orange") || q.includes("oc")) {
    return regionAnswer(ranked, "Orange County");
  }

  if (q.includes("san diego")) {
    return regionAnswer(ranked, "San Diego County");
  }

  if (q.includes("ventura")) {
    return regionAnswer(ranked, "Ventura County");
  }

  if (q.includes("santa barbara")) {
    return regionAnswer(ranked, "Santa Barbara County");
  }

  if (q.includes("catalina")) {
    return catalinaAnswer(ranked);
  }

  return bestOverallAnswer(ranked);
}

function rankRegions(regions, conditions) {
  return regions
    .map(region => {
      const regionName =
        region.region ||
        region.name ||
        region.Region ||
        "Unknown Region";

      const trips = Number(region.trips || region.Trips || 0);
      const anglers = Number(region.anglers || region.Anglers || 0);
      const fish = Number(region.fish || region.totalFish || region.Fish || 0);
      const fpa = anglers > 0 ? fish / anglers : 0;

      const topBoat =
        region.topBoat ||
        region.top_boat ||
        region.bestBoat ||
        "No top boat listed";

      const topLanding =
        region.topLanding ||
        region.top_landing ||
        region.bestLanding ||
        "No landing listed";

      const topSpecies =
        region.topSpecies ||
        region.top_species ||
        region.bestSpecies ||
        "Mixed bag";

      const condition = findCondition(regionName, conditions);
      const conditionScore = Number(condition?.score || condition?.biteScore || 0);

      let score = 0;
      score += fpa * 10;
      score += trips * 2;
      score += conditionScore;
      score += fish > 0 ? 10 : 0;

      return {
        name: regionName,
        topBoat,
        topLanding,
        topSpecies,
        trips,
        anglers,
        fish,
        fpa,
        score,
        condition
      };
    })
    .sort((a, b) => b.score - a.score);
}

function bestOverallAnswer(ranked) {
  const best = ranked[0];
  const second = ranked[1];

  return `
    <strong>Best overall bite: ${best.name}</strong><br>
    Top boat: ${best.topBoat}<br>
    Top landing: ${best.topLanding}<br>
    Main species: ${best.topSpecies}<br>
    Fish per angler: ${best.fpa.toFixed(2)}<br><br>
    ${second ? `Backup pick: ${second.name}.` : ""}
  `;
}

function speciesAnswer(ranked, species) {
  const match = ranked.find(r =>
    String(r.topSpecies).toLowerCase().includes(species.toLowerCase())
  );

  if (!match) {
    return `
      <strong>No clear ${species} leader today.</strong><br>
      Best overall option is ${ranked[0].name}.<br>
      Main species showing there: ${ranked[0].topSpecies}.
    `;
  }

  return `
    <strong>Best ${species} shot: ${match.name}</strong><br>
    Top boat: ${match.topBoat}<br>
    Top landing: ${match.topLanding}<br>
    Fish per angler: ${match.fpa.toFixed(2)}
  `;
}

function boatAnswer(ranked) {
  const best = ranked[0];

  return `
    <strong>Hottest boat signal: ${best.topBoat}</strong><br>
    Region: ${best.name}<br>
    Landing: ${best.topLanding}<br>
    Main species: ${best.topSpecies}<br>
    Fish per angler: ${best.fpa.toFixed(2)}
  `;
}

function landingAnswer(ranked) {
  const best = ranked[0];

  return `
    <strong>Best landing to check first: ${best.topLanding}</strong><br>
    Region: ${best.name}<br>
    Top boat: ${best.topBoat}<br>
    Main species: ${best.topSpecies}<br><br>
    For kids or family trips, look for 1/2 day or 3/4 day options before booking.
  `;
}

function conditionAnswer(ranked) {
  const withConditions = ranked
    .filter(r => r.condition && (r.condition.score || r.condition.biteScore))
    .sort((a, b) =>
      Number(b.condition.score || b.condition.biteScore || 0) -
      Number(a.condition.score || a.condition.biteScore || 0)
    );

  const best = withConditions[0] || ranked[0];
  const score = best.condition?.score || best.condition?.biteScore || "Not available";

  return `
    <strong>Best condition signal: ${best.name}</strong><br>
    Bite score: ${score}<br>
    Top boat: ${best.topBoat}<br>
    Main species: ${best.topSpecies}
  `;
}

function regionAnswer(ranked, regionName) {
  const match = ranked.find(r =>
    r.name.toLowerCase() === regionName.toLowerCase()
  );

  if (!match) {
    return `I do not see current data for ${regionName}.`;
  }

  return `
    <strong>${match.name} bite check</strong><br>
    Top boat: ${match.topBoat}<br>
    Top landing: ${match.topLanding}<br>
    Main species: ${match.topSpecies}<br>
    Fish per angler: ${match.fpa.toFixed(2)}
  `;
}

function catalinaAnswer(ranked) {
  const la = ranked.find(r => r.name.toLowerCase().includes("los angeles"));
  const oc = ranked.find(r => r.name.toLowerCase().includes("orange"));

  const best = [la, oc].filter(Boolean).sort((a, b) => b.score - a.score)[0];

  if (!best) {
    return "I do not see enough Catalina-area data right now.";
  }

  return `
    <strong>Catalina-style pick: ${best.name}</strong><br>
    Check boats from ${best.topLanding}.<br>
    Top boat signal: ${best.topBoat}<br>
    Main species: ${best.topSpecies}
  `;
}

function findCondition(regionName, conditions) {
  if (!conditions) return null;

  const rows = Array.isArray(conditions)
    ? conditions
    : Array.isArray(conditions.rows)
      ? conditions.rows
      : Array.isArray(conditions.regions)
        ? conditions.regions
        : [];

  return rows.find(row => {
    const rowRegion = row.region || row.name || row.Region || "";
    return String(rowRegion).toLowerCase() === String(regionName).toLowerCase();
  });
}
