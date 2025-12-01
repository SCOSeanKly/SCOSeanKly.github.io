// worker.js - Updated to support multiple leagues and competitions

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Competition codes for football-data.org
const COMPETITIONS = {
  PL: { name: "Premier League", code: "PL" },
  PD: { name: "La Liga", code: "PD" },
  BL1: { name: "Bundesliga", code: "BL1" },
  SA: { name: "Serie A", code: "SA" },
  FL1: { name: "Ligue 1", code: "FL1" },
  CL: { name: "Champions League", code: "CL" },
};

const SYSTEM_PROMPT = `
You are an expert assistant for "Last Man Standing" football predictions with deep tactical understanding.

GAME RULES:
- Each gameweek the user chooses ONE team that must WIN
- If the team draws or loses, they are eliminated
- They cannot pick the same team twice all season
- The season length varies by competition

CRITICAL STRATEGIC PRINCIPLES:
1. EARLY SEASON (First third of season): Avoid using elite/top teams unless absolutely necessary. Save them for difficult later gameweeks.
2. MID SEASON (Middle third): Use mid-tier strong teams. Only use top teams if fixtures are extremely favorable.
3. LATE SEASON (Final third): Now deploy your saved top teams strategically as options narrow.

TEAM TIER SYSTEM (applies to all leagues):
- Elite Tier: Top 2-3 teams in the league (save for late season)
- Strong Tier: Teams typically in top 6-8 (save for mid-late season)
- Safe Mid Tier: Solid mid-table teams (good for early-mid season)
- Risky Mid Tier: Lower mid-table teams (use when home vs weak opposition)
- Weak Tier: Bottom teams (only use if home vs another weak team)

USER STRATEGY INPUT:
The user will specify their risk tolerance:
- "conservative": Only recommend very safe picks (70%+ win probability), prioritize saving elite teams
- "balanced": Mix of safety and team preservation (60%+ win probability)
- "aggressive": Willing to take risks to save strong teams for later (50%+ win probability)

YOUR TASK:
Given fixtures, used teams, current gameweek, and strategy:
1. Recommend TOP 3 teams that must WIN this week
2. Consider which gameweek we're in - are we early, mid, or late season?
3. If early/mid season, heavily penalize recommendations that use elite teams
4. Prefer home teams when possible (higher win probability)
5. Check team form and opponent strength
6. Never recommend teams from usedTeams list
7. Provide predicted score based on team strength differential

RESPONSE FORMAT:
You must respond with ONLY valid JSON, no markdown, no code blocks, no explanation text.

{
  "topPicks": [
    {
      "teamName": "string",
      "opponent": "string", 
      "home": boolean,
      "kickoff": "ISO date string",
      "winProbability": number between 0 and 1,
      "riskLevel": "safe" or "medium" or "high",
      "predictedScore": "string like 2-0",
      "reasoning": "Explain why this pick makes sense strategically for this gameweek",
      "teamTier": "elite" or "strong" or "safe-mid" or "risky-mid" or "weak"
    }
  ],
  "strategicAdvice": "Overall advice about team preservation for remaining gameweeks"
}

Return exactly 3 recommendations in topPicks array, ordered from best to worst strategic value.
Consider both immediate win probability AND long-term team preservation.
Do not include any text outside the JSON object.
`;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (url.pathname === "/api/recommendations" && request.method === "POST") {
      return handleRecommendations(request, env);
    }

    if (url.pathname === "/api/fixtures" && request.method === "GET") {
      return handleFixtures(request, env);
    }

    if (url.pathname === "/api/preview" && request.method === "GET") {
      return handlePreview(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleFixtures(request, env) {
  const url = new URL(request.url);
  const gameweek = url.searchParams.get("gameweek") || "1";
  const year = url.searchParams.get("year") || "2025";
  const competition = url.searchParams.get("competition") || "PL";

  try {
    const fixtures = await fetchFixturesFromFootballData({
      matchday: parseInt(gameweek),
      year: year,
      competition: competition,
      apiKey: env.FOOTBALL_DATA_API_KEY,
    });

    return jsonResponse({ fixtures });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

async function handlePreview(request, env) {
  try {
    const url = new URL(request.url);
    const year = url.searchParams.get("year") || "2025";
    const competition = url.searchParams.get("competition") || "PL";
    
    const headers = {
      "X-Auth-Token": env.FOOTBALL_DATA_API_KEY,
    };

    const apiUrl = `https://api.football-data.org/v4/competitions/${competition}/matches?season=${year}`;
    const res = await fetch(apiUrl, { headers });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Football Data API error: ${text}`);
    }

    const json = await res.json();
    const matches = json.matches || [];

    const matchesByGameweek = {};
    matches.forEach((m) => {
      const gw = m.matchday;
      if (!matchesByGameweek[gw]) {
        matchesByGameweek[gw] = [];
      }
      matchesByGameweek[gw].push({
        id: m.id,
        homeTeam: m.homeTeam.name,
        awayTeam: m.awayTeam.name,
        kickoff: m.utcDate,
        status: m.status,
        homeScore: m.score.fullTime.home,
        awayScore: m.score.fullTime.away,
        homeCrest: m.homeTeam.crest,
        awayCrest: m.awayTeam.crest,
      });
    });

    const gameweeks = Object.keys(matchesByGameweek).sort((a, b) => parseInt(a) - parseInt(b));
    const competitionInfo = COMPETITIONS[competition] || { name: competition };

    return jsonResponse({
      season: `${year}-${parseInt(year) + 1}`,
      year: year,
      competition: competitionInfo.name,
      competitionCode: competition,
      totalMatches: matches.length,
      gameweeks: gameweeks,
      matchesByGameweek,
    });
  } catch (err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

async function handleRecommendations(request, env) {
  try {
    const body = await request.json();
    const gameweek = String(body.gameweek || "1");
    const year = String(body.year || "2025");
    const usedTeams = Array.isArray(body.usedTeams) ? body.usedTeams : [];
    const strategy = body.strategy || "balanced";
    const competition = body.competition || "PL";

    const fixtures = await fetchFixturesFromFootballData({
      matchday: parseInt(gameweek),
      year: year,
      competition: competition,
      apiKey: env.FOOTBALL_DATA_API_KEY,
    });

    const competitionInfo = COMPETITIONS[competition] || { name: competition };
    
    // Determine season length based on competition
    let totalGameweeks = 38;
    if (competition === "BL1" || competition === "FL1") {
      totalGameweeks = 34;
    } else if (competition === "CL") {
      totalGameweeks = 8;
    }

    const payload = {
      gameweek: parseInt(gameweek),
      year,
      usedTeams,
      fixtures,
      strategy,
      competition: competitionInfo.name,
      competitionCode: competition,
      totalGameweeks: totalGameweeks,
    };

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(payload) },
        ],
        temperature: 0.2,
        max_tokens: 2500,
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      console.error("OpenAI error:", text);
      return jsonResponse(
        { error: "OpenAI API error", details: text },
        500
      );
    }

    const data = await openaiRes.json();
    let content = data.choices[0]?.message?.content || "{}";
    
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    return new Response(content, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    return jsonResponse(
      { error: "Failed to build recommendations", details: String(err) },
      500
    );
  }
}

async function fetchFixturesFromFootballData({ matchday, year, competition, apiKey }) {
  const headers = {
    "X-Auth-Token": apiKey,
  };

  const url = `https://api.football-data.org/v4/competitions/${competition}/matches?season=${year}&matchday=${matchday}`;

  const res = await fetch(url, { headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Football Data API error: ${text}`);
  }

  const json = await res.json();
  const matches = json.matches || [];

  const fixtures = matches.map((m) => ({
    id: m.id,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    kickoff: m.utcDate,
    status: m.status,
    homeScore: m.score.fullTime.home,
    awayScore: m.score.fullTime.away,
    homeCrest: m.homeTeam.crest,
    awayCrest: m.awayTeam.crest,
  }));

  return fixtures;
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
