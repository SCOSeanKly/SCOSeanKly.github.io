// script.js - Modern LMS advisor with star ratings & win probabilities

const apiBase = "https://lms-advisor.ske-d03.workers.dev/api";

// ---- Team data ----
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
  { name: "Southampton", badge: "https://crests.football-data.org/340.png" },
  { name: "Tottenham Hotspur", badge: "https://crests.football-data.org/73.png" },
  { name: "West Ham United", badge: "https://crests.football-data.org/563.png" },
  { name: "Wolverhampton Wanderers", badge: "https://crests.football-data.org/76.png" },
];

// ---- DOM ----
const teamGrid = document.getElementById("teamGrid");
const teamCounter = document.getElementById("teamCounter");
const statusEl = document.getElementById("status");
const strategicAdviceCard = document.getElementById("strategicAdviceCard");
const strategicAdviceEl = document.getElementById("strategicAdvice");
const topPicksCard = document.getElementById("topPicksCard");
const topPicksList = document.getElementById("topPicksList");
const fixturesCard = document.getElementById("fixturesCard");
const fixturesListEl = document.getElementById("fixturesList");
const seasonSelect = document.getElementById("season");
const gameweekInput = document.getElementById("gameweek");
const legacyStrategySelect = document.getElementById("strategy");
const strategyButtons = document.querySelectorAll("[data-strategy-option]");
const strategySummary = document.getElementById("strategySummary");
const getBtn = document.getElementById("getRecommendations");
const modalEl = document.getElementById("teamModal");
const modalTitleEl = document.getElementById("teamModalTitle");
const modalBodyEl = document.getElementById("teamModalBody");

// ---- State ----
let selectedTeams = new Set();
let currentFixtures = [];
let currentRecommendations = null;
let pickMap = new Map();
let isLoading = false;
let refreshTimeout = null;

// ---- Utilities ----
function getGenericBadge(teamName) {
  const encoded = encodeURIComponent(teamName || "Team");
  return `https://ui-avatars.com/api/?name=${encoded}&background=1e2433&color=f9fafb&rounded=true&size=64`;
}

function normaliseTeamName(name) {
  return (name || "")
    .replace(/\s+(FC|AFC|United|City|Town)$/i, "")
    .trim()
    .toLowerCase();
}

function getTeamConfigByName(teamName) {
  if (!teamName) return null;
  const target = normaliseTeamName(teamName);

  return (
    PREMIER_LEAGUE_TEAMS.find((t) => normaliseTeamName(t.name) === target) ||
    PREMIER_LEAGUE_TEAMS.find((t) =>
      normaliseTeamName(t.name).includes(target)
    ) ||
    PREMIER_LEAGUE_TEAMS.find((t) =>
      target.includes(normaliseTeamName(t.name))
    ) ||
    null
  );
}

function inferTier(teamName, existingTier) {
  if (existingTier) return existingTier;

  const eliteNames = [
    "Arsenal",
    "Liverpool",
    "Manchester City",
  ];
  const strongNames = [
    "Manchester United",
    "Chelsea",
    "Tottenham Hotspur",
    "Newcastle United",
    "Aston Villa",
  ];
  const safeMidNames = [
    "Brighton & Hove Albion",
    "Brentford",
    "Fulham",
    "West Ham United",
  ];
  const riskyMidNames = [
    "Wolverhampton Wanderers",
    "Crystal Palace",
    "Bournemouth",
    "Nottingham Forest",
  ];

  const norm = normaliseTeamName(teamName);
  if (eliteNames.some((n) => normaliseTeamName(n) === norm)) return "elite";
  if (strongNames.some((n) => normaliseTeamName(n) === norm)) return "strong";
  if (safeMidNames.some((n) => normaliseTeamName(n) === norm)) return "safe-mid";
  if (riskyMidNames.some((n) => normaliseTeamName(n) === norm)) return "risky-mid";
  return "weak";
}

function tierBaseStrength(tier) {
  switch (tier) {
    case "elite":
      return 0.80;
    case "strong":
      return 0.70;
    case "safe-mid":
      return 0.58;
    case "risky-mid":
      return 0.48;
    case "weak":
    default:
      return 0.35;
  }
}

