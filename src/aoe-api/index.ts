import dao from '@/db'
import axios, { AxiosError } from 'axios'
const MAX_PAGES = 7

export async function fetchPlayers(search: string = ''){

  const players = []
  const pages = []

  console.log('Fetch Players')

  for( let page = 1 ; page <= MAX_PAGES; page++){
    pages.push( axios.post(
      'https://api.ageofempires.com/api/v2/agede/Leaderboard',
      { 
        region:"7",
        matchType:"2",
        page,
        search,
      }
    ).then(response => {
      const playerList = response.data.items
        ?.map(({ avatarUrl, elo, rlUserId, userName, region, wins, losses, rank, winStreak }) => 
          ({ avatarUrl, elo, rlUserId, userName, region, wins, losses, rank, streak: winStreak }))
        .sort((a,b) => b.elo - a.elo)
        .forEach(p => {
          if (p) players.push(p)
        })
    }))

  }

  await Promise.all(pages)

  return players
  
}

export async function fetchMatchlist(nabId: number, savedMatches: Set<string>, from: number){

  const gameIds = new Set()

  let page = from
  while (true){
    let tries = 0
    try {
      console.log('Fetching Page: ', page)
      let response = await axios.post(
        'https://api.ageofempires.com/api/AgeDE/getmpmatchlist',
        {
          gamertag: null,
          playerNumber: 0,
          gameId: 0,
          game: "age",
          profileId: `${nabId}`,
          sortColumn: "dateTime",
          sortDirection: "ASC",
          page,
          recordCount: 10,
          matchType: "2"
        }
      )
      response.data.matchList?.map( match => {
        if (savedMatches.has(match.gameId)) return
        gameIds.add(match.gameId)
      })

      if ((response.data.matchList?.length ?? 0) < 10) {
        break
      }

      page++;

      await new Promise((r) => setTimeout(r, 50)) 
      tries = 0
    } catch(error){
      console.log('Error while getting match list try #', tries)
      tries++
    }
  }

  return { gameIds: Array.from(gameIds), page }
}

export async function fetchMatchDetail(gameId: string, profileId: string) {
  let tries = 0
  do {
    let errorCatched = false
    const response = await axios.post(
      'https://api.ageofempires.com/api/AgeDE/getMatchDetail',
      { gameId, profileId: `${profileId}` }
    ).catch(async error => {
      const axerr = error as AxiosError
      console.error(`#${tries} => Error\n`)

      if (!axerr.status || axerr.status > 500 || tries === 5) {
        console.log(axerr.message)
      }

      tries++
      errorCatched = true
      await new Promise(r => setTimeout(r, 200 * tries))

      return { data : null }
    })

    if (!errorCatched) return response.data      
  } while(true)
}

