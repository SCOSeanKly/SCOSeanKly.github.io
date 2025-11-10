// script.js

const apiBase = "https://lms-advisor.ske-d03.workers.dev/api";

// Premier League teams with badges (2024-25 season)
const PREMIER_LEAGUE_TEAMS = [
  { name: "Arsenal", badge: "https://crests.football-data.org/57.png" },
  { name: "Aston Villa", badge: "https://crests.football-data.org/58.png" },
  { name: "Bournemouth", badge: "https://crests.football-data.org/1044.png" },
  { name: "Brentford", badge: "https://crests.football-data.org/402.png" },
  { name: "Brighton & Hove Albion", badge: "https://crests.football-data.org/397.png" },
  { name: "Chelsea", badge: "https://crests.football-data.org/61.png" },
  { name: "Crystal Palace", badge: "https://crests.football-data.org/354.png" },
  { name: "Everton", badge: "https://crests.football-data.org/62.png" },
  { name: "Fulham", badge: "https://crests.football-data.org/63.png" },
  { name: "Ipswich Town", badge: "https://crests.football-data.org/349.png" },
  { name: "Leicester City", badge: "https://crests.football-data.org/338.png" },
  { name: "Liverpool", badge: "https://crests.football-data.org/64.png" },
  { name: "Manchester City", badge: "https://crests.football-data.org/65.png" },
  { name: "Manchester United", badge: "https://crests.football-data.org/66.png" },
  { name: "Newcastle United", badge: "https://crests.football-data.org/67.png" },
  { name: "Nottingham Forest", badge: "https://crests.football-data.org/351.png" },
  { name: "Tottenham Hotspur", badge: "https://crests.football-data.org/73.png" },
  { name: "West Ham United", badge: "https://crests.football-data.org/563.png" },
  { name: "Wolverhampton Wanderers", badge: "https://crests.football-data.org/76.png" },
  { name: "Southampton", badge: "https://crests.football-data.org/340.png" }
];

const getBtn = document.getElementById("getRecommendations");
const teamGrid = document.getElementById("teamGrid");

const statusEl = document.getElementById("status");
const strategicAdviceCard = document.getElementById("strategicAdviceCard");
const strategicAdviceEl = document.getElementById("strategicAdvice");
const topPicksCard = document.getElementById("topPicksCard");
const topPicksList = document.getElementById("topPicksList");
const fixturesCard = document.getElementById("fixturesCard");
const fixturesListEl = document.getElementById("fixturesList");

const seasonSelect = document.getElementById("season");
const gameweekInput = document.getElementById("gameweek");
const strategySelect = document.getElementById("strategy");

let selectedTeams = new Set();

// Initialise the team grid based on fixtures for the current season/round
async function initTeamGrid() {
  teamGrid.innerHTML =
    '<div style="grid-column: 1/-1; text-align: center; opacity: 0.7;">Loading teams from fixtures...</div>';

  const savedSeason = localStorage.getItem("lms_season");
  const savedGameweek = localStorage.getItem("lms_gameweek");

  const season = savedSeason || seasonSelect.value || "2025";
  const gw = parseInt(savedGameweek || gameweekInput.value || "1", 10);

  try {
    const fixtures = await fetchFixtures(season, gw);

    if (!fixtures || fixtures.length === 0) {
      teamGrid.innerHTML =
        '<div style="grid-column: 1/-1; text-align: center; opacity: 0.7;">No fixtures found for this round. Choose a round and click "Get Recommendations" to load teams.</div>';
      return;
    }

    const teams = buildTeamsFromFixtures(fixtures);
    renderTeamGrid(teams);
  } catch (err) {
    console.error("Failed to load teams from fixtures:", err);
    teamGrid.innerHTML =
      '<div style="grid-column: 1/-1; text-align: center; opacity: 0.7;">Select a season & round, then press "Get Recommendations" to load teams.</div>';
  }
}

