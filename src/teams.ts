import axios from "axios"
import dao from "./dao"

type Player = {
  elo: number
}

const evalTeams = (selector, players: Player[]) => {
  const teams = [
    { elo: 0, players: [], sqAvg: 0, avg: 0, variance: 0, std: 0 },
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

  // console.log(teams.map(t => t.players.map( p => p.name )))

  teams.forEach( team => {
      const n = team.players.length
      team.sqAvg = team.elo ** 2 / n
      team.avg = team.elo / n
      
      team.variance = team.players
          .map( ({ elo }) => ((team.avg - elo)**2)/n )
          .reduce( (r,v) => v + r, 0);
          
      team.std = Math.sqrt( team.variance )
  });

  const vs = (i, size) => (i+1) === size ? 'vs' : ''
  const division = {
      selector: selector.map( i => i+1 ).join(''),
      selector2: `${
        selector.map((v,i) => v === 0 ? i+1 : '').join('')} vs ${
        selector.map((v,i) => v === 1 ? i+1 : '').join('')
      }`,
      teams,
      sqDiff: Math.abs(teams[0].sqAvg - teams[1].sqAvg),
      diff: Math.abs(teams[0].avg - teams[1].avg),
      stdDiff: Math.abs(teams[0].std - teams[1].std),
      maxDiff,
      isBetterThan: null,
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

  while( k < 2**(selector.length-1) ){
      let remainder = 1;
      let numBalance = 0;

      for( let i = 0 ; i < selector.length; i++ ){
          let newValue = (selector[i] + remainder);
          selector[i] =  newValue % 2;

          numBalance += selector[i] === 0 ? -1 : 1;

          remainder = Math.floor(newValue/2);

          if ( i === selector.length - 1 && numBalance === 0 ) {
              const division = evalTeams(selector, players);

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
    names.map(async (name, i) => name.match(/^#.+$/)
      ? [await dao.getNabById(parseInt(name.substring(1)))]
      : name.match(/^\$\d+$/)
      ? [{ name: 'Player ' + (i+1), elo: parseInt(name.substring(1), 10)}]
      : dao.getNabLike(name))
  )
  console.log(result)
  const playerList = result.map( (r: any, i) => {

    if (!r) return errors.push(`${names[i]} was not found`)
    console.log(r)
    if (r.length && r.length === 1) return r[0]
    
    conflicts.push(`${r.length} players found for ${names[i]} : ${r.map(n => `${n.name}(#${n.id})`).join(', ')}`)

    return null
  })

  if ( errors.length > 0 ) return { errors }
  if ( conflicts.length > 0 ) return { conflicts }


  const division = teamsFromPlayers(playerList)

  console.log(division.selector)
  console.log(division.selector2)
  console.log(division.diff)
  console.log(division.sqDiff)
  console.log(division.teams[0].players.map(({ elo, name }) => ({ elo, name})))
  console.log(division.teams[0].avg)
  console.log(division.teams[0].elo)
  console.log(division.teams[1].players.map(({ elo, name }) => ({ elo, name})))
  console.log(division.teams[1].avg)
  console.log(division.teams[1].elo)
}


//makeTeams Cool_ $1900 song Dibu netqu rams