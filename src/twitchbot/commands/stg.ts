import { findAdvertisementsByTitle } from '../../aoe-api'
import { makeTeamsFromLobby } from '../../logic/teams'

export default async function stg(say: (comment: string) => void, args: string, user?: string) {
  const query = (args || '').trim()
  if (!query) {
    say('Usage: !stg <lobby-title-or-host-substring>')
    return
  }

  let lobbies: any[] = []
  try {
    lobbies = await findAdvertisementsByTitle(query)
  } catch (err: any) {
    console.error(err)
    say('AoE ads API is unreachable. Try again later.')
    return
  }

  if (!lobbies || lobbies.length === 0) {
    say(`No advertisements found matching "${query}".`)
    return
  }

  if (!lobbies || lobbies.length === 0) {
    say(`No advertisements found matching "${query}".`)
    return
  }

  // pick best match (prefer title match then host)
  const q = query.toLowerCase()
  const chosen = lobbies.find(l => (l.name || '').toLowerCase().includes(q)) || lobbies.find(l => (l.players?.[0]?.name || '').toLowerCase().includes(q)) || lobbies[0]

  try {
    const result = await makeTeamsFromLobby(chosen)
    if (result.errors && result.errors.length > 0) {
      return say(result.errors.join(' | '))
    }

    const division = result.division
    if (!division) return say('Could not generate teams for the selected lobby.')

    const t1 = division.teams[0]
    const t2 = division.teams[1]

    const sanitize = (s: any, max = 24) => {
      if (!s) return ''
      let v = String(s)
      v = v.replace(/[\r\n]+/g, ' ').replace(/[^\x20-\x7E]/g, '')
      v = v.trim()
      if (v.length > max) v = v.slice(0, max - 1) + '…'
      return v
    }

    const truncate = (s: string, max = 150) => (s.length > max ? s.slice(0, max - 1) + '…' : s)

    const t1Names = t1.players.map((p: any) => sanitize(p.name)).join(', ')
    const t2Names = t2.players.map((p: any) => sanitize(p.name)).join(', ')

    const msg = `STG — ${sanitize(chosen.name, 48)}: Team1 (${Math.round(t1.elo)}): ${truncate(t1Names)} — Team2 (${Math.round(t2.elo)}): ${truncate(t2Names)} — diff: ${division.diff}`
    say(msg)
  } catch (err) {
    console.error(err)
    say('Unexpected error while generating teams. Try again later.')
  }
}
