import dao from "../db"
import { getNab } from "./common"

type Player = {
  elo: number
  name: string
}

const evalTeams = (selector, players: Player[]) => {

  const teams = [
    { elo: 0, players: [], sqAvg: 0, avg: 0, variance: 0, std: 0, vagabundos: 0 },
    { elo: 0, players: [], sqAvg: 0, avg: 0, variance: 0, std: 0, vagabundos: 0 }
  ]

  const maxDiff = 
    0.08 * 
    players.reduce( (r, { elo }) => r + elo, 0) /
    players.length

  selector.forEach( (t,p) => {
      teams[t].players.push({ ...players[p], position: p })
      teams[t].elo += players[p].elo
      
      teams[t].vagabundos += players[p].name.match(/^Vagabundo\d+/) ? 1 : 0
  })

  if (teams[0].vagabundos > 1 || teams[1].vagabundos > 1) {
    return { tooManyVagabundos: true }
  }

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
      selector2: `${
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
//tg 2857 1821 2782 2883 1864 1633 1535 1664
const teamsFromPlayers = (players: Player []) => {
  if ( players.length % 2 === 1 ) return null;

  const selector = players.map( i => 0 );
  let k = 1;
  let bestDivision = null;

  while( k < 2**(selector.length-1) ){
      let remainder = 1;
      let numBalance = 0;

      for( let i = 0 ; i < selector.length; i++ ){
          let newValue = (selector[i] + remainder);
          selector[i] =  newValue % 2;

          numBalance += selector[i] === 0 ? -1 : 1;

          remainder = Math.floor(newValue/2);

          if ( i === selector.length - 1 && numBalance === 0 ) {
              const division = evalTeams(selector, players)
              console.log(division.selector, division.diff)
              if (division.tooManyVagabundos) continue

              bestDivision = bestDivision !== null && bestDivision.isBetterThan(division)
                  ? bestDivision
                  : division;
          };
      }

      k++;
  }

  console.log(bestDivision.teams)

  return bestDivision;
}

export const makeTeams = async (list: string) => {
  const names = list.split(' ')

  const conflicts = []
  const errors = []
  const result = await Promise.all(
    names.map(n => getNab(n, 0, true)) // just by name
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

  return { division }
}

export const makeTeamsAnonymous = (list: string) => {
  const newList = '$' + list.trim().replace(/\s+/g, ' $')  
  const teams = makeTeams(newList)


  return teams
}