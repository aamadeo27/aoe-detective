import axios from 'axios';

export type LobbyPlayer = { name: string; elo?: number | null };
export type Lobby = { name: string; players: LobbyPlayer[] };

export type HttpClient = {
  get(url: string, config?: any): Promise<{ data: any; status?: number; headers?: any }>;
};

const DEFAULT_BASE = 'https://aoe-api.worldsedgelink.com/community/advertisement/findAdvertisements';

// default axios instance with a sensible timeout
const defaultHttp = axios.create({ timeout: 5000 });

function parseNumber(v: any): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const sanitized = v.replace(/[, ]+/g, '').trim();
    const n = Number(sanitized);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function parsePlayerEntry(entry: any): LobbyPlayer {
  if (!entry) return { name: 'Unknown', elo: null };

  if (typeof entry === 'string') return { name: entry, elo: null };

  const name =
    entry.name ||
    entry.userName ||
    entry.username ||
    entry.gamertag ||
    entry.playerName ||
    entry.profileName ||
    entry.nick ||
    (entry.player && (entry.player.name || entry.player.userName)) ||
    null;

  const elo =
    parseNumber(entry.elo) ??
    parseNumber(entry.rating) ??
    parseNumber(entry.mmr) ??
    parseNumber(entry.ratings?.elo) ??
    null;

  return { name: (name ?? 'Unknown'), elo };
}

function parseRetryAfterHeader(value: any): number | null {
  if (value === null || value === undefined) return null;

  // numeric (seconds)
  const n = parseNumber(value);
  if (n !== null) return n;

  // try HTTP-date parse
  if (typeof value === 'string') {
    const ts = Date.parse(value);
    if (!Number.isNaN(ts)) {
      const diff = Math.ceil((ts - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
  }

  return null;
}

export function normalizeAdvertisement(raw: any): Lobby | null {
  if (!raw) return null;

  const name =
    raw.name ||
    raw.title ||
    raw.lobbyName ||
    raw.adName ||
    raw.advertisementName ||
    (raw.ad && (raw.ad.name || raw.ad.title)) ||
    null;

  let players: any[] = [];

  if (Array.isArray(raw.players)) players = raw.players;
  else if (Array.isArray(raw.playerList)) players = raw.playerList;
  else if (Array.isArray(raw.attendees)) players = raw.attendees;
  else if (Array.isArray(raw.playersInLobby)) players = raw.playersInLobby;
  else if (Array.isArray(raw.participants)) players = raw.participants;
  else if (Array.isArray(raw.player)) players = raw.player;
  else if (Array.isArray(raw.playersNames)) players = raw.playersNames;
  else if (Array.isArray(raw.playernames)) players = raw.playernames;
  else if (raw.owners && Array.isArray(raw.owners)) players = raw.owners;
  else if (raw.player && typeof raw.player === 'string') players = [raw.player];
  else if (raw.players && typeof raw.players === 'string') players = [raw.players];
  else if (Array.isArray(raw)) players = raw;

  const normalizedPlayers = players
    .map(parsePlayerEntry)
    .filter(p => p && p.name)
    .map(p => ({ name: p.name, elo: p.elo ?? null }));

  if (!name || normalizedPlayers.length === 0) return null;

  return { name, players: normalizedPlayers };
}

export async function findAdvertisementsByTitle(title: string, client?: HttpClient): Promise<Lobby[]> {
  const http = client ?? defaultHttp;
  const url = `${DEFAULT_BASE}?title=${encodeURIComponent(title)}`;

  const maxAttempts = 3;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const resp = await http.get(url);
      const data = resp.data;

      let items: any[] = [];
      if (Array.isArray(data)) items = data;
      else if (Array.isArray(data.items)) items = data.items;
      else if (Array.isArray(data.advertisements)) items = data.advertisements;
      else if (Array.isArray(data.results)) items = data.results;
      else if (data && typeof data === 'object') items = [data];

      const lobbies = items
        .map(normalizeAdvertisement)
        .filter((x): x is Lobby => x !== null);

      return lobbies;
    } catch (err) {
      const axerr = err as any;
      const status = axerr?.response?.status ?? axerr?.status;
      const headers = axerr?.response?.headers ?? axerr?.headers ?? {};

      if (status === 429) {
        const ra = headers['retry-after'] || headers['Retry-After'];
        const wait = parseRetryAfterHeader(ra) ?? 1;
        await new Promise(r => setTimeout(r, wait * 1000));
        attempt++;
        continue;
      }

      attempt++;
      if (attempt >= maxAttempts) {
        const msg = axerr?.message ? `: ${axerr.message}` : '';
        throw new Error('AoE ads API unreachable' + msg);
      }
      await new Promise(r => setTimeout(r, 200 * attempt));
    }
  }

  return [];
}