// Approximate win probabilities for a fixture using tiers + home advantage.
function estimateFixtureProb(homeTeam, awayTeam) {
  const homeTier = inferTier(homeTeam);
  const awayTier = inferTier(awayTeam);

  const baseHome = tierBaseStrength(homeTier);
  const baseAway = tierBaseStrength(awayTier);

  // Home advantage
  const homeAdj = baseHome + 0.08;
  const diff = homeAdj - baseAway;

  let homeProb = 0.5 + diff * 0.65;
  homeProb = Math.min(0.92, Math.max(0.08, homeProb));
  const awayProb = 1 - homeProb;

  return { homeProb, awayProb };
}

function createStarRating(probability) {
  const container = document.createElement("div");
  container.className = "star-rating";

  const value = typeof probability === "number" ? probability : 0.5;
  const rounded = Math.round(value * 5);

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.className = "star" + (i <= rounded ? " filled" : "");
    star.textContent = "★";
    container.appendChild(star);
  }

  const label = document.createElement("span");
  label.className = "star-label";
  label.textContent = `${Math.round(value * 100)}%`;
  container.appendChild(label);

  return container;
}

function makeFixtureKey(homeTeam, awayTeam) {
  return `${normaliseTeamName(homeTeam)}__${normaliseTeamName(awayTeam)}`;
}

function buildPickMap(rec) {
  const map = new Map();
  if (!rec || !Array.isArray(rec.topPicks)) return map;

  rec.topPicks.forEach((pick) => {
    const homeTeam = pick.home ? pick.teamName : pick.opponent;
    const awayTeam = pick.home ? pick.opponent : pick.teamName;
    const key = makeFixtureKey(homeTeam, awayTeam);
    map.set(key, pick);
  });

  return map;
}

function setStatus(message, pulse = false) {
  statusEl.textContent = message || "";
  statusEl.classList.toggle("status-pulse", !!pulse);
}

function setLoading(loading) {
  isLoading = loading;
  if (getBtn) {
    getBtn.disabled = loading;
  }
  document.body.classList.toggle("is-loading", loading);
}

function updateTeamCounter() {
  if (teamCounter) {
    const count = selectedTeams.size;
    const total = PREMIER_LEAGUE_TEAMS.length;
    teamCounter.textContent = `${count}/${total} used`;
  }
}

// ---- Fetch helpers ----
async function fetchFixtures(season, gameweek) {
  const url = `${apiBase}/fixtures?year=${season}&gameweek=${gameweek}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch fixtures: ${res.status} ${text}`);
  }
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.fixtures)) return data.fixtures;
  return [];
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
    throw new Error(`Failed to fetch recommendations: ${res.status} ${text}`);
  }

  return await res.json();
}

// ---- Rendering ----

function renderTeamGrid(teams) {
  if (!teams || teams.length === 0) {
    teamGrid.innerHTML =
      '<div class="team-grid-empty">No teams found for this round.</div>';
    return;
  }

  const sorted = [...teams].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  teamGrid.innerHTML = "";
  sorted.forEach((team, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "team-item";
    item.style.animationDelay = `${index * 0.02}s`;
    
    if (selectedTeams.has(team.name)) {
      item.classList.add("selected");
    }

    const badge = document.createElement("img");
    badge.className = "team-badge";
    badge.src = team.badge || getGenericBadge(team.name);
    badge.alt = team.name;

    const name = document.createElement("div");
    name.className = "team-name";
    name.textContent = team.name;

    const chip = document.createElement("div");
    chip.className = "team-used-chip";
    chip.textContent = "USED";

    item.appendChild(chip);
    item.appendChild(badge);
    item.appendChild(name);

    item.addEventListener("click", () => {
      if (selectedTeams.has(team.name)) {
        selectedTeams.delete(team.name);
        item.classList.remove("selected");
      } else {
        selectedTeams.add(team.name);
        item.classList.add("selected");
      }
      persistUsedTeams();
      updateTeamCounter();
      scheduleRefresh();
    });

    teamGrid.appendChild(item);
  });

  updateTeamCounter();
}

