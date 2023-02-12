import axios from 'axios'
import { PromisedDatabase } from "promised-sqlite3"

const db = new PromisedDatabase()
async function init() {
  await db.open("./nabs.sqlite") // create a sqlite3.Database object & open the database on the passed filepath.
 
  // run some sql request.
  await db.run("CREATE TABLE IF NOT EXISTS nabs (id INTEGER PRIMARY KEY, elo INTEGER, avatar TEXT NOT NULL)")
  await db.run("CREATE TABLE IF NOT EXISTS nabs_names (id INTEGER, name TEXT, added_at DATE, PRIMARY KEY (id, name))");
  await db.run("CREATE INDEX IF NOT EXISTS nabs_names_idx_name on nabs_names( name )")

  setInterval(updateDB, 10*60*1000)
}
const dao = {
  async upsert(avatar, elo, id, name) {
    const nab = await db.get('select * from nabs where id = ?', id)

    if (!nab) {
      console.log('New Player: ', name, elo)
      await db.run('insert into nabs values (?,?,?)', id, elo, avatar)
      await db.run('insert into nabs_names values (?,?,?)', id, name, new Date())

      return true
    }

    const names = (await db.all('select * from nabs_names where id = ?', id)).map(n => n.name)
    
    
    if (!names.includes(name)) {
      console.log('New Name: ', id, name, names, new Date())
      await db.run('insert into nabs_names values (?,?,?)', id, name, new Date())
    }
  },
}

async function updateDB(){
  const players = await fetchPlayers()

  players.forEach(p => {
    dao.upsert(p.avatarUrl, p.elo, p.rlUserId, p.userName)
  })
}

const MAX_PAGES = 7
async function fetchPlayers(search: string = ''){

  const players = []
  let page = 1
  const pages = []

  while(true){
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
  
    if (page > MAX_PAGES) break
    page++
  }

  await Promise.all(pages)

  return players
  
}

async function main(){
  const players = await fetchPlayers()
  console.log(players.filter(p => p.userName.match(/rams/i)))
}

// main()

// npx ts-node -r tsconfig-paths/register --transpile-only src/db-sync.ts
init()