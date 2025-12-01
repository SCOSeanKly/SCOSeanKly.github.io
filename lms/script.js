// ========================================
// LAST MAN STANDING - Premium UI Script
// Multi-league support & auto-round detection
// ========================================

const API_BASE = "https://lms-advisor.ske-d03.workers.dev/api";

// ---- League Configurations ----
const LEAGUES = {
  PL: {
    name: "Premier League",
    country: "England",
    maxRounds: 38,
    teams: [
      { name: "Arsenal", badge: "https://crests.football-data.org/57.png", tier: "elite" },
      { name: "Aston Villa", badge: "https://crests.football-data.org/58.png", tier: "strong" },
      { name: "Bournemouth", badge: "https://crests.football-data.org/1044.png", tier: "risky-mid" },
      { name: "Brentford", badge: "https://crests.football-data.org/402.png", tier: "safe-mid" },
      { name: "Brighton & Hove Albion", badge: "https://crests.football-data.org/397.png", tier: "safe-mid" },
      { name: "Chelsea", badge: "https://crests.football-data.org/61.png", tier: "strong" },
      { name: "Crystal Palace", badge: "https://crests.football-data.org/354.png", tier: "risky-mid" },
      { name: "Everton", badge: "https://crests.football-data.org/62.png", tier: "weak" },
      { name: "Fulham", badge: "https://crests.football-data.org/63.png", tier: "safe-mid" },
      { name: "Ipswich Town", badge: "https://crests.football-data.org/349.png", tier: "weak" },
      { name: "Leicester City", badge: "https://crests.football-data.org/338.png", tier: "weak" },
      { name: "Liverpool", badge: "https://crests.football-data.org/64.png", tier: "elite" },
      { name: "Manchester City", badge: "https://crests.football-data.org/65.png", tier: "elite" },
      { name: "Manchester United", badge: "https://crests.football-data.org/66.png", tier: "strong" },
      { name: "Newcastle United", badge: "https://crests.football-data.org/67.png", tier: "strong" },
      { name: "Nottingham Forest", badge: "https://crests.football-data.org/351.png", tier: "risky-mid" },
      { name: "Southampton", badge: "https://crests.football-data.org/340.png", tier: "weak" },
      { name: "Tottenham Hotspur", badge: "https://crests.football-data.org/73.png", tier: "strong" },
      { name: "West Ham United", badge: "https://crests.football-data.org/563.png", tier: "safe-mid" },
      { name: "Wolverhampton Wanderers", badge: "https://crests.football-data.org/76.png", tier: "risky-mid" },
    ],
    bigTeams: ["Arsenal", "Chelsea", "Liverpool", "Manchester City", "Manchester United", "Tottenham Hotspur"],
  },
  PD: {
    name: "La Liga",
    country: "Spain",
    maxRounds: 38,
    teams: [
      { name: "Athletic Club", badge: "https://crests.football-data.org/77.png", tier: "strong" },
      { name: "Atlético Madrid", badge: "https://crests.football-data.org/78.png", tier: "elite" },
      { name: "Barcelona", badge: "https://crests.football-data.org/81.png", tier: "elite" },
      { name: "Real Betis", badge: "https://crests.football-data.org/90.png", tier: "safe-mid" },
      { name: "Celta Vigo", badge: "https://crests.football-data.org/558.png", tier: "risky-mid" },
      { name: "Espanyol", badge: "https://crests.football-data.org/80.png", tier: "weak" },
      { name: "Getafe", badge: "https://crests.football-data.org/82.png", tier: "risky-mid" },
      { name: "Girona", badge: "https://crests.football-data.org/298.png", tier: "safe-mid" },
      { name: "Las Palmas", badge: "https://crests.football-data.org/275.png", tier: "weak" },
      { name: "Leganés", badge: "https://crests.football-data.org/745.png", tier: "weak" },
      { name: "Mallorca", badge: "https://crests.football-data.org/89.png", tier: "risky-mid" },
      { name: "Osasuna", badge: "https://crests.football-data.org/79.png", tier: "risky-mid" },
      { name: "Rayo Vallecano", badge: "https://crests.football-data.org/87.png", tier: "risky-mid" },
      { name: "Real Madrid", badge: "https://crests.football-data.org/86.png", tier: "elite" },
      { name: "Real Sociedad", badge: "https://crests.football-data.org/92.png", tier: "strong" },
      { name: "Sevilla", badge: "https://crests.football-data.org/559.png", tier: "safe-mid" },
      { name: "Valencia", badge: "https://crests.football-data.org/95.png", tier: "safe-mid" },
      { name: "Valladolid", badge: "https://crests.football-data.org/250.png", tier: "weak" },
      { name: "Villarreal", badge: "https://crests.football-data.org/94.png", tier: "strong" },
      { name: "Alavés", badge: "https://crests.football-data.org/263.png", tier: "weak" },
    ],
    bigTeams: ["Real Madrid", "Barcelona", "Atlético Madrid"],
  },
  BL1: {
    name: "Bundesliga",
    country: "Germany",
    maxRounds: 34,
    teams: [
      { name: "Bayern München", badge: "https://crests.football-data.org/5.png", tier: "elite" },
      { name: "Borussia Dortmund", badge: "https://crests.football-data.org/4.png", tier: "elite" },
      { name: "RB Leipzig", badge: "https://crests.football-data.org/721.png", tier: "strong" },
      { name: "Bayer Leverkusen", badge: "https://crests.football-data.org/3.png", tier: "elite" },
      { name: "Eintracht Frankfurt", badge: "https://crests.football-data.org/19.png", tier: "strong" },
      { name: "VfB Stuttgart", badge: "https://crests.football-data.org/10.png", tier: "strong" },
      { name: "VfL Wolfsburg", badge: "https://crests.football-data.org/11.png", tier: "safe-mid" },
      { name: "Borussia Mönchengladbach", badge: "https://crests.football-data.org/18.png", tier: "safe-mid" },
      { name: "SC Freiburg", badge: "https://crests.football-data.org/17.png", tier: "safe-mid" },
      { name: "1. FC Union Berlin", badge: "https://crests.football-data.org/28.png", tier: "risky-mid" },
      { name: "TSG Hoffenheim", badge: "https://crests.football-data.org/2.png", tier: "risky-mid" },
      { name: "1. FSV Mainz 05", badge: "https://crests.football-data.org/15.png", tier: "risky-mid" },
      { name: "FC Augsburg", badge: "https://crests.football-data.org/16.png", tier: "weak" },
      { name: "Werder Bremen", badge: "https://crests.football-data.org/12.png", tier: "risky-mid" },
      { name: "VfL Bochum", badge: "https://crests.football-data.org/36.png", tier: "weak" },
      { name: "1. FC Heidenheim", badge: "https://crests.football-data.org/44.png", tier: "weak" },
      { name: "FC St. Pauli", badge: "https://crests.football-data.org/20.png", tier: "weak" },
      { name: "Holstein Kiel", badge: "https://crests.football-data.org/720.png", tier: "weak" },
    ],
    bigTeams: ["Bayern München", "Borussia Dortmund", "Bayer Leverkusen"],
  },
  SA: {
    name: "Serie A",
    country: "Italy",
    maxRounds: 38,
    teams: [
      { name: "Inter", badge: "https://crests.football-data.org/108.png", tier: "elite" },
      { name: "Milan", badge: "https://crests.football-data.org/98.png", tier: "strong" },
      { name: "Juventus", badge: "https://crests.football-data.org/109.png", tier: "elite" },
      { name: "Napoli", badge: "https://crests.football-data.org/113.png", tier: "elite" },
      { name: "Roma", badge: "https://crests.football-data.org/100.png", tier: "strong" },
      { name: "Lazio", badge: "https://crests.football-data.org/110.png", tier: "strong" },
      { name: "Atalanta", badge: "https://crests.football-data.org/102.png", tier: "strong" },
      { name: "Fiorentina", badge: "https://crests.football-data.org/99.png", tier: "safe-mid" },
      { name: "Bologna", badge: "https://crests.football-data.org/103.png", tier: "safe-mid" },
      { name: "Torino", badge: "https://crests.football-data.org/586.png", tier: "safe-mid" },
      { name: "Udinese", badge: "https://crests.football-data.org/115.png", tier: "risky-mid" },
      { name: "Sassuolo", badge: "https://crests.football-data.org/471.png", tier: "risky-mid" },
      { name: "Monza", badge: "https://crests.football-data.org/5911.png", tier: "risky-mid" },
      { name: "Empoli", badge: "https://crests.football-data.org/445.png", tier: "weak" },
      { name: "Cagliari", badge: "https://crests.football-data.org/104.png", tier: "weak" },
      { name: "Verona", badge: "https://crests.football-data.org/454.png", tier: "weak" },
      { name: "Lecce", badge: "https://crests.football-data.org/5890.png", tier: "weak" },
      { name: "Genoa", badge: "https://crests.football-data.org/107.png", tier: "risky-mid" },
      { name: "Parma", badge: "https://crests.football-data.org/112.png", tier: "weak" },
      { name: "Venezia", badge: "https://crests.football-data.org/454.png", tier: "weak" },
    ],
    bigTeams: ["Inter", "Juventus", "Milan", "Napoli"],
  },
  FL1: {
    name: "Ligue 1",
    country: "France",
    maxRounds: 34,
    teams: [
      { name: "Paris Saint-Germain", badge: "https://crests.football-data.org/524.png", tier: "elite" },
      { name: "Monaco", badge: "https://crests.football-data.org/548.png", tier: "strong" },
      { name: "Marseille", badge: "https://crests.football-data.org/516.png", tier: "strong" },
      { name: "Lyon", badge: "https://crests.football-data.org/523.png", tier: "strong" },
      { name: "Lille", badge: "https://crests.football-data.org/521.png", tier: "strong" },
      { name: "Nice", badge: "https://crests.football-data.org/522.png", tier: "safe-mid" },
      { name: "Lens", badge: "https://crests.football-data.org/546.png", tier: "safe-mid" },
      { name: "Rennes", badge: "https://crests.football-data.org/529.png", tier: "safe-mid" },
      { name: "Strasbourg", badge: "https://crests.football-data.org/576.png", tier: "risky-mid" },
      { name: "Nantes", badge: "https://crests.football-data.org/543.png", tier: "risky-mid" },
      { name: "Reims", badge: "https://crests.football-data.org/547.png", tier: "risky-mid" },
      { name: "Montpellier", badge: "https://crests.football-data.org/518.png", tier: "risky-mid" },
      { name: "Toulouse", badge: "https://crests.football-data.org/511.png", tier: "risky-mid" },
      { name: "Brest", badge: "https://crests.football-data.org/512.png", tier: "safe-mid" },
      { name: "Le Havre", badge: "https://crests.football-data.org/538.png", tier: "weak" },
      { name: "Auxerre", badge: "https://crests.football-data.org/519.png", tier: "weak" },
      { name: "Angers", badge: "https://crests.football-data.org/532.png", tier: "weak" },
      { name: "Saint-Étienne", badge: "https://crests.football-data.org/527.png", tier: "weak" },
    ],
    bigTeams: ["Paris Saint-Germain", "Monaco", "Marseille"],
  },
  CL: {
    name: "Champions League",
    country: "Europe",
    maxRounds: 8,
    teams: [],
    bigTeams: [],
  },
};