function renderFixtures(fixtures) {
  if (!fixtures || fixtures.length === 0) {
    fixturesListEl.innerHTML = '<p>No fixtures available for this round.</p>';
    fixturesCard.classList.remove("hidden");
    return;
  }

  // Group by date
  const byDate = new Map();
  fixtures.forEach((match) => {
    const kickoffDate = match.kickoff
      ? new Date(match.kickoff).toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      : "TBC";

    if (!byDate.has(kickoffDate)) {
      byDate.set(kickoffDate, []);
    }
    byDate.get(kickoffDate).push(match);
  });

  fixturesListEl.innerHTML = "";

  byDate.forEach((matches, dateLabel) => {
    const dateHeader = document.createElement("div");
    dateHeader.className = "date-header";
    dateHeader.textContent = dateLabel;
    fixturesListEl.appendChild(dateHeader);

    matches.forEach((match) => {
      const row = document.createElement("div");
      row.className = "fixture-row";

      const homeTeam = match.homeTeam;
      const awayTeam = match.awayTeam;
      const probabilities = estimateFixtureProb(homeTeam, awayTeam);

      const homeConfig = getTeamConfigByName(homeTeam);
      const awayConfig = getTeamConfigByName(awayTeam);

      const btn = document.createElement("button");
      btn.className = "fixture-row-clickable";
      btn.type = "button";

      const content = document.createElement("div");
      content.className = "fixture-content";

      const teamsContainer = document.createElement("div");
      teamsContainer.className = "fixture-teams-extended";

      // Home team block
      const homeBlock = document.createElement("div");
      homeBlock.className = "fixture-team-block home";

      const homeBadge = document.createElement("img");
      homeBadge.className = "fixture-badge";
      homeBadge.src = homeConfig ? homeConfig.badge : getGenericBadge(homeTeam);
      homeBadge.alt = homeTeam;

      const homeName = document.createElement("div");
      homeName.className = "fixture-team-name";
      homeName.textContent = homeTeam;

      const homeStars = createStarRating(probabilities.homeProb);

      homeBlock.appendChild(homeBadge);
      homeBlock.appendChild(homeName);
      homeBlock.appendChild(homeStars);

      // VS
      const vs = document.createElement("div");
      vs.className = "fixture-vs";
      vs.textContent = "VS";

      // Away team block
      const awayBlock = document.createElement("div");
      awayBlock.className = "fixture-team-block away";

      const awayBadge = document.createElement("img");
      awayBadge.className = "fixture-badge";
      awayBadge.src = awayConfig ? awayConfig.badge : getGenericBadge(awayTeam);
      awayBadge.alt = awayTeam;

      const awayName = document.createElement("div");
      awayName.className = "fixture-team-name";
      awayName.textContent = awayTeam;

      const awayStars = createStarRating(probabilities.awayProb);

      awayBlock.appendChild(awayBadge);
      awayBlock.appendChild(awayName);
      awayBlock.appendChild(awayStars);

      teamsContainer.appendChild(homeBlock);
      teamsContainer.appendChild(vs);
      teamsContainer.appendChild(awayBlock);

      const meta = document.createElement("div");
      meta.className = "fixture-meta";
      const timeText = match.kickoff
        ? new Date(match.kickoff).toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "TBC";
      meta.textContent = timeText;

      content.appendChild(teamsContainer);
      content.appendChild(meta);

      btn.appendChild(content);

      btn.addEventListener("click", () => {
        openTeamModal({
          title: `${homeTeam} vs ${awayTeam}`,
          fromFixture: match,
          fromPick: null,
        });
      });

      row.appendChild(btn);
      fixturesListEl.appendChild(row);
    });
  });

  fixturesCard.classList.remove("hidden");
}

