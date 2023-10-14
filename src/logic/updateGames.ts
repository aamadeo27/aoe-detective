import { fetchMatchDetail, fetchMatchlist } from "@/aoe-api"
import dao from "@/db"
import { getNab } from "./common"

async function updateNabGames(nabId){
  const currentMatches = new Set<string>()
  const accounts = await getNab(`#${nabId}`)
  const nab = accounts[0]

  ;(await dao.getGameIds(nab.id)).forEach( g => currentMatches.add(g.game_id))

  const { gameIds, page } = await fetchMatchlist(nabId, currentMatches, nab.last_page)
  console.log(`Getting ${gameIds.length} games for ${nab.id}`)


  for(let i = 0 ; i < gameIds.length ; i++) {
    let gameId = gameIds[i] as string
    console.log('Fetching game: ', gameId)
    const detail = await fetchMatchDetail(gameId, nabId)

    const teams = []
    let win = null

    await Promise.all(detail.playerList.map((p) => {
      win = p.winLoss === 'Win' ? p.team-1 : win
      teams[p.team-1] = teams[p.team-1] ?? []
      teams[p.team-1].push({
        nabId: p.profileId,
        civ: p.civName,
        color: p.color,
        score: p.score,
      })

      console.log(gameId, p.profileId)
      return dao.saveNabInGame(gameId, p.profileId)
    }))

    const gameData = {
      map: detail.matchSummary.mapTypeName,
      date: detail.matchSummary.matchDate,
      length: detail.matchSummary.matchLength,
      victory: detail.matchSummary.victoryType,
      win, 
      teams,
    }

    await dao.saveGame(gameId, gameData)
  }

  await dao.setLastPage(nabId, page)
  
  return page
}

async function updateGPGames() {
  await dao.init()
  const nabs = await dao.getNabsAbove(2000)

  console.log(`${nabs.length} above 2k`)

  for(let i = 0 ; i < nabs.length ; i++) {
    console.log('Get games of', nabs[i])
    await updateNabGames(nabs[i].id)
  }
}

updateGPGames()