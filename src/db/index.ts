
        
import { removeAccents } from "@/logic/common"
import { AxiosError } from "axios"
import { AsyncDatabase  } from "promised-sqlite3"
import { fetchPlayers } from "../aoe-api"

let db = null

const REGIONS = {
  0: 'Europe',
  1: 'Middle East',
  2: 'Asia',
  3: 'North America',
  4: 'Sourth America',
  5: 'Oceania',
  6: 'Africa',
}



const dao = {
  db,
  async init(callback?) {
    db = await AsyncDatabase.open("./nabs.sqlite")
    dao.db = db
    await // create a sqlite3.Database object & open the database on the passed filepath.
    
    // run some sql request.
    await db.run("CREATE TABLE IF NOT EXISTS nabs (id INTEGER PRIMARY KEY, elo INTEGER, avatar TEXT NOT NULL, last_page INTEGER DEFAULT 1, region text, syncer boolean default false, wins INTEGER, losses INTEGER, rank INTEGER, streak INTEGER);")
    await db.run("CREATE TABLE IF NOT EXISTS nabs_names (id INTEGER, name TEXT, added_at DATE, current boolean default false, name_idx TEXT, PRIMARY KEY (id, name))")
    await db.run("CREATE INDEX IF NOT EXISTS nabs_names_idx_name on nabs_names( name )")
    await db.run("CREATE INDEX IF NOT EXISTS nabs_names_idx_name_idx on nabs_names( name_idx )")
    await db.run("CREATE TABLE IF NOT EXISTS nabs_games (game_id TEXT, nab_id INTEGER, PRIMARY KEY (game_id, nab_id))")
    await db.run("CREATE INDEX IF NOT EXISTS nabs_games_nab_idx on nabs_games( nab_id )")
    await db.run("CREATE TABLE IF NOT EXISTS games (game_id TEXT PRIMARY KEY, data TEXT)")
    await db.run("CREATE TABLE IF NOT EXISTS notes (nab_id INTEGER, note_id INTEGER, note TEXT, PRIMARY KEY (nab_id, note_id))")
    await db.run("CREATE TABLE IF NOT EXISTS twitch_nabs (id text, username text)")

    if (callback) callback()
  },

  async upsert(p, post) {
    p.id = p.rlUserId
    p.name = p.userName
    const nab = await db.get('select * from nabs where id = ?', p.id)
    if (!nab) {
      if (post) post(`\`${new Date().toUTCString()}\` New Player: **${p.name}** ${p.elo}`)

      console.log(`[${new Date().toUTCString()}]`,'New Player: ', p.name, p.elo)
      await db.run('insert into nabs (id, elo, avatar, last_page, region, syncer, wins, losses, rank, streak) values (?,?,?,0,?, false, ?, ?, ?, ?)', p.id, p.elo, p.avatarUrl, REGIONS[p.region], p.wins, p.losses, p.rank, p.streak)
      await db.run('insert into nabs_names (id, name, added_at, current, name_idx) values (?,?,?,?,?)', p.id, p.name, new Date(), true, removeAccents(p.name))

      return true
    }

    const names = (await dao.getNamesById(p.id)).map(n => n.name)

    await db.run('update nabs set elo = ?, region = ?, wins = ?, losses = ?, rank = ?, streak = ? where id = ?', p.elo, REGIONS[p.region], p.wins, p.losses, p.rank, p.streak, p.id)
    
    if (!names.includes(p.name)) {
      if (post && p.id !== 5127369) post(`\`${new Date().toUTCString()}\` New Name: #${p.id} **${p.name}** older names: ${names.map(n => `_${n}_`).join(', ')}`)
      console.log(`[${new Date().toUTCString()}] #${p.id} New Name:  **${p.name}** other names: ${names.map(n => `_${n}_`).join(', ')}`)
      await db.run('insert into nabs_names (id, name, added_at, current, name_idx) values (?,?,?,?,?)', p.id, p.name, new Date(), true, removeAccents(p.name))
      await db.run('update nabs_names set current = false where name <> ? and id = ?', p.name, p.id)

      return true

    } else if (names[0] !== p.name) {
      if (post && p.id !== 5127369 ) post(`[${new Date().toUTCString()}] #${p.id} Back to:  **${p.name}** other names: ${names.map(n => `_${n}_`).join(', ')}`)
      console.log(`\`[${new Date().toUTCString()}]\` #${p.id} Back to:  **${p.name}** other names: ${names.map(n => `_${n}_`).join(', ')}`)
      await db.run('update nabs_names set added_at = ?, current = true where id = ? and name = ?', new Date(), p.id, p.name)
      await db.run('update nabs_names set current = false where name <> ? and id = ?', p.name, p.id)

      return true
    }

    return false
  },

  allNames() {
    return db.all('select * from nabs_names')
  },

  updateNameIdx(nab) {
    return db.run('update nabs_names set name_idx = ? where name = ? and id = ?', [nab.name_idx, nab.name, nab.id])
  },

  getSyncers() {
    return db.all('select * from nabs where syncer')
  },

  async getNabLike(name, current?) {
    const arg = `%${name}%`
    const sql = `
    SELECT n.*, nn.name
      FROM nabs n, nabs_names nn
      WHERE name_idx like ? and n.id = nn.id
    ${ current ? ' and current ': ''}
      ORDER BY nn.added_at ASC`

    return await db.all(sql, arg)
  },

  getNabByName(name, current?) {
    const sql = `
    SELECT n.*, nn.name
      FROM nabs n, nabs_names nn
     WHERE name_idx =? 
       AND n.id = nn.id
    ${current ? ' and current ': ''}
      ORDER BY nn.added_at ASC`

    return db.all(sql, name)
  },

  async getNabById(id: number){
    const nab = await db.get('select * from nabs where id = ?', id)
    const names = await dao.getNamesById(id)
    let actual = null

    names.forEach(n => {
      if ( !actual || actual.added_at < n.added_at ) actual = n
    })

    return {
      ...nab,
      name: actual.name,
    }
  },

  toggleTrackNab(id: number) {
    return db.run('update nabs set track = !track where id = ?', id)  
  },

  async getNamesById(id: number){ 
    return await db.all(
      `select nn.name, n.elo , nn.added_at, current
          from nabs n, nabs_names nn 
        where n.id = nn.id 
          and n.id = ?
        order by added_at desc`, id)
  },

  async updateDB(post?){
    try {
      const players = await fetchPlayers()
  
      players.forEach(p => {
        dao.upsert(p, post)
      })
    } catch (error) {
      const axErr = error as AxiosError
      console.error('Error trying to synchronize the database')
      console.error(`${axErr.message}`)
    }
  },

  setLastPage(nabId: number, lastPage: number) {
    return db.run('update nabs set last_page = ? where id = ?', nabId, lastPage)
  },

  setSyncer(nabId, isSyncer) {
    return db.run('update nabs set syncer = ? where id = ?', isSyncer, nabId)
  },

  getGame(gameId) {
    return db.get('select * from games where game_id = ?', gameId)
  },

  saveGame(gameId, game) {
    return db.run('insert into games values  (?,?)', gameId, JSON.stringify(game))
  },

  saveNabInGame(gameId, nabId) {
    return db.run('insert into nabs_games values (?,?)', gameId, nabId)
  },

  getGameIds(nabId){
    return db.all('select game_id from nabs_games where nab_id = ?', nabId)
  },

  getVsGameIds(nabId, otherNabId){
    return db.all(`
      select a.game_id
        from nabs_games a, nabs_games b 
        where a.game_id = b.game_id
          and a.nab_id = ?
          and b.nab_id = ?
    `, nabId, otherNabId)
  },

  getNabsAbove(elo) {
    return db.all('select id from nabs where elo >= ?', elo)
  },

  async addNote(nabId: number, note: string) {
    const notes = await db.get(`select max(note_id) as max from notes where nab_id = ?`, nabId)
    const noteId = (notes?.max ?? 0) + 1

    return db.run(`insert into notes values (?,?,?)`, nabId, noteId, note)
  },

  delNote(nabId: number, noteId: number) {
    return db.run(`delete from notes where nab_id = ? and note_id = ?`, nabId, noteId)
  },

  getNotes(nabId: number) {
    return db.all(`select * from notes where nab_id = ?`, nabId)
  },

  async addTwitchNab(username: string, userid: string) {
    const nab = await db.get(`select * from twitch_nabs where id = ? and username = ?`, userid, username)
    if (nab) return
    console.log('Adding: ', username)
    return db.run(`insert into twitch_nabs values (?,?)`, userid, username)
  }
}

export default dao

/*
 Add column to nabs table (OriginalID)
 Create function to link an account to an OriginalID
 Create command to unlink an account from an OriginalID
 Modify Whothisnab to show information of other accounts:
  - Show ID, ELO other names
 Update commands
*/