// Build a unique, sorted team list from a fixtures array
function buildTeamsFromFixtures(fixtures) {
  const teamMap = new Map();

  fixtures.forEach((match) => {
    [match.homeTeam, match.awayTeam].forEach((teamName) => {
      if (!teamName || teamMap.has(teamName)) return;

      const matchedTeam = PREMIER_LEAGUE_TEAMS.find((t) => {
        const cleanT = t.name
          .replace(/\s+(FC|AFC|United)$/i, "")
          .trim()
          .toLowerCase();
        const cleanMatch = teamName
          .replace(/\s+(FC|AFC|United)$/i, "")
          .trim()
          .toLowerCase();

        return (
          cleanT === cleanMatch ||
          t.name.toLowerCase() === teamName.toLowerCase() ||
          cleanMatch.includes(cleanT) ||
          cleanT.includes(cleanMatch)
        );
      });

      teamMap.set(teamName, {
        name: teamName,
        badge: matchedTeam ? matchedTeam.badge : getGenericBadge(teamName),
      });
    });
  });

  return Array.from(teamMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}

function renderTeamGrid(teams) {
  teamGrid.innerHTML = "";

  teams.forEach((team) => {
    const teamItem = document.createElement("div");
    teamItem.className = "team-item";
    teamItem.dataset.teamName = team.name;

    const badge = document.createElement("img");
    badge.src = team.badge;
    badge.alt = team.name;
    badge.className = "team-badge";
    badge.onerror = () => {
      badge.style.display = "none";
    };

    const name = document.createElement("div");
    name.className = "team-name";
    name.textContent = team.name;

    teamItem.appendChild(badge);
    teamItem.appendChild(name);

    teamItem.addEventListener("click", () => toggleTeam(team.name, teamItem));

    teamGrid.appendChild(teamItem);
  });

  loadSelectedTeams();
}

function toggleTeam(teamName, element) {
  if (selectedTeams.has(teamName)) {
    selectedTeams.delete(teamName);
    element.classList.remove("selected");
  } else {
    selectedTeams.add(teamName);
    element.classList.add("selected");
  }

  localStorage.setItem("lms_selectedTeams", JSON.stringify([...selectedTeams]));
}

function loadSelectedTeams() {
  const saved = localStorage.getItem("lms_selectedTeams");
  if (saved) {
    try {
      const teams = JSON.parse(saved);
      teams.forEach((teamName) => {
        selectedTeams.add(teamName);
        const element = teamGrid.querySelector(
          `[data-team-name="${teamName}"]`
        );
        if (element) {
          element.classList.add("selected");
        }
      });
    } catch (err) {
      console.warn("Failed to load saved selected teams:", err);
    }
  }
}

function getGenericBadge(teamName) {
  // Neutral Premier League crest instead of Arsenal for unknown teams
  return "https://crests.football-data.org/PL.png";
}

getBtn.addEventListener("click", async () => {
  const season = seasonSelect.value;
  const gw = parseInt(gameweekInput.value || "1", 10);
  const strategy = strategySelect.value;
  const usedTeams = [...selectedTeams];

  localStorage.setItem("lms_season", season);
  localStorage.setItem("lms_gameweek", gw);
  localStorage.setItem("lms_strategy", strategy);

  clearDisplay();
  setStatus("Loading fixtures and recommendations…");
  setButtonDisabled(true);

  try {
    const fixtures = await fetchFixtures(season, gw);

    const teams = buildTeamsFromFixtures(fixtures);
    renderTeamGrid(teams);

    renderFixtures(fixtures);

    const rec = await fetchRecommendations(season, gw, usedTeams, strategy);
    renderRecommendations(rec);

    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Error: " + err.message);
  } finally {
    setButtonDisabled(false);
  }
});

async function fetchFixtures(season, gameweek) {
  const url = `${apiBase}/fixtures?year=${season}&gameweek=${encodeURIComponent(
    gameweek
  )}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error("Failed to fetch fixtures: " + text);
  }
  const data = await res.json();

  if (data.error) {
    throw new Error(data.error + (data.details ? ": " + data.details : ""));
  }

  return data.fixtures || [];
}

function renderFixtures(fixtures) {
  if (!fixtures || fixtures.length === 0) {
    fixturesCard.classList.add("hidden");
    fixturesListEl.innerHTML = "";
    return;
  }

  fixturesCard.classList.remove("hidden");
  fixturesListEl.innerHTML = "";

  const fixturesByDate = {};
  fixtures.forEach((f) => {
    const dateKey = new Date(f.kickoff).toDateString();
    if (!fixturesByDate[dateKey]) {
      fixturesByDate[dateKey] = [];
    }
    fixturesByDate[dateKey].push(f);
  });

  const sortedDates = Object.keys(fixturesByDate).sort((a, b) => {
    const dateA = new Date(
      fixturesByDate[a][0] ? fixturesByDate[a][0].kickoff : a
    );
    const dateB = new Date(
      fixturesByDate[b][0] ? fixturesByDate[b][0].kickoff : b
    );
    return dateA - dateB;
  });

  sortedDates.forEach((dateKey) => {
    const dateHeader = document.createElement("div");
    dateHeader.className = "date-header";
    dateHeader.textContent = dateKey;
    fixturesListEl.appendChild(dateHeader);

    fixturesByDate[dateKey].forEach((f) => {
      const row = document.createElement("div");
      row.className = "fixture-row";

      const teamsDiv = document.createElement("div");
      teamsDiv.className = "fixture-teams";

      const badgesDiv = document.createElement("div");
      badgesDiv.className = "fixture-badges";

      const homeBadge = document.createElement("img");
      homeBadge.src = f.homeCrest || getTeamBadgeByName(f.homeTeam);
      homeBadge.alt = f.homeTeam;

      const awayBadge = document.createElement("img");
      awayBadge.src = f.awayCrest || getTeamBadgeByName(f.awayTeam);
      awayBadge.alt = f.awayTeam;

      badgesDiv.appendChild(homeBadge);
      badgesDiv.appendChild(awayBadge);

      const textSpan = document.createElement("span");
      textSpan.textContent = `${f.homeTeam} vs ${f.awayTeam}`;

      teamsDiv.appendChild(badgesDiv);
      teamsDiv.appendChild(textSpan);

      const metaDiv = document.createElement("div");
      metaDiv.className = "fixture-meta";
      metaDiv.textContent = `${new Date(f.kickoff).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} · ${f.venue || ""}`;

      row.appendChild(teamsDiv);
      row.appendChild(metaDiv);

      fixturesListEl.appendChild(row);
    });
  });
}

function getTeamBadgeByName(name) {
  const match = PREMIER_LEAGUE_TEAMS.find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );
  return match ? match.badge : getGenericBadge(name);
}

async function fetchRecommendations(season, gameweek, usedTeams, strategy) {
  const url = `${apiBase}/recommendations`;
  const body = {
    year: season,
    gameweek,
    usedTeams,
    strategy,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Failed to fetch recommendations: " + text);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error + (data.details ? ": " + data.details : ""));
  }

  return data;
}

function renderRecommendations(rec) {
  if (!rec || !rec.topPicks || rec.topPicks.length === 0) {
    topPicksCard.classList.add("hidden");
    strategicAdviceCard.classList.add("hidden");
    return;
  }

  if (rec.strategicAdvice) {
    strategicAdviceCard.classList.remove("hidden");
    strategicAdviceEl.textContent = rec.strategicAdvice;
  } else {
    strategicAdviceCard.classList.add("hidden");
  }

  topPicksCard.classList.remove("hidden");
  topPicksList.innerHTML = "";

  rec.topPicks.slice(0, 3).forEach((pick, index) => {
    const pickDiv = document.createElement("div");
    pickDiv.className = "pick-item";

    const header = document.createElement("div");
    header.className = "pick-header";

    const rankSpan = document.createElement("div");
    rankSpan.className = `pick-rank rank-${index + 1}`;
    rankSpan.textContent = index + 1;

    const teamsDiv = document.createElement("div");
    teamsDiv.className = "pick-teams";

    const badgesInline = document.createElement("div");
    badgesInline.className = "team-badges-inline";

    const teamBadge = document.createElement("img");
    teamBadge.src = getTeamBadgeByName(pick.teamName);
    teamBadge.alt = pick.teamName;

    const oppBadge = document.createElement("img");
    oppBadge.src = getTeamBadgeByName(pick.opponent);
    oppBadge.alt = pick.opponent;

    badgesInline.appendChild(teamBadge);
    badgesInline.appendChild(oppBadge);

    const teamsText = document.createElement("span");
    const homeLabel = pick.home ? "(H)" : "(A)";
    teamsText.textContent = `${pick.teamName} ${homeLabel} vs ${pick.opponent}`;

    teamsDiv.appendChild(badgesInline);
    teamsDiv.appendChild(teamsText);

    header.appendChild(rankSpan);
    header.appendChild(teamsDiv);

    const metaDiv = document.createElement("div");
    metaDiv.className = "pick-meta";

    const winProb = document.createElement("div");
    winProb.className = "meta-item";
    const probBadge = document.createElement("span");
    probBadge.className = `badge ${pick.riskLevel || "medium"}`;
    const winPercent = Math.round((pick.winProbability || 0) * 100);
    probBadge.textContent = `${winPercent}% win chance`;
    winProb.appendChild(probBadge);

    const scoreSpan = document.createElement("div");
    scoreSpan.className = "predicted-score";
    scoreSpan.textContent = pick.predictedScore || "";

    const tierSpan = document.createElement("span");
    const tierClass = pick.teamTier || "safe-mid";
    tierSpan.className = `team-tier-badge ${tierClass}`;
    tierSpan.textContent = (tierClass || "").replace("-", " ").toUpperCase();

    metaDiv.appendChild(winProb);
    metaDiv.appendChild(scoreSpan);
    metaDiv.appendChild(tierSpan);

    const reasoningDiv = document.createElement("div");
    reasoningDiv.className = "reasoning";
    reasoningDiv.textContent = pick.reasoning || "";

    pickDiv.appendChild(header);
    pickDiv.appendChild(metaDiv);
    pickDiv.appendChild(reasoningDiv);

    topPicksList.appendChild(pickDiv);
  });
}

function clearDisplay() {
  topPicksCard.classList.add("hidden");
  strategicAdviceCard.classList.add("hidden");
  fixturesCard.classList.add("hidden");
  topPicksList.innerHTML = "";
  strategicAdviceEl.textContent = "";
  fixturesListEl.innerHTML = "";
}

function setStatus(text) {
  statusEl.textContent = text;
}

function setButtonDisabled(disabled) {
  getBtn.disabled = disabled;
}

// Load saved values on first load
window.addEventListener("DOMContentLoaded", async () => {
  const savedSeason = localStorage.getItem("lms_season");
  const savedGameweek = localStorage.getItem("lms_gameweek");
  const savedStrategy = localStorage.getItem("lms_strategy");

  if (savedSeason) {
    seasonSelect.value = savedSeason;
  }
  if (savedGameweek) {
    gameweekInput.value = savedGameweek;
  }
  if (savedStrategy) {
    strategySelect.value = savedStrategy;
  }

  await initTeamGrid();
});