// ---- DOM Elements ----
const elements = {
  competition: document.getElementById("competition"),
  season: document.getElementById("season"),
  gameweek: document.getElementById("gameweek"),
  getBtn: document.getElementById("getRecommendations"),
  autoRoundBadge: document.getElementById("autoRoundBadge"),
  statRound: document.getElementById("statRound"),
  statUsed: document.getElementById("statUsed"),
  statRemaining: document.getElementById("statRemaining"),
  progressRing: document.getElementById("progressRing"),
  progressText: document.getElementById("progressText"),
  teamGrid: document.getElementById("teamGrid"),
  clearTeams: document.getElementById("clearTeams"),
  selectElites: document.getElementById("selectElites"),
  status: document.getElementById("status"),
  strategicAdviceCard: document.getElementById("strategicAdviceCard"),
  strategicAdvice: document.getElementById("strategicAdvice"),
  topPicksCard: document.getElementById("topPicksCard"),
  topPicksList: document.getElementById("topPicksList"),
  fixturesCard: document.getElementById("fixturesCard"),
  fixturesHeader: document.getElementById("fixturesHeader"),
  fixturesList: document.getElementById("fixturesList"),
  modal: document.getElementById("teamModal"),
  modalTitle: document.getElementById("teamModalTitle"),
  modalBody: document.getElementById("teamModalBody"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  toastContainer: document.getElementById("toastContainer"),
};

// ---- State ----
let state = {
  competition: "PL",
  selectedTeams: new Set(),
  strategy: "balanced",
  currentFixtures: [],
  currentRecommendations: null,
  isLoading: false,
  dynamicTeams: [], // Teams discovered from fixtures
};

// ---- Utilities ----
function getCurrentLeague() {
  return LEAGUES[state.competition] || LEAGUES.PL;
}

function getTeams() {
  // Merge static teams with dynamic teams from fixtures, preferring dynamic (API) data
  const league = getCurrentLeague();
  const staticTeams = league.teams || [];
  
  // If no dynamic teams yet, return static
  if (state.dynamicTeams.length === 0) {
    return staticTeams;
  }
  
  // Create a map using normalized names as keys
  // Dynamic teams (from API) take priority as they have accurate crests
  const teamMap = new Map();
  
  // First add static teams
  staticTeams.forEach(t => {
    const key = normalizeTeamName(t.name);
    if (key && !teamMap.has(key)) {
      teamMap.set(key, t);
    }
  });
  
  // Then add/override with dynamic teams (API teams have correct crests)
  state.dynamicTeams.forEach(dt => {
    const key = normalizeTeamName(dt.name);
    if (key) {
      // Always prefer API data as it has the correct crest
      teamMap.set(key, dt);
    }
  });
  
  return Array.from(teamMap.values());
}

function getGenericBadge(teamName) {
  const encoded = encodeURIComponent(teamName || "Team");
  return `https://ui-avatars.com/api/?name=${encoded}&background=1e2433&color=f9fafb&rounded=true&size=64`;
}

function normalizeTeamName(name) {
  if (!name) return "";
  return name
    .toLowerCase()
    // Only strip common prefixes (AFC, FC at start)
    .replace(/^(afc|fc)\s+/i, '')
    // Only strip common suffixes (FC, AFC, etc. at end)
    .replace(/\s+(fc|afc|cf|sc|ac)$/i, '')
    // Standardize spacing
    .replace(/\s+/g, ' ')
    .trim();
}

function getTeamConfig(teamName) {
  if (!teamName) return null;
  const targetNorm = normalizeTeamName(teamName);
  
  // Check all teams (static + dynamic merged)
  const allTeams = getTeams();
  
  // Try exact normalized match first
  let found = allTeams.find(t => normalizeTeamName(t.name) === targetNorm);
  if (found) return found;
  
  // Try partial match
  found = allTeams.find(t => {
    const tNorm = normalizeTeamName(t.name);
    return tNorm.includes(targetNorm) || targetNorm.includes(tNorm);
  });
  
  return found || null;
}

function inferTier(teamName, existingTier) {
  if (existingTier) return existingTier;
  const config = getTeamConfig(teamName);
  return config?.tier || "risky-mid";
}

function getTierStrength(tier) {
  const strengths = { elite: 0.80, strong: 0.70, "safe-mid": 0.58, "risky-mid": 0.48, weak: 0.35 };
  return strengths[tier] || 0.48;
}

function estimateWinProbability(homeTeam, awayTeam) {
  const homeTier = inferTier(homeTeam);
  const awayTier = inferTier(awayTeam);
  const homeBase = getTierStrength(homeTier) + 0.08;
  const awayBase = getTierStrength(awayTier);
  const diff = homeBase - awayBase;
  let homeProb = 0.5 + diff * 0.65;
  homeProb = Math.min(0.92, Math.max(0.08, homeProb));
  return { homeProb, awayProb: 1 - homeProb };
}

function getRiskLevel(probability) {
  if (probability >= 0.65) return "safe";
  if (probability >= 0.50) return "medium";
  return "high";
}

function formatTierLabel(tier) {
  const labels = { elite: "Elite", strong: "Strong", "safe-mid": "Safe Mid", "risky-mid": "Risky Mid", weak: "Weak" };
  return labels[tier] || tier;
}

// ---- Toast System ----
function showToast(message, type = "info") {
  const icons = { success: "✓", error: "✕", info: "ℹ" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-message">${message}</span>`;
  elements.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("hiding");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---- Loading State ----
function setLoading(loading) {
  state.isLoading = loading;
  if (elements.getBtn) elements.getBtn.disabled = loading;
  if (elements.loadingOverlay) elements.loadingOverlay.classList.toggle("active", loading);
}

function setStatus(message) {
  if (elements.status) elements.status.textContent = message || "";
}

// ---- Stats Update ----
function updateStats() {
  const teams = getTeams();
  const used = state.selectedTeams.size;
  const total = teams.length || 20;
  const remaining = total - used;
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  
  if (elements.statRound) elements.statRound.textContent = elements.gameweek?.value || "-";
  if (elements.statUsed) elements.statUsed.textContent = used;
  if (elements.statRemaining) elements.statRemaining.textContent = remaining;
  if (elements.progressText) elements.progressText.textContent = `${percentage}%`;
  if (elements.progressRing) {
    const offset = 100 - percentage;
    elements.progressRing.style.strokeDashoffset = offset;
  }
}

// ---- Strategy Selection ----
function setStrategy(strategy) {
  state.strategy = strategy;
  document.querySelectorAll(".strategy-card").forEach((card) => {
    card.classList.toggle("active", card.dataset.strategy === strategy);
  });
  localStorage.setItem("lms_strategy", strategy);
}

// ---- Competition Change ----
function setCompetition(competition) {
  state.competition = competition;
  state.selectedTeams.clear();
  state.dynamicTeams = []; // Clear dynamic teams for new competition
  
  const league = getCurrentLeague();
  if (elements.gameweek) {
    elements.gameweek.max = league.maxRounds;
    if (parseInt(elements.gameweek.value) > league.maxRounds) {
      elements.gameweek.value = 1;
    }
  }
  
  localStorage.setItem("lms_competition", competition);
  
  // Restore teams for this competition
  try {
    const teamsData = JSON.parse(localStorage.getItem("lms_teams") || "{}");
    const savedTeams = teamsData[competition];
    if (Array.isArray(savedTeams)) {
      state.selectedTeams = new Set(savedTeams);
    }
  } catch (e) {}
  
  renderTeamGrid();
  updateStats();
  autoDetectCurrentRound();
}

// ---- Team Selection ----
function toggleTeam(teamName, element) {
  if (state.selectedTeams.has(teamName)) {
    state.selectedTeams.delete(teamName);
    element.classList.remove("selected");
  } else {
    state.selectedTeams.add(teamName);
    element.classList.add("selected");
  }
  persistState();
  updateStats();
}

function clearAllTeams() {
  state.selectedTeams.clear();
  document.querySelectorAll(".team-item.selected").forEach((item) => item.classList.remove("selected"));
  persistState();
  updateStats();
  showToast("All teams cleared", "success");
}

function selectBigTeams() {
  const league = getCurrentLeague();
  const bigTeamNames = league.bigTeams || [];
  const allTeams = getTeams();
  
  // Find matching teams using normalized names
  bigTeamNames.forEach(bigName => {
    const bigNorm = normalizeTeamName(bigName);
    const matchingTeam = allTeams.find(t => normalizeTeamName(t.name) === bigNorm);
    if (matchingTeam) {
      state.selectedTeams.add(matchingTeam.name);
    }
  });
  
  // Update UI
  document.querySelectorAll(".team-item").forEach(item => {
    const teamName = item.dataset.teamName;
    if (state.selectedTeams.has(teamName)) {
      item.classList.add("selected");
    }
  });
  
  persistState();
  updateStats();
  showToast(`Top teams marked as used`, "success");
}

function persistState() {
  try {
    const existing = JSON.parse(localStorage.getItem("lms_teams") || "{}");
    existing[state.competition] = [...state.selectedTeams];
    localStorage.setItem("lms_teams", JSON.stringify(existing));
  } catch (e) {}
}

function restoreState() {
  try {
    const savedComp = localStorage.getItem("lms_competition");
    if (savedComp && LEAGUES[savedComp]) {
      state.competition = savedComp;
      if (elements.competition) elements.competition.value = savedComp;
    }
    
    // Try new format first
    const teamsData = JSON.parse(localStorage.getItem("lms_teams") || "{}");
    const savedTeams = teamsData[state.competition];
    if (Array.isArray(savedTeams) && savedTeams.length > 0) {
      state.selectedTeams = new Set(savedTeams);
    } else {
      // Fallback to old format (lms_usedTeams) for backwards compatibility
      const oldTeams = JSON.parse(localStorage.getItem("lms_usedTeams") || "[]");
      if (Array.isArray(oldTeams) && oldTeams.length > 0) {
        state.selectedTeams = new Set(oldTeams);
        // Migrate to new format
        persistState();
        // Clear old format
        localStorage.removeItem("lms_usedTeams");
      }
    }
    
    const savedStrategy = localStorage.getItem("lms_strategy");
    if (savedStrategy) state.strategy = savedStrategy;
    
    const savedSeason = localStorage.getItem("lms_season");
    if (savedSeason && elements.season) elements.season.value = savedSeason;
  } catch (e) {
    console.warn("Failed to restore state:", e);
  }
}

// ---- Auto-detect Current Round ----
async function autoDetectCurrentRound() {
  try {
    const season = elements.season?.value || "2025";
    const competition = state.competition;
    const url = `${API_BASE}/preview?year=${season}&competition=${competition}`;
    const res = await fetch(url);
    
    if (!res.ok) return;
    
    const data = await res.json();
    const matchesByGw = data.matchesByGameweek || {};
    const now = new Date();
    let currentRound = 1;
    
    const gameweeks = Object.keys(matchesByGw).map(Number).sort((a, b) => a - b);
    
    // Also extract teams from preview data to populate the grid
    const allMatches = [];
    Object.values(matchesByGw).forEach(matches => {
      allMatches.push(...matches);
    });
    if (allMatches.length > 0) {
      updateTeamsFromFixtures(allMatches);
    }
    
    for (const gw of gameweeks) {
      const matches = matchesByGw[gw];
      const hasUpcoming = matches.some(m => {
        const kickoff = new Date(m.kickoff);
        return kickoff >= now || m.status === "SCHEDULED" || m.status === "TIMED" || m.status === "IN_PLAY";
      });
      const allFinished = matches.every(m => m.status === "FINISHED");
      
      if (hasUpcoming || !allFinished) {
        currentRound = gw;
        break;
      }
      currentRound = gw + 1;
    }
    
    const league = getCurrentLeague();
    currentRound = Math.min(Math.max(currentRound, 1), league.maxRounds);
    
    if (elements.gameweek) elements.gameweek.value = currentRound;
    if (elements.autoRoundBadge) elements.autoRoundBadge.style.display = "inline";
    
    updateStats();
  } catch (e) {
    console.warn("Auto-detect round failed:", e);
    if (elements.gameweek && !elements.gameweek.value) elements.gameweek.value = 1;
  }
}

// ---- API Calls ----
async function fetchFixtures(season, gameweek, competition) {
  const url = `${API_BASE}/fixtures?year=${season}&gameweek=${gameweek}&competition=${competition}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch fixtures: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.fixtures || []);
}

// Extract unique teams from fixtures and merge with known teams
function updateTeamsFromFixtures(fixtures) {
  if (!fixtures || fixtures.length === 0) return;
  
  const discoveredTeams = new Map();
  
  fixtures.forEach(match => {
    // Home team
    if (match.homeTeam && !discoveredTeams.has(match.homeTeam)) {
      discoveredTeams.set(match.homeTeam, {
        name: match.homeTeam,
        badge: match.homeCrest || getGenericBadge(match.homeTeam),
        tier: inferTierFromName(match.homeTeam),
      });
    }
    // Away team
    if (match.awayTeam && !discoveredTeams.has(match.awayTeam)) {
      discoveredTeams.set(match.awayTeam, {
        name: match.awayTeam,
        badge: match.awayCrest || getGenericBadge(match.awayTeam),
        tier: inferTierFromName(match.awayTeam),
      });
    }
  });
  
  state.dynamicTeams = Array.from(discoveredTeams.values());
  
  // Re-render the team grid with updated teams
  renderTeamGrid();
}

// Infer tier from team name (fallback for unknown teams)
function inferTierFromName(teamName) {
  const name = teamName.toLowerCase();
  
  // Elite teams - be specific
  if (name.includes('manchester city') || name.includes('man city')) return 'elite';
  if (name.includes('liverpool')) return 'elite';
  if (name.includes('arsenal')) return 'elite';
  if (name.includes('real madrid')) return 'elite';
  if (name.includes('barcelona') || name.includes('barça')) return 'elite';
  if (name.includes('bayern')) return 'elite';
  if (name.includes('paris') || name.includes('psg')) return 'elite';
  if (name.includes('inter')) return 'elite';
  if (name.includes('juventus')) return 'elite';
  if (name.includes('napoli')) return 'elite';
  if (name.includes('leverkusen')) return 'elite';
  
  // Strong teams
  if (name.includes('manchester united') || name.includes('man united') || name.includes('man utd')) return 'strong';
  if (name.includes('chelsea')) return 'strong';
  if (name.includes('tottenham') || name.includes('spurs')) return 'strong';
  if (name.includes('newcastle')) return 'strong';
  if (name.includes('aston villa') || name.includes('villa')) return 'strong';
  if (name.includes('atletico') || name.includes('atlético')) return 'strong';
  if (name.includes('dortmund')) return 'strong';
  if (name.includes('milan') && !name.includes('inter')) return 'strong';
  if (name.includes('roma')) return 'strong';
  if (name.includes('monaco')) return 'strong';
  if (name.includes('marseille')) return 'strong';
  if (name.includes('lyon')) return 'strong';
  
  // Safe mid teams
  if (name.includes('brighton')) return 'safe-mid';
  if (name.includes('brentford')) return 'safe-mid';
  if (name.includes('fulham')) return 'safe-mid';
  if (name.includes('west ham')) return 'safe-mid';
  if (name.includes('wolves') || name.includes('wolverhampton')) return 'safe-mid';
  if (name.includes('villarreal')) return 'safe-mid';
  if (name.includes('sevilla')) return 'safe-mid';
  if (name.includes('freiburg')) return 'safe-mid';
  if (name.includes('fiorentina')) return 'safe-mid';
  
  // Default to risky-mid for unknown teams
  return 'risky-mid';
}

async function fetchRecommendations(season, gameweek, usedTeams, strategy, competition) {
  const res = await fetch(`${API_BASE}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ year: season, gameweek, usedTeams, strategy, competition }),
  });
  if (!res.ok) throw new Error(`Failed to fetch recommendations: ${res.status}`);
  return res.json();
}

