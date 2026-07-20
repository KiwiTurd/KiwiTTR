export type PlayCardPlayer = {
  name: string;
  club: string;
  ttr: number | string;
};

type PlayCardOptions = {
  eventName: string;
  matchName: string;
  table?: number | string;
  sideOne: PlayCardPlayer[];
  sideTwo: PlayCardPlayer[];
};

type PoolLineupOptions = {
  eventName: string;
  poolName: string;
  table?: number;
  players: PlayCardPlayer[];
  matches: Array<{
    round: number;
    playerOneNumber: number;
    playerTwoNumber: number;
    sideOne: string;
    sideTwo: string;
    table?: number;
  }>;
};

type TeamGameSheetOptions = {
  eventName: string;
  date: string;
  venue?: string;
  home: {
    name: string;
    club: string;
    players: PlayCardPlayer[];
  };
  away: {
    name: string;
    club: string;
    players: PlayCardPlayer[];
  };
  matches: Array<{
    order: number;
    label: string;
    sideOne: string;
    sideTwo: string;
    sets: Array<{ sideOne: number; sideTwo: number }>;
    winner?: "home" | "away" | null;
    countsForTeamScore?: boolean;
  }>;
};

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function playerRows(players: PlayCardPlayer[]) {
  return players.map((player) => `
    <div class="player">
      <strong>${escapeHtml(player.name)}</strong>
      <span>${escapeHtml(player.club || "Club not listed")}</span>
      <span>${escapeHtml(player.ttr)} TTR</span>
    </div>
  `).join("");
}

function fileName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "match";
}

