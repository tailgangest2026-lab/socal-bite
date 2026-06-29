document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("biteAiBtn");
  const answerBox = document.getElementById("biteAiAnswer");
  const select = document.getElementById("biteAiQuestion");

  if (!btn || !answerBox || !select) return;

  btn.addEventListener("click", async () => {
    answerBox.innerHTML = "Checking the bite...";

    try {
      const [home, conditions] = await Promise.all([
        fetchJson("./data/home.json"),
        fetchJson("./data/conditions.json").catch(() => null)
      ]);

      const question = select.value;
      const answer = buildBiteAnswer(question, home, conditions);

      answerBox.innerHTML = answer;
    } catch (error) {
      console.error(error);
      answerBox.innerHTML = "Could not load bite data right now.";
    }
  });
});

async function fetchJson(path) {
  const res = await fetch(path + "?v=" + Date.now());
  if (!res.ok) throw new Error("Could not load " + path);
  return res.json();
}

function buildBiteAnswer(question, home, conditions) {
  const regions = Array.isArray(home.regions) ? home.regions : [];

  if (!regions.length) {
    return "No current bite data found.";
  }

  const ranked = regions
    .map(region => {
      const trips = Number(region.trips || 0);
      const anglers = Number(region.anglers || 0);
      const fish = Number(region.fish || 0);
      const fpa = anglers > 0 ? fish / anglers : 0;

      let score = 0;
      score += fpa * 10;
      score += trips * 2;
      score += fish > 0 ? 10 : 0;

      const condition = findCondition(region.region, conditions);
      if (condition && condition.score) {
        score += Number(condition.score);
      }

      return {
        name: region.region || "Unknown Region",
        topBoat: region.topBoat || "No top boat listed",
        topLanding: region.topLanding || "No landing listed",
        topSpecies: region.topSpecies || "Mixed bag",
        trips,
        anglers,
        fish,
        fpa,
        score,
        condition
      };
    })
    .sort((a, b) => b.score - a.score);

  if (question === "yellowtail") {
    return speciesAnswer(ranked, "Yellowtail");
  }

  if (question === "rockfish") {
    return speciesAnswer(ranked, "Rockfish");
  }

  if (question === "conditions") {
    return conditionsAnswer(ranked);
  }

  return bestTodayAnswer(ranked[0], ranked[1]);
}

function bestTodayAnswer(best, second) {
  return `
    <strong>Best bite right now: ${best.name}</strong><br>
    Top boat: ${best.topBoat}<br>
    Top landing: ${best.topLanding}<br>
    Main species: ${best.topSpecies}<br>
    Fish per angler: ${best.fpa.toFixed(2)}<br><br>
    ${second ? `Backup option: ${second.name}.` : ""}
  `;
}

function speciesAnswer(ranked, species) {
  const match = ranked.find(r =>
    String(r.topSpecies).toLowerCase().includes(species.toLowerCase())
  );

  if (!match) {
    return `
      <strong>No clear ${species} leader today.</strong><br>
      Best overall bite is ${ranked[0].name}, with ${ranked[0].topSpecies} showing as the main signal.
    `;
  }

  return `
    <strong>Best ${species} shot: ${match.name}</strong><br>
    Top boat: ${match.topBoat}<br>
    Top landing: ${match.topLanding}<br>
    Fish per angler: ${match.fpa.toFixed(2)}<br>
  `;
}

function conditionsAnswer(ranked) {
  const withConditions = ranked
    .filter(r => r.condition && r.condition.score)
    .sort((a, b) => Number(b.condition.score) - Number(a.condition.score));

  const best = withConditions[0] || ranked[0];

  return `
    <strong>Best conditions: ${best.name}</strong><br>
    Bite score: ${best.condition?.score || "Not available"}<br>
    Top boat: ${best.topBoat}<br>
    Main species: ${best.topSpecies}
  `;
}

function findCondition(regionName, conditions) {
  if (!conditions) return null;

  const rows = Array.isArray(conditions)
    ? conditions
    : Array.isArray(conditions.rows)
      ? conditions.rows
      : [];

  return rows.find(row =>
    String(row.region || "").toLowerCase() === String(regionName || "").toLowerCase()
  );
}