// ---- Rendering ----
function renderTeamGrid() {
  if (!elements.teamGrid) return;
  
  const teams = getTeams();
  
  if (teams.length === 0) {
    elements.teamGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 32px; color: var(--text-muted);">
        <p>Click "Get AI Recommendations" to load teams.</p>
      </div>
    `;
    updateStats();
    return;
  }
  
  const sorted = [...teams].sort((a, b) => a.name.localeCompare(b.name));
  elements.teamGrid.innerHTML = "";
  
  // Create a normalized map of selected teams for matching
  const normalizedSelectedMap = new Map();
  state.selectedTeams.forEach(t => {
    normalizedSelectedMap.set(normalizeTeamName(t), t);
  });
  
  sorted.forEach((team, index) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "team-item";
    item.dataset.teamName = team.name;
    item.style.animationDelay = `${index * 0.02}s`;
    
    // Check if selected using normalized comparison
    const teamNorm = normalizeTeamName(team.name);
    const isSelected = normalizedSelectedMap.has(teamNorm);
    
    if (isSelected) {
      item.classList.add("selected");
      // Migrate the selection to use the API team name
      const oldName = normalizedSelectedMap.get(teamNorm);
      if (oldName !== team.name) {
        state.selectedTeams.delete(oldName);
        state.selectedTeams.add(team.name);
      }
    }
    
    item.innerHTML = `
      <div class="team-used-chip">USED</div>
      <img class="team-badge" src="${team.badge}" alt="${team.name}" loading="lazy" onerror="this.src='${getGenericBadge(team.name)}'" />
      <div class="team-name">${team.name}</div>
    `;
    
    item.addEventListener("click", () => toggleTeam(team.name, item));
    elements.teamGrid.appendChild(item);
  });
  
  // Save any migrated team names
  persistState();
  updateStats();
}

function renderRecommendations(rec) {
  if (!rec || !Array.isArray(rec.topPicks) || rec.topPicks.length === 0) {
    elements.topPicksCard?.classList.add("hidden");
    elements.strategicAdviceCard?.classList.add("hidden");
    return;
  }
  
  state.currentRecommendations = rec;
  
  if (rec.strategicAdvice && elements.strategicAdvice && elements.strategicAdviceCard) {
    elements.strategicAdvice.textContent = rec.strategicAdvice;
    elements.strategicAdviceCard.classList.remove("hidden");
  } else {
    elements.strategicAdviceCard?.classList.add("hidden");
  }
  
  if (!elements.topPicksList || !elements.topPicksCard) return;
  elements.topPicksList.innerHTML = "";
  
  rec.topPicks.forEach((pick, index) => {
    const prob = typeof pick.winProbability === "number" ? pick.winProbability : 0.5;
    const riskLevel = pick.riskLevel || getRiskLevel(prob);
    const tier = inferTier(pick.teamName, pick.teamTier);
    const homeTeam = pick.home ? pick.teamName : pick.opponent;
    const awayTeam = pick.home ? pick.opponent : pick.teamName;
    const homeConfig = getTeamConfig(homeTeam);
    const awayConfig = getTeamConfig(awayTeam);
    const riskWidth = prob * 100;
    
    const card = document.createElement("div");
    card.className = "pick-card";
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
      <div class="pick-header">
        <div class="pick-rank rank-${index + 1}">${index + 1}</div>
        <div class="pick-matchup">
          <div class="pick-team">
            <img class="pick-team-badge" src="${homeConfig?.badge || getGenericBadge(homeTeam)}" alt="${homeTeam}" />
            <div class="pick-team-name">${homeTeam}</div>
          </div>
          <span class="pick-vs">VS</span>
          <div class="pick-team">
            <img class="pick-team-badge" src="${awayConfig?.badge || getGenericBadge(awayTeam)}" alt="${awayTeam}" />
            <div class="pick-team-name">${awayTeam}</div>
          </div>
        </div>
        <div class="pick-risk-indicator">
          <div class="risk-meter">
            <div class="risk-fill ${riskLevel}" style="width: ${riskWidth}%"></div>
          </div>
          <span class="risk-label ${riskLevel}">${riskLevel.toUpperCase()} RISK</span>
        </div>
      </div>
      <div class="pick-stats">
        <span class="stat-chip probability"><span>⚡</span><span>${Math.round(prob * 100)}% Win Chance</span></span>
        <span class="stat-chip score"><span>🎯</span><span>${pick.predictedScore || "2-0"}</span></span>
        <span class="stat-chip tier ${tier}">${formatTierLabel(tier)}</span>
      </div>
      <div class="pick-reasoning">${pick.reasoning || "Strong tactical pick based on current form and fixture difficulty."}</div>
      <div class="expand-hint">
        <span>Tap for details</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
      </div>
    `;
    
    card.addEventListener("click", () => card.classList.toggle("expanded"));
    elements.topPicksList.appendChild(card);
  });
  
  elements.topPicksCard.classList.remove("hidden");
}

