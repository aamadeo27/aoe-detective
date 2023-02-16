import { PromisedDatabase } from "promised-sqlite3"
import { fetchPlayers } from "./aoe-api"

const db = new PromisedDatabase()

const dao = {
  async init(callback?) {
    await db.open("./nabs.sqlite") // create a sqlite3.Database object & open the database on the passed filepath.
   
    // run some sql request.
    await db.run("CREATE TABLE IF NOT EXISTS nabs (id INTEGER PRIMARY KEY, elo INTEGER, avatar TEXT NOT NULL)")
    await db.run("CREATE TABLE IF NOT EXISTS nabs_names (id INTEGER, name TEXT, added_at DATE, PRIMARY KEY (id, name))");
    await db.run("CREATE INDEX IF NOT EXISTS nabs_names_idx_name on nabs_names( name )")

    if (callback) callback()
  },

  async upsert(avatar, elo, id, name) {
    const nab = await db.get('select * from nabs where id = ?', id)

    if (!nab) {
      console.log('New Player: ', name, elo)
      await db.run('insert into nabs values (?,?,?)', id, elo, avatar)
      await db.run('insert into nabs_names values (?,?,?)', id, name, new Date())

      return true
    }

    const names = (await db.all('select * from nabs_names where id = ?', id)).map(n => n.name)
    await db.run('update nabs set elo = ? where id = ?', elo, id)
    
    
    if (!names.includes(name)) {
      console.log('New Name: ', id, name, names, new Date())
      await db.run('insert into nabs_names values (?,?,?)', id, name, new Date())
    }
  },

  async getNabLike(name) {
    const arg = `%${name}%`
    return await db.all("SELECT n.*, nn.name from nabs n, nabs_names nn where name like ? and n.id = nn.id", arg)
  },

  async getNabNamesById(id: number){
    return await db.all('select name from nabs_names where id = ?', id)
  },

  async getNabById(id: number){
    const nab = await db.get('select * from nabs where id = ?', id)
    const names = await dao.getNabNamesById(id)
    let actual = null
    
    names.forEach(n => {
      if ( !actual || actual.added_at < n.added_at ) actual = n
    })

    return {
      ...nab,
      name: actual.name,
    }

  },

  async getNamesById(id: number){ 
    return await db.all(
      `select nn.name, n.elo 
         from nabs n, nabs_names nn 
        where n.id = nn.id 
          and n.id = ?`, id)
  },

  async updateDB(){
    try {
      const players = await fetchPlayers()
  
      players.forEach(p => {
        dao.upsert(p.avatarUrl, p.elo, p.rlUserId, p.userName)
      })
    } catch (error) {
      console.error('Error trying to synchronize the database')
      console.error(error)
    }
  
    console.log('\n Updated at ', new Date().toLocaleString())
  }
}

export default dao