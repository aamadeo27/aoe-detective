import axios from 'axios'
const MAX_PAGES = 7

export async function fetchPlayers(search: string = ''){

  const players = []
  const pages = []

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
        ?.map(({ avatarUrl, elo, rlUserId, userName }) => ({ avatarUrl, elo, rlUserId, userName }))
        .sort((a,b) => b.elo - a.elo)
        .forEach(p => {
          if (p) players.push(p)
        })
    }))

  }

  await Promise.all(pages)

  return players
  
}