function renderFixtures(fixtures) {
  if (!elements.fixturesList || !elements.fixturesCard) return;
  
  if (!fixtures || fixtures.length === 0) {
    elements.fixturesList.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 20px;">No fixtures available for this round.</p>';
    elements.fixturesCard.classList.remove("hidden");
    return;
  }
  
  const byDate = new Map();
  fixtures.forEach((match) => {
    const kickoffDate = match.kickoff
      ? new Date(match.kickoff).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      : "TBC";
    if (!byDate.has(kickoffDate)) byDate.set(kickoffDate, []);
    byDate.get(kickoffDate).push(match);
  });
  
  elements.fixturesList.innerHTML = "";
  
  byDate.forEach((matches, dateLabel) => {
    const dateHeader = document.createElement("div");
    dateHeader.className = "fixture-date-header";
    dateHeader.textContent = dateLabel;
    elements.fixturesList.appendChild(dateHeader);
    
    matches.forEach((match) => {
      const probs = estimateWinProbability(match.homeTeam, match.awayTeam);
      const homeConfig = getTeamConfig(match.homeTeam);
      const awayConfig = getTeamConfig(match.awayTeam);
      const row = document.createElement("div");
      row.className = "fixture-row";
      const timeText = match.kickoff
        ? new Date(match.kickoff).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
        : "TBC";
      
      row.innerHTML = `
        <button class="fixture-btn" type="button">
          <div class="fixture-content">
            <div class="fixture-teams">
              <div class="fixture-team-block home">
                <img class="fixture-team-badge" src="${homeConfig?.badge || getGenericBadge(match.homeTeam)}" alt="${match.homeTeam}" />
                <div class="fixture-team-info">
                  <div class="fixture-team-name">${match.homeTeam}</div>
                  <div class="fixture-prob">${Math.round(probs.homeProb * 100)}%</div>
                </div>
              </div>
              <span class="fixture-vs">VS</span>
              <div class="fixture-team-block away">
                <img class="fixture-team-badge" src="${awayConfig?.badge || getGenericBadge(match.awayTeam)}" alt="${match.awayTeam}" />
                <div class="fixture-team-info">
                  <div class="fixture-team-name">${match.awayTeam}</div>
                  <div class="fixture-prob">${Math.round(probs.awayProb * 100)}%</div>
                </div>
              </div>
            </div>
            <div class="fixture-time">${timeText}</div>
          </div>
        </button>
      `;
      
      row.querySelector(".fixture-btn").addEventListener("click", () => {
        openModal({ title: `${match.homeTeam} vs ${match.awayTeam}`, fixture: match });
      });
      elements.fixturesList.appendChild(row);
    });
  });
  
  elements.fixturesCard.classList.remove("hidden");
}