function renderRecommendations(rec) {
  if (!rec || !Array.isArray(rec.topPicks) || rec.topPicks.length === 0) {
    topPicksCard.classList.add("hidden");
    strategicAdviceCard.classList.add("hidden");
    return;
  }

  currentRecommendations = rec;

  // Strategic advice
  if (rec.strategicAdvice) {
    strategicAdviceEl.textContent = rec.strategicAdvice;
    strategicAdviceCard.classList.remove("hidden");
  } else {
    strategicAdviceCard.classList.add("hidden");
  }

  // Top picks
  topPicksList.innerHTML = "";
  rec.topPicks.forEach((pick, index) => {
    const item = document.createElement("div");
    item.className = "pick-item";
    item.style.animationDelay = `${index * 0.1}s`;

    const header = document.createElement("div");
    header.className = "pick-header";

    const headerMain = document.createElement("div");
    headerMain.className = "pick-header-main";

    const rank = document.createElement("div");
    rank.className = `pick-rank rank-${index + 1}`;
    rank.textContent = `${index + 1}`;

    const teams = document.createElement("div");
    teams.className = "pick-teams";

    const homeTeam = pick.home ? pick.teamName : pick.opponent;
    const awayTeam = pick.home ? pick.opponent : pick.teamName;

    const homeConfig = getTeamConfigByName(homeTeam);
    const awayConfig = getTeamConfigByName(awayTeam);

    // Home team block
    const homeBlock = document.createElement("div");
    homeBlock.className = "pick-team-block";

    const homeBadge = document.createElement("img");
    homeBadge.className = "pick-team-badge";
    homeBadge.src = homeConfig ? homeConfig.badge : getGenericBadge(homeTeam);
    homeBadge.alt = homeTeam;

    const homeName = document.createElement("div");
    homeName.className = "pick-team-name";
    homeName.textContent = homeTeam;

    homeBlock.appendChild(homeBadge);
    homeBlock.appendChild(homeName);

    // VS
    const vs = document.createElement("div");
    vs.className = "pick-vs";
    vs.textContent = "VS";

    // Away team block
    const awayBlock = document.createElement("div");
    awayBlock.className = "pick-team-block";

    const awayBadge = document.createElement("img");
    awayBadge.className = "pick-team-badge";
    awayBadge.src = awayConfig ? awayConfig.badge : getGenericBadge(awayTeam);
    awayBadge.alt = awayTeam;

    const awayName = document.createElement("div");
    awayName.className = "pick-team-name";
    awayName.textContent = awayTeam;

    awayBlock.appendChild(awayBadge);
    awayBlock.appendChild(awayName);

    teams.appendChild(homeBlock);
    teams.appendChild(vs);
    teams.appendChild(awayBlock);

    headerMain.appendChild(rank);
    headerMain.appendChild(teams);
    header.appendChild(headerMain);

    const metaDiv = document.createElement("div");
    metaDiv.className = "pick-meta";

    // Win probability with icon
    const probDiv = document.createElement("div");
    probDiv.className = "win-probability";
    const probPercentage = document.createElement("span");
    probPercentage.className = "win-percentage";
    const prob = typeof pick.winProbability === "number"
      ? pick.winProbability
      : 0.5;
    probPercentage.textContent = `${Math.round(prob * 100)}%`;
    probDiv.appendChild(document.createTextNode("⚡ "));
    probDiv.appendChild(probPercentage);
    metaDiv.appendChild(probDiv);

    // Star rating
    const stars = createStarRating(prob);
    metaDiv.appendChild(stars);

    const score = document.createElement("span");
    score.className = "predicted-score";
    score.textContent = pick.predictedScore || "2-0";
    metaDiv.appendChild(score);

    const risk = document.createElement("span");
    risk.className = `badge ${pick.riskLevel || "medium"}`;
    risk.textContent = (pick.riskLevel || "medium").toUpperCase();
    metaDiv.appendChild(risk);

    const tier = inferTier(pick.teamName, pick.teamTier);
    const tierSpan = document.createElement("span");
    tierSpan.className = `team-tier-badge ${tier}`;
    tierSpan.textContent = tier.replace("-", " ").toUpperCase();
    metaDiv.appendChild(tierSpan);

    const reasoningDiv = document.createElement("div");
    reasoningDiv.className = "reasoning";
    reasoningDiv.textContent =
      pick.reasoning ||
      "Strong tactical pick for this gameweek based on current form and fixture difficulty.";

    item.appendChild(header);
    item.appendChild(metaDiv);
    item.appendChild(reasoningDiv);

    // Toggle expansion on click
    item.addEventListener("click", () => {
      item.classList.toggle("expanded");
    });

    topPicksList.appendChild(item);
  });

  topPicksCard.classList.remove("hidden");
}

