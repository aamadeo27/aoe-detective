import { exit } from "process"
import * as readline from 'readline'
import dao from "./db"
import { makeTeams, makeTeamsAnonymous } from '@/logic/teams'
import { getNab, updateNameIndex } from "./logic/common"
import { updateNabGames } from "./logic/playerGames"


const conflict = (name, accounts) => `Conflicts with name ${name}:\n${accounts.map(n => `#${n.id} ${n.name}`).join(', ')}`

const commands = {
  updateNameIdx: () => updateNameIndex(),
  exit: () => exit(0),
  updateDB: () => dao.updateDB(),
  async whothisnab(name: string){

    let data = await dao.getNabLike(name)
    if (!data) return undefined
    
    const ids = new Set()
    return await Promise.all(
      data.map(async p => {
        const id = p.id
        if (ids.has(id)) return
        ids.add(id)
        let names = await dao.getNamesById(id)

        return {
          id: id,
          elo: names[0].elo,
          names: names.map(d => d.name)
        }
      })
    )
  },

  getNabLike(name){
    return dao.getNabLike(name)
  },

  toggleTrackNab(id){
    return dao.toggleTrackNab(id)
  },

  async vs(nabs) {

    const [nameA, nameB] = nabs.split(' ')
    const nabA = await getNab(nameA)
    const nabB = await getNab(nameB)

    if ( nabA.length > 1 ) return conflict(nameA, nabA)
    if ( nabB.length > 1 ) return conflict(nameB, nabB)

    const gameIds = await dao.getVsGameIds(nabA[0].id, nabB[0].id)
    const details = await Promise.all(gameIds.map(({ game_id }) => dao.getGame(game_id)))

    return details.map(({ game_id, data }) => ({ game_id, data: JSON.parse(data) }))
  },

  tg: makeTeamsAnonymous,

  updateNabGames,
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.on('line',  async (line) => {
  let dl = line.indexOf(' ')
  dl = dl > 0 ? dl : undefined

  const cmd = line.substring(0, dl)
  const arg = line.substring(dl)

  if ( !commands[cmd] ) {
    return console.error(cmd, 'unknown command')
  }

  const response = await commands[cmd](arg.trim())

  console.log(response)
})


async function main(){
  await dao.init()
}

main()