// ---- Modal ----
function openModal({ title, fixture }) {
  if (!elements.modal) return;
  elements.modalTitle.textContent = title || "Match Details";
  elements.modalBody.innerHTML = "";
  
  if (fixture) {
    const probs = estimateWinProbability(fixture.homeTeam, fixture.awayTeam);
    const homeConfig = getTeamConfig(fixture.homeTeam);
    const awayConfig = getTeamConfig(fixture.awayTeam);
    const homeTier = inferTier(fixture.homeTeam);
    const awayTier = inferTier(fixture.awayTeam);
    const kickoffDate = fixture.kickoff
      ? new Date(fixture.kickoff).toLocaleString("en-GB", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
      : "TBC";
    
    elements.modalBody.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
        <div style="text-align: center; flex: 1;">
          <img src="${homeConfig?.badge || getGenericBadge(fixture.homeTeam)}" alt="${fixture.homeTeam}" style="width: 64px; height: 64px; margin-bottom: 8px;" />
          <div style="font-weight: 700; margin-bottom: 4px;">${fixture.homeTeam}</div>
          <span class="stat-chip tier ${homeTier}" style="font-size: 0.7rem;">${formatTierLabel(homeTier)}</span>
        </div>
        <div style="text-align: center; padding: 0 16px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">VS</div>
          <div style="font-size: 0.7rem; color: var(--text-secondary);">${kickoffDate}</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <img src="${awayConfig?.badge || getGenericBadge(fixture.awayTeam)}" alt="${fixture.awayTeam}" style="width: 64px; height: 64px; margin-bottom: 8px;" />
          <div style="font-weight: 700; margin-bottom: 4px;">${fixture.awayTeam}</div>
          <span class="stat-chip tier ${awayTier}" style="font-size: 0.7rem;">${formatTierLabel(awayTier)}</span>
        </div>
      </div>
      <div style="background: var(--bg-elevated); border-radius: var(--radius-md); padding: 16px;">
        <div style="font-size: 0.8rem; font-weight: 600; color: var(--text-secondary); margin-bottom: 12px; text-transform: uppercase;">Win Probability</div>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
          <span style="font-size: 0.85rem; width: 80px;">${fixture.homeTeam.split(" ")[0]}</span>
          <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
            <div style="width: ${probs.homeProb * 100}%; height: 100%; background: var(--accent-primary); border-radius: 4px;"></div>
          </div>
          <span style="font-weight: 700; color: var(--accent-primary);">${Math.round(probs.homeProb * 100)}%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 0.85rem; width: 80px;">${fixture.awayTeam.split(" ")[0]}</span>
          <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; overflow: hidden;">
            <div style="width: ${probs.awayProb * 100}%; height: 100%; background: var(--text-muted); border-radius: 4px;"></div>
          </div>
          <span style="font-weight: 700; color: var(--text-secondary);">${Math.round(probs.awayProb * 100)}%</span>
        </div>
      </div>
    `;
  }
  
  elements.modal.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  if (!elements.modal) return;
  elements.modal.classList.remove("open");
  document.body.style.overflow = "";
}

// ---- Main Data Fetch ----
async function refreshData() {
  if (state.isLoading) return;
  
  const season = elements.season?.value || "2025";
  const gameweek = parseInt(elements.gameweek?.value, 10) || 1;
  const competition = state.competition;
  
  localStorage.setItem("lms_season", season);
  localStorage.setItem("lms_gameweek", gameweek.toString());
  
  if (elements.autoRoundBadge) elements.autoRoundBadge.style.display = "none";
  
  setLoading(true);
  setStatus("");
  
  elements.topPicksCard?.classList.add("hidden");
  elements.strategicAdviceCard?.classList.add("hidden");
  elements.fixturesCard?.classList.add("hidden");
  
  try {
    // Fetch fixtures first
    const fixtures = await fetchFixtures(season, gameweek, competition);
    state.currentFixtures = fixtures;
    
    // Update team grid with teams from fixtures (this handles promoted/relegated teams)
    updateTeamsFromFixtures(fixtures);
    
    // Now fetch recommendations
    const recommendations = await fetchRecommendations(season, gameweek, [...state.selectedTeams], state.strategy, competition);
    
    renderFixtures(fixtures);
    renderRecommendations(recommendations);
    showToast("Recommendations updated!", "success");
  } catch (err) {
    console.error("Error fetching data:", err);
    setStatus("Failed to load data. Please check your connection and try again.");
    showToast("Failed to fetch data", "error");
  } finally {
    setLoading(false);
  }
}

// ---- Event Listeners ----
function setupEventListeners() {
  elements.getBtn?.addEventListener("click", refreshData);
  elements.competition?.addEventListener("change", (e) => setCompetition(e.target.value));
  
  document.querySelectorAll(".strategy-card").forEach((card) => {
    card.addEventListener("click", () => setStrategy(card.dataset.strategy));
  });
  
  document.querySelectorAll(".num-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const input = elements.gameweek;
      if (!input) return;
      let value = parseInt(input.value, 10) || 1;
      const max = parseInt(input.max) || 38;
      const action = btn.dataset.action;
      if (action === "increment" && value < max) input.value = value + 1;
      else if (action === "decrement" && value > 1) input.value = value - 1;
      if (elements.autoRoundBadge) elements.autoRoundBadge.style.display = "none";
      updateStats();
    });
  });
  
  elements.gameweek?.addEventListener("change", () => {
    if (elements.autoRoundBadge) elements.autoRoundBadge.style.display = "none";
    updateStats();
  });
  
  elements.clearTeams?.addEventListener("click", clearAllTeams);
  elements.selectElites?.addEventListener("click", selectBigTeams);
  elements.fixturesHeader?.addEventListener("click", () => elements.fixturesCard?.classList.toggle("collapsed"));
  
  document.querySelectorAll("[data-close-modal]").forEach((btn) => btn.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}

// ---- Initialization ----
async function init() {
  restoreState();
  if (elements.competition) elements.competition.value = state.competition;
  setStrategy(state.strategy);
  renderTeamGrid();
  setupEventListeners();
  updateStats();
  await autoDetectCurrentRound();
  setStatus("Configure your settings and tap 'Get AI Recommendations' to start.");
}

document.addEventListener("DOMContentLoaded", init);