// ---- Modal ----
function openTeamModal({ title, fromFixture, fromPick }) {
  if (!modalEl) return;

  modalTitleEl.textContent = title || "Team Details";
  modalBodyEl.innerHTML = "";

  if (fromPick) {
    const tier = fromPick.teamTier || inferTier(fromPick.teamName);
    const prob = typeof fromPick.winProbability === "number"
      ? fromPick.winProbability
      : 0.5;

    const block = document.createElement("div");
    block.className = "modal-section";

    const chipRow = document.createElement("div");
    chipRow.className = "modal-chip-row";

    const riskBadge = document.createElement("span");
    riskBadge.className = `badge ${fromPick.riskLevel || "medium"}`;
    riskBadge.textContent = (fromPick.riskLevel || "medium").toUpperCase() + " RISK";

    const tierBadge = document.createElement("span");
    tierBadge.className = `team-tier-badge ${tier}`;
    tierBadge.textContent = tier.replace("-", " ").toUpperCase();

    chipRow.appendChild(riskBadge);
    chipRow.appendChild(tierBadge);
    block.appendChild(chipRow);

    // Win probability with stars
    const probSection = document.createElement("div");
    probSection.className = "modal-section";
    probSection.style.display = "flex";
    probSection.style.alignItems = "center";
    probSection.style.gap = "12px";
    probSection.style.marginTop = "12px";

    const probLabel = document.createElement("strong");
    probLabel.textContent = "Win probability:";
    probSection.appendChild(probLabel);

    const stars = createStarRating(prob);
    probSection.appendChild(stars);

    block.appendChild(probSection);

    const fixtureText = document.createElement("p");
    fixtureText.className = "modal-text";
    fixtureText.innerHTML = `<strong>Fixture:</strong> ${fromPick.teamName} vs ${fromPick.opponent} ${
      fromPick.home ? "(home)" : "(away)"
    }`;
    block.appendChild(fixtureText);

    modalBodyEl.appendChild(block);

    if (fromPick.reasoning) {
      const reason = document.createElement("p");
      reason.className = "modal-text";
      reason.textContent = fromPick.reasoning;
      modalBodyEl.appendChild(reason);
    }
  }

  if (fromFixture) {
    const { homeTeam, awayTeam, kickoff } = fromFixture;
    const approx = estimateFixtureProb(homeTeam, awayTeam);

    const block = document.createElement("div");
    block.className = "modal-section";
    
    const dt =
      kickoff &&
      new Date(kickoff).toLocaleString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "short",
      });

    const homeText = document.createElement("p");
    homeText.className = "modal-text";
    homeText.innerHTML = `<strong>Home:</strong> ${homeTeam}`;
    block.appendChild(homeText);

    const homeStarsSection = document.createElement("div");
    homeStarsSection.style.display = "flex";
    homeStarsSection.style.alignItems = "center";
    homeStarsSection.style.gap = "8px";
    homeStarsSection.style.marginLeft = "12px";
    homeStarsSection.style.marginTop = "4px";
    const homeStars = createStarRating(approx.homeProb);
    homeStarsSection.appendChild(homeStars);
    block.appendChild(homeStarsSection);

    const awayText = document.createElement("p");
    awayText.className = "modal-text";
    awayText.style.marginTop = "12px";
    awayText.innerHTML = `<strong>Away:</strong> ${awayTeam}`;
    block.appendChild(awayText);

    const awayStarsSection = document.createElement("div");
    awayStarsSection.style.display = "flex";
    awayStarsSection.style.alignItems = "center";
    awayStarsSection.style.gap = "8px";
    awayStarsSection.style.marginLeft = "12px";
    awayStarsSection.style.marginTop = "4px";
    const awayStars = createStarRating(approx.awayProb);
    awayStarsSection.appendChild(awayStars);
    block.appendChild(awayStarsSection);

    const kickoffText = document.createElement("p");
    kickoffText.className = "modal-text";
    kickoffText.style.marginTop = "12px";
    kickoffText.innerHTML = `<strong>Kick-off:</strong> ${dt || "TBC"}`;
    block.appendChild(kickoffText);

    modalBodyEl.appendChild(block);
  }

  modalEl.classList.add("open");
}

function closeTeamModal() {
  if (!modalEl) return;
  modalEl.classList.remove("open");
}