function downloadHtml(html: string, name: string) {
  const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function downloadPlayCard({
  eventName,
  matchName,
  table,
  sideOne,
  sideTwo,
}: PlayCardOptions) {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(eventName)} - ${escapeHtml(matchName)}</title>
  <style>
    @page { size: A4 portrait; margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
    .card {
      display: flex;
      width: 97mm;
      height: 140.5mm;
      flex-direction: column;
      overflow: hidden;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      padding: 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .eyebrow { color: #475569; font-size: 7px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
    h1 { max-height: 2.4em; margin: 3px 0 0; overflow: hidden; font-size: 16px; line-height: 1.2; }
    h2 { margin: 2px 0 8px; overflow: hidden; color: #475569; font-size: 10px; text-overflow: ellipsis; white-space: nowrap; }
    .sides { display: grid; grid-template-columns: minmax(0,1fr) 22px minmax(0,1fr); gap: 5px; align-items: center; }
    .versus { text-align: center; color: #64748b; font-size: 9px; font-weight: 700; }
    .side { min-width: 0; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; }
    .side-title { padding: 4px 6px; background: #f1f5f9; font-size: 7px; font-weight: 700; text-transform: uppercase; }
    .player { display: grid; min-width: 0; gap: 1px; padding: 5px 6px; border-top: 1px solid #e2e8f0; }
    .player strong { overflow-wrap: anywhere; font-size: 9px; line-height: 1.15; }
    .player span { overflow: hidden; color: #475569; font-size: 7px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
    table { width: 100%; margin-top: 9px; border-collapse: collapse; table-layout: fixed; }
    th, td { height: 27px; border: 1px solid #94a3b8; text-align: center; font-size: 9px; }
    th { height: 20px; background: #f1f5f9; font-size: 7px; text-transform: uppercase; }
    .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
    .line { padding-top: 12px; border-bottom: 1px solid #0f172a; color: #475569; font-size: 7px; }
  </style>
</head>
<body>
  <main class="card">
    <div class="eyebrow">KiwiTTR Play Card</div>
    <h1>${escapeHtml(eventName)}</h1>
    <h2>${escapeHtml(matchName)}</h2>
    <div class="sides">
      <section class="side"><div class="side-title">Player 1</div>${playerRows(sideOne)}</section>
      <div class="versus">VS</div>
      <section class="side"><div class="side-title">Player 2</div>${playerRows(sideTwo)}</section>
    </div>
    <table>
      <thead><tr><th>Set</th><th>Player 1</th><th>Player 2</th></tr></thead>
      <tbody>${Array.from({ length: 5 }, (_, index) => `<tr><td>${index + 1}</td><td></td><td></td></tr>`).join("")}</tbody>
    </table>
    <div class="footer"><div class="line">Winner</div><div class="line">Table${table !== undefined && table !== "" ? `: <strong>${escapeHtml(table)}</strong>` : ""}</div></div>
  </main>
</body>
</html>`;
  downloadHtml(
    html,
    `${fileName(eventName)}-${fileName(matchName)}-play-card.html`
  );
}

export function downloadPoolLineup({
  eventName,
  poolName,
  table,
  players,
  matches,
}: PoolLineupOptions) {
  const roundNumbers = [...new Set(matches.map((match) => match.round))];
  const roundColumns = roundNumbers.length > 12 ? 5 : roundNumbers.length > 8 ? 4 : roundNumbers.length > 4 ? 3 : 2;
  const compact = players.length > 10 || matches.length > 50;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(eventName)} - ${escapeHtml(poolName)}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; }
    .sheet { width: 100%; page-break-inside: avoid; }
    .eyebrow { color: #475569; font-size: 9px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .heading { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
    h1 { margin: 3px 0 0; font-size: 20px; }
    h2 { margin: 2px 0 7px; color: #475569; font-size: 13px; }
    .table-number { min-width: 78px; padding: 7px 10px; border: 2px solid #0f172a; border-radius: 6px; text-align: center; }
    .table-number span { display: block; font-size: 7px; font-weight: 700; text-transform: uppercase; }
    .table-number strong { display: block; margin-top: 2px; font-size: 17px; }
    .section-title { margin: 7px 0 3px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #94a3b8; text-align: center; }
    th { background: #e2e8f0; font-weight: 700; }
    .matrix { font-size: ${compact ? "6px" : "8px"}; }
    .matrix th, .matrix td { height: ${compact ? "13px" : "18px"}; padding: 1px 2px; }
    .matrix .number { width: 22px; }
    .matrix .player-name { width: ${compact ? "165px" : "235px"}; text-align: left; }
    .matrix .player-name strong { display: block; }
    .matrix .player-name span { display: block; margin-top: 1px; color: #475569; font-size: .9em; }
    .wl { color: #94a3b8; font-size: ${compact ? "5px" : "7px"}; }
    .bye { background: linear-gradient(to bottom right, transparent calc(50% - .7px), #64748b 50%, transparent calc(50% + .7px)); }
    .rounds { display: grid; grid-template-columns: repeat(${roundColumns}, minmax(0,1fr)); gap: 5px; align-items: start; }
    .round { break-inside: avoid; border: 1px solid #64748b; border-radius: 3px; overflow: hidden; }
    .round-title { padding: 3px 4px; background: #cbd5e1; font-size: ${compact ? "6px" : "8px"}; font-weight: 700; text-transform: uppercase; }
    .games { font-size: ${compact ? "5px" : "7px"}; }
    .games th, .games td { height: ${compact ? "12px" : "17px"}; padding: 1px; }
    .games .fixture { width: 45%; text-align: left; padding-left: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .footer { margin-top: 4px; color: #64748b; font-size: 6px; }
  </style>
</head>
<body>
  <main class="sheet">
    <div class="eyebrow">KiwiTTR Rotated Pool Line-up</div>
    <div class="heading">
      <div><h1>${escapeHtml(eventName)}</h1><h2>${escapeHtml(poolName)} · ${matches.length} matches</h2></div>
      <div class="table-number"><span>Table</span><strong>${escapeHtml(table ?? "____")}</strong></div>
    </div>
    <div class="section-title">Player round record — write W or L after each round</div>
    <table class="matrix">
      <thead><tr><th class="number">#</th><th class="player-name">Player / Club / TTR</th>${roundNumbers.map((round) => `<th>R${round}</th>`).join("")}</tr></thead>
      <tbody>
        ${players.map((player, index) => {
          const playerNumber = index + 1;
          const roundCells = roundNumbers.map((round) => {
            const isPlaying = matches.some((match) =>
              match.round === round &&
              (match.playerOneNumber === playerNumber || match.playerTwoNumber === playerNumber)
            );
            return isPlaying
              ? `<td class="wl">W / L</td>`
              : `<td class="bye" aria-label="Bye"></td>`;
          }).join("");
          return `<tr><td>${playerNumber}</td><td class="player-name"><strong>${escapeHtml(player.name)}</strong><span>${escapeHtml(player.club)} · ${escapeHtml(player.ttr)} TTR</span></td>${roundCells}</tr>`;
        }).join("")}
      </tbody>
    </table>
    <div class="section-title">Games and set scores</div>
    <section class="rounds">
      ${roundNumbers.map((round) => {
        const roundMatches = matches.filter((match) => match.round === round);
        return `<div class="round">
          <div class="round-title">Round ${round}</div>
          <table class="games">
            <thead><tr><th class="fixture">Game</th><th>S1</th><th>S2</th><th>S3</th><th>S4</th><th>S5</th></tr></thead>
            <tbody>${roundMatches.map((match) => `<tr><td class="fixture">${match.playerOneNumber} ${escapeHtml(match.sideOne)} v ${match.playerTwoNumber} ${escapeHtml(match.sideTwo)}</td><td></td><td></td><td></td><td></td><td></td></tr>`).join("")}</tbody>
          </table>
        </div>`;
      }).join("")}
    </section>
    <div class="footer">Table ${escapeHtml(table ?? "____")} · Enter each set score from the first-named player's perspective.</div>
  </main>
</body>
</html>`;

  downloadHtml(
    html,
    `${fileName(eventName)}-${fileName(poolName)}-rotated-lineup.html`
  );
}

export function downloadTeamGameSheet({
  eventName,
  date,
  venue,
  home,
  away,
  matches,
}: TeamGameSheetOptions) {
  const orderedMatches = [...matches].sort((a, b) => a.order - b.order);
  const scoringMatches = orderedMatches.filter(
    (match) => match.countsForTeamScore !== false
  );
  const completedScoringMatches = scoringMatches.filter((match) => match.winner);
  const homeWins = completedScoringMatches.filter(
    (match) => match.winner === "home"
  ).length;
  const awayWins = completedScoringMatches.filter(
    (match) => match.winner === "away"
  ).length;
  const isComplete =
    scoringMatches.length > 0 &&
    completedScoringMatches.length === scoringMatches.length;
  const winner = isComplete
    ? homeWins > awayWins
      ? home.club
      : awayWins > homeWins
        ? away.club
        : "Draw"
    : "";

  const lineupRows = (players: PlayCardPlayer[]) =>
    players.map((player, index) => `<tr>
      <td class="position">${index + 1}</td>
      <td class="lineup-player"><strong>${escapeHtml(player.name)}</strong><span>${escapeHtml(player.club || "Club not listed")}</span></td>
      <td>${escapeHtml(player.ttr)}</td>
    </tr>`).join("");

  const matchRows = orderedMatches.map((match) => {
    const setCells = Array.from({ length: 5 }, (_, index) => {
      const set = match.sets[index];
      return `<td class="set-score">${set ? `${escapeHtml(set.sideOne)}–${escapeHtml(set.sideTwo)}` : ""}</td>`;
    }).join("");
    const homeSetWins = match.sets.filter(
      (set) => set.sideOne > set.sideTwo
    ).length;
    const awaySetWins = match.sets.filter(
      (set) => set.sideTwo > set.sideOne
    ).length;
    const overallSets = match.sets.length
      ? `${homeSetWins}–${awaySetWins}`
      : "";

    return `<tr>
      <td class="order">${match.order}</td>
      <td class="match"><strong>${escapeHtml(match.label)}</strong><span>${escapeHtml(match.sideOne)} v ${escapeHtml(match.sideTwo)}</span></td>
      ${setCells}
      <td class="overall-score">${overallSets}</td>
    </tr>`;
  }).join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(eventName)} - Team Game Scoresheet</title>
  <style>
    @page { size: A4 portrait; margin: 9mm; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #0f172a; font-size: 9px; }
    .sheet { width: 100%; }
    .eyebrow { color: #475569; font-size: 8px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    .heading { display: flex; justify-content: space-between; gap: 18px; margin-bottom: 7px; }
    h1 { margin: 3px 0 0; font-size: 20px; }
    .details { margin-top: 3px; color: #475569; font-size: 9px; }
    .fixture { min-width: 210px; padding: 7px 10px; border: 2px solid #0f172a; text-align: center; }
    .fixture strong { display: block; font-size: 13px; }
    .fixture span { display: block; margin-top: 2px; color: #475569; }
    .lineups { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px; }
    .team-title { padding: 4px 6px; border: 1px solid #64748b; border-bottom: 0; background: #cbd5e1; font-size: 10px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    th, td { border: 1px solid #94a3b8; text-align: center; }
    th { padding: 3px; background: #e2e8f0; font-size: 7px; text-transform: uppercase; }
    .lineup-table td { height: 19px; padding: 2px 4px; }
    .position { width: 32px; font-weight: 700; }
    .lineup-player { text-align: left; }
    .lineup-player strong, .lineup-player span { display: inline; }
    .lineup-player span { margin-left: 5px; color: #475569; font-size: 7px; }
    .lineup-table th:last-child { width: 52px; }
    .section-title { margin: 5px 0 3px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .matches thead { display: table-header-group; }
    .matches tr { break-inside: avoid; page-break-inside: avoid; }
    .matches td { height: 23px; padding: 2px; }
    .matches .order { width: 28px; font-weight: 700; }
    .matches .match { width: 195px; padding-left: 5px; text-align: left; }
    .matches .match strong { display: inline-block; min-width: 52px; font-size: 7px; text-transform: uppercase; }
    .matches .match span { font-size: 8px; }
    .set-score { width: 43px; font-size: 10px; font-weight: 700; }
    .overall-score { width: 48px; font-size: 11px; font-weight: 700; }
    .summary { display: grid; grid-template-columns: 1fr 1fr 1.15fr; gap: 8px; margin-top: 9px; break-inside: avoid; page-break-inside: avoid; }
    .summary-box { min-height: 48px; padding: 6px; border: 2px solid #0f172a; }
    .summary-box span { display: block; color: #475569; font-size: 7px; font-weight: 700; text-transform: uppercase; }
    .summary-box strong { display: block; margin-top: 7px; font-size: 15px; text-align: center; }
    .winner strong { border-bottom: 1px solid #0f172a; }
    .footer { margin-top: 5px; color: #64748b; font-size: 6px; }
  </style>
</head>
<body>
  <main class="sheet">
    <div class="eyebrow">KiwiTTR Team Game Scoresheet</div>
    <div class="heading">
      <div>
        <h1>${escapeHtml(eventName)}</h1>
        <div class="details">${escapeHtml(date)}${venue ? ` · ${escapeHtml(venue)}` : ""}</div>
      </div>
      <div class="fixture"><strong>${escapeHtml(home.club)} v ${escapeHtml(away.club)}</strong><span>${orderedMatches.length} matches · write each set as home–away</span></div>
    </div>
    <section class="lineups">
      <div><div class="team-title">${escapeHtml(home.name)} · ${escapeHtml(home.club)}</div><table class="lineup-table"><thead><tr><th class="position">Position</th><th>Player / Club</th><th>TTR</th></tr></thead><tbody>${lineupRows(home.players)}</tbody></table></div>
      <div><div class="team-title">${escapeHtml(away.name)} · ${escapeHtml(away.club)}</div><table class="lineup-table"><thead><tr><th class="position">Position</th><th>Player / Club</th><th>TTR</th></tr></thead><tbody>${lineupRows(away.players)}</tbody></table></div>
    </section>
    <div class="section-title">Order of play and set scores</div>
    <table class="matches">
      <thead><tr><th class="order">#</th><th class="match">Match</th><th>Set 1</th><th>Set 2</th><th>Set 3</th><th>Set 4</th><th>Set 5</th><th class="overall-score">Sets</th></tr></thead>
      <tbody>${matchRows}</tbody>
    </table>
    <section class="summary">
      <div class="summary-box"><span>Total matches won · ${escapeHtml(home.club)}</span><strong>${completedScoringMatches.length ? homeWins : "____"}</strong></div>
      <div class="summary-box"><span>Total matches won · ${escapeHtml(away.club)}</span><strong>${completedScoringMatches.length ? awayWins : "____"}</strong></div>
      <div class="summary-box winner"><span>Overall winner</span><strong>${escapeHtml(winner || "\u00a0")}</strong></div>
    </section>
    <div class="footer">Scores already entered in KiwiTTR are included; blank cells can be completed by hand.</div>
  </main>
</body>
</html>`;

  downloadHtml(
    html,
    `${fileName(eventName)}-team-game-scoresheet.html`
  );
}
