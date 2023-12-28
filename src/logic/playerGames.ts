import { fetchMatchlist } from "@/aoe-api"
import dao from "@/db"
import { getNab } from "./common"

export async function updateNabGames(nabId){
  const currentMatches = new Set<string>()
  const accounts = await getNab(`#${nabId}`)
  const nab = accounts[0]

  console.log('Updating games for nab:', nabId)

  ;(await dao.getGameIds(nab.id)).forEach( g => currentMatches.add(g.game_id))

  const { gameIds, page } = await fetchMatchlist(nabId, currentMatches, Math.max(1,nab.last_page))
  console.log(`Getting ${gameIds.length} games`)

  for(let i = 1 ; i < gameIds.length ; i++) {
    let gameId = gameIds[i] as string

    await dao.saveNabInGame(gameId, nabId)
  }
  
  return page
}