if (modalEl) {
  const overlay = modalEl.querySelector(".modal-overlay");
  if (overlay) {
    overlay.addEventListener("click", closeTeamModal);
  }

  const closeBtns = modalEl.querySelectorAll("[data-close-modal]");
  closeBtns.forEach(btn => {
    btn.addEventListener("click", closeTeamModal);
  });
}

// ---- Strategy UI ----
function setStrategy(strategy) {
  if (!legacyStrategySelect) return;
  legacyStrategySelect.value = strategy;

  strategyButtons.forEach((btn) => {
    if (btn.dataset.strategyOption === strategy) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  let summaryText = "";
  switch (strategy) {
    case "conservative":
      summaryText = "Backs strong favourites for maximum safety";
      break;
    case "balanced":
      summaryText = "Mixes safety with smart team preservation";
      break;
    case "aggressive":
      summaryText = "Takes calculated risks to save elite teams";
      break;
  }
  if (strategySummary) {
    strategySummary.textContent = summaryText;
  }

  scheduleRefresh();
}

strategyButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const strategy = btn.dataset.strategyOption;
    setStrategy(strategy);
    localStorage.setItem("lms_strategy", strategy);
  });
});

// ---- Persistence ----
function persistUsedTeams() {
  try {
    const arr = Array.from(selectedTeams);
    localStorage.setItem("lms_usedTeams", JSON.stringify(arr));
  } catch (_) {}
}

function restoreUsedTeams() {
  try {
    const raw = localStorage.getItem("lms_usedTeams");
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) {
      selectedTeams = new Set(arr);
    }
  } catch (_) {}
}

// ---- Refresh orchestration ----
function scheduleRefresh() {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
  }
  refreshTimeout = setTimeout(() => {
    refreshTimeout = null;
    refreshData();
  }, 300);
}

async function refreshData() {
  if (isLoading) return;

  const season = seasonSelect.value;
  const gw = parseInt(gameweekInput.value, 10) || 1;
  const strategy = legacyStrategySelect.value;

  localStorage.setItem("lms_season", season);
  localStorage.setItem("lms_gameweek", gw.toString());

  setLoading(true);
  setStatus("Analyzing fixtures and generating AI recommendations…", true);

  try {
    const [fixtures, rec] = await Promise.all([
      fetchFixtures(season, gw),
      fetchRecommendations(season, gw, Array.from(selectedTeams), strategy),
    ]);

    currentFixtures = fixtures;
    pickMap = buildPickMap(rec);

    renderTeamGrid(buildTeamsFromFixtures(fixtures));
    renderFixtures(fixtures);
    renderRecommendations(rec);
    setStatus("");
  } catch (err) {
    console.error(err);
    setStatus("Failed to load data. Please check your connection and try again.", false);
  } finally {
    setLoading(false);
  }
}

// Build unique sorted team list from fixtures
function buildTeamsFromFixtures(fixtures) {
  const teamMap = new Map();

  fixtures.forEach((match) => {
    [match.homeTeam, match.awayTeam].forEach((teamName) => {
      if (!teamName || teamMap.has(teamName)) return;

      const matchedTeam = getTeamConfigByName(teamName);

      teamMap.set(teamName, {
        name: teamName,
        badge: matchedTeam ? matchedTeam.badge : getGenericBadge(teamName),
      });
    });
  });

  return Array.from(teamMap.values());
}

// ---- Boot ----
document.addEventListener("DOMContentLoaded", async () => {
  // Restore saved controls
  const savedSeason = localStorage.getItem("lms_season");
  const savedGameweek = localStorage.getItem("lms_gameweek");
  const savedStrategy = localStorage.getItem("lms_strategy");

  if (savedSeason) seasonSelect.value = savedSeason;
  if (savedGameweek) gameweekInput.value = savedGameweek;
  if (savedStrategy) {
    legacyStrategySelect.value = savedStrategy;
  }

  restoreUsedTeams();

  // Wire core control changes
  seasonSelect.addEventListener("change", scheduleRefresh);
  gameweekInput.addEventListener("change", scheduleRefresh);
  gameweekInput.addEventListener("blur", scheduleRefresh);

  if (getBtn) {
    getBtn.addEventListener("click", refreshData);
  }

  // Initial strategy UI state
  setStrategy(legacyStrategySelect.value || "balanced");

  // First load
  scheduleRefresh();
});
