import { exit } from "process"
import { PromisedDatabase } from "promised-sqlite3"
import * as readline from 'readline'

const sql = {
  getId: 'select id from nabs_names where name like ?',
  allById: 
    `select nn.name, n.elo 
       from nabs n, nabs_names nn 
      where n.id = nn.id 
        and n.id = ?`
}

const db = new PromisedDatabase()

async function init() {
  await db.open("./nabs.sqlite") // create a sqlite3.Database object & open the database on the passed filepath.
 
  // run some sql request.
  await db.run("CREATE TABLE IF NOT EXISTS nabs (id INTEGER PRIMARY KEY, elo INTEGER, avatar TEXT NOT NULL)")
  await db.run("CREATE TABLE IF NOT EXISTS nabs_names (id INTEGER, name TEXT, added_at DATE, PRIMARY KEY (id, name))");
  await db.run("CREATE INDEX IF NOT EXISTS nabs_names_idx_name on nabs_names( name )")
}

const commands = {
  exit: () => exit(0),
  whothisnab: async (name) => {
    let data = await db.all(sql.getId, name)
    if (!data) return undefined

    return await Promise.all(data.map(async p => {
      const id = p.id

      let names = await db.all(sql.allById, id)

      return {
        id: id,
        elo: names[0].elo,
        names: names.map(d => d.name)
      }
    }))
  }
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
  await init()
}

main()