import { getNab } from "./common"

type Player = {
  elo: number
  name: string
  team?: number
  position?: number
}

const evalTeams = (selector, players: Player[]) => {

  const teams = [
    { elo: 0, players: [], sqAvg: 0, avg: 0, variance: 0, std: 0  },
    { elo: 0, players: [], sqAvg: 0, avg: 0, variance: 0, std: 0 }
  ]

  const maxDiff = 
    0.08 * 
    players.reduce( (r, { elo }) => r + elo, 0) /
    players.length

  selector.forEach( (t,p) => {
      teams[t].players.push({ ...players[p], position: p })
      teams[t].elo += players[p].elo      
  })

  teams.forEach( team => {
      const n = team.players.length
      team.sqAvg = team.elo ** 2 / n
      team.avg = team.elo / n
      
      team.variance = team.players
          .map( ({ elo }) => ((team.avg - elo)**2)/n )
          .reduce( (r,v) => v + r, 0);
          
      team.std = Math.sqrt( team.variance )
  });

  const t1 = selector[0] 
  const division: Record<string, any> = {
      selector: selector.map( i => i === t1 ? 1 : 2 ).join(''),
      selector2: `$${
        selector.map((v,i) => v === 0 ? i+1 : '').join('')} vs ${
        selector.map((v,i) => v === 1 ? i+1 : '').join('')
      }`,
      teams,
      sqDiff: Math.abs(teams[0].sqAvg - teams[1].sqAvg),
      diff: Math.abs(teams[0].elo - teams[1].elo),
      stdDiff: Math.abs(teams[0].std - teams[1].std),
      maxDiff,
      isBetterThan: null,
      tooManyVagabundos: false,
  }

  division.isBetterThan = d => {
      if ( d.diff > division.diff ) return true;
      if ( division.diff > d.diff ) return false;

      return d.diff > division.diff; 
  }

  return division
}
const teamsFromPlayers = (players: Player []) => {
  if ( players.length % 2 === 1 ) return null;

  const selector = players.map( i => 0 );
  let k = 1;
  let bestDivision = null;

  while( k < 2**(selector.length) ){
      let remainder = 1;
      let numBalance = 0;

      for( let i = 0 ; i < selector.length; i++ ){
          let newValue = (selector[i] + remainder);
          selector[i] =  newValue % 2;

          numBalance += selector[i] === 0 ? -1 : 1;

          remainder = Math.floor(newValue/2);

          if ( i === selector.length - 1 && numBalance === 0 ) {
              
              const fixedTeamCompliance = selector.map( (v,i) => !players[i].team || (v+1) === players[i].team).every(Boolean);
              if ( !fixedTeamCompliance ) continue;

              const division = evalTeams(selector, players)
              if (division.tooManyVagabundos) continue

              bestDivision = bestDivision !== null && bestDivision.isBetterThan(division)
                  ? bestDivision
                  : division;
          };
      }

      k++;
  }

  return bestDivision;
}

export const makeTeams = async (list: string) => {
  const names = list.split(' ')

  const conflicts = []
  const errors = []
  const result = await Promise.all(
    names.map((nab,i) => getNab(nab, i, true)) // just by name
  )

  const playerList = result.map( (r: any, i) => {

    if (!r) return errors.push(`${names[i]} was not found`)
    if (r.length && r.length === 1) return r[0]
    
    conflicts.push(`${r.length} players found for ${names[i]} : ${r.map(n => `${n.name}(#${n.id})`).join(', ')}`)

    return null
  })

  if ( errors.length > 0 ) return { errors }
  if ( conflicts.length > 0 ) return { conflicts }

  const division = teamsFromPlayers(playerList)

  // console.log(JSON.stringify(division, null ,2))

  return { division }
}

export const makeTeamsAnonymous = (list: string) => {
  
  const players = list.split(' ').map( (r,i) => {
    const input = r.split('-')
    const elo = Number(input[0])
    const team = input[1] ? Number(input[1]) : undefined

    return { name: `P${(i+1)}`, elo, team }
  })
  const division = teamsFromPlayers(players)

  return { division }
}

export const makeTeamsFromLobby = async (lobby: { name: string; players: { name: string; elo?: number | null }[] }) => {
  const warnings: string[] = []
  const errors: string[] = []

  const players = lobby.players || []
  if (players.length === 0) return { errors: [`Lobby "${lobby.name}" has no players`] }

  if (players.length % 2 === 1) return { errors: [`Lobby "${lobby.name}" has odd number of players: ${players.length}`] }

  // Map lobby players to anonymous players using only ELO (default missing to 1500)
  const resolved: Player[] = players.map((p, i) => {
    let elo = p.elo
    if (elo === null || elo === undefined) {
      warnings.push(`Missing ELO for ${p.name}; defaulting to 1500`)
      elo = 1500
    }

    return { name: `P${i + 1}`, elo: elo as number }
  })

  const division = teamsFromPlayers(resolved)
  if (!division) return { errors: [`Could not generate teams for lobby "${lobby.name}"`], warnings }

  return { division, warnings }
}
