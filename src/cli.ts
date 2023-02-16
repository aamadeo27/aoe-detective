import { exit } from "process"
import * as readline from 'readline'
import dao from "./dao"
import { makeTeams } from 'teams'

const commands = {
  exit: () => exit(0),
  updateDB: () => dao.updateDB(),
  async whothisnab(name: string){

    let data = await dao.getNabLike(name)
    if (!data) return undefined

    return await Promise.all(
      data.map(async p => {
        const id = p.id
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

  makeTeams,
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