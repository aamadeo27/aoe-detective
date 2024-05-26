
        
import { removeAccents } from "@/logic/common"
import { AxiosError } from "axios"
import { fetchPlayers } from "../aoe-api"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

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

  async upsert(p, post) {
    p.id = p.rlUserId
    p.name = p.userName

    const nab = await prisma.nab.findUnique({ where: { id: p.id } })
    const nameIdx = removeAccents(p.name)

    if (!nab) {
      if (post) post(`\`${new Date().toUTCString()}\` New Player: **${p.name}** ${p.elo}`)

      console.log(`[${new Date().toUTCString()}]`,'New Player: ', p.name, p.elo)
      await prisma.nab.create({
        data: {
          id: p.id,
          elo: p.elo,
          avatar: p.avatarUrl,
          region: REGIONS[p.region],
          wins: p.wins,
          losses: p.losses,
          rank: p.rank,
          streak: p.streak
        }
      })


      await prisma.nabName.create({
        data: {
          nab_id: p.id,
          name: p.name,
          added_at: new Date(),
          current: true,
          name_idx: nameIdx,
        }
      })

      return true
    }

    if ( p.elo !== nab.elo ){
      await prisma.nab.update({
        where: { id: nab.id },
        data: {
          elo: p.elo,
          region: REGIONS[p.region],
          wins: p.wins,
          losses: p.losses,
          rank: p.rank,
          streak: p.streak,
        }
      })
    }
    const silent =  p.id === 5127369
    
    const names = (await prisma.nabName.findMany({ where: { nab_id: p.id } })).map(n => n.name)

    if (!names.includes(p.name) || names[0] !== p.name) {

      if (names[0] !== p.name) {
        if (post && !silent ) post(`[${new Date().toUTCString()}] #${p.id} Back to:  **${p.name}** other names: ${names.map(n => `_${n}_`).join(', ')}`)
          console.log(`\`[${new Date().toUTCString()}]\` #${p.id} Back to:  **${p.name}** other names: ${names.map(n => `_${n}_`).join(', ')}`)
      } else {
        if (post && !silent) post(`\`${new Date().toUTCString()}\` New Name: #${p.id} **${p.name}** older names: ${names.map(n => `_${n}_`).join(', ')}`)
          console.log(`[${new Date().toUTCString()}] #${p.id} New Name:  **${p.name}** other names: ${names.map(n => `_${n}_`).join(', ')}`)
      }
      
      await prisma.nabName.create({
        data: {
          nab_id: p.id,
          name: p.name,
          added_at: new Date(),
          current: true,
          name_idx: nameIdx,
        }
      })
      
      await prisma.nabName.updateMany({
        where: { nab_id: p.id, name_idx: { not: nameIdx }},
        data: { current: false },
      })

      return true

    }

    return false
  },

  getSyncers() {
    return prisma.nab.findMany({ where: { syncer: true }})
  },

  async getNabLike(name, current = false) {
    const nabs = await prisma.nabName.findMany({
      where: {
        name_idx: {
          contains: removeAccents(name),
          mode: 'insensitive',
        },
        ...(current ? { current: true } : {})
      },
      orderBy: {
        added_at: "asc"
      },
      include: {
        nab: true,
      }
    })

    return nabs.map((n) => ({
      name: n.name,
      ...n.nab
    }))
  },

  async getNabByName(name, current = false) {
    const nabs = await prisma.nabName.findMany({
      where: {
        name,
        ...(current ? { current: true } : {})
      },
      orderBy: {
        added_at: "asc"
      },
      include: {
        nab: true,
      }
    })

    return nabs.map((n) => ({
      name: n.name,
      ...n.nab
    }))
  },

  async getNabById(id: number){
    const nab = await prisma.nab.findUnique({ where: { id }})
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

  getNamesById(id: number){ 
    return prisma.nabName.findMany({
      where: { nab_id: id },
      orderBy: { added_at: 'desc' }
    })
  },

  async updateDB(post?){
    try {
      const players = await fetchPlayers()
  
      for (let p = 0; p < players.length ; p++) {
        await dao.upsert(players[p], post)
      }
    } catch (error) {
      const axErr = error as AxiosError
      console.error('Error trying to synchronize the database')
      console.error(`${axErr.message}`)
    }
  },

  setSyncer(id, isSyncer) {
    return prisma.nab.update({ where: { id }, data: { syncer: isSyncer } })
  },

  getNabsAround(elo, delta) {
    return prisma.nab.findMany({
      where: {
        AND: [
          { elo: { gte: elo - delta }},
          { elo: { lte: elo + delta }},
        ]
      },
    })
  },

  addNote(nab_id: number, note: string) {
    return prisma.note.create({
      data: {
        nab_id,
        note,
      }
    }) 
  },

  delNote(id: number) {
    return prisma.note.delete({ where: { id }})
  },

  getNotes(nab_id: number) {
    return prisma.note.findMany({ where: { nab_id } })
  },

  async addTwitchNab(username: string, id: string) {
    const nab = await prisma.twitchNab.findUnique({
      where: {
        id,
      }
    })
    if (nab) return
    console.log('Adding: ', username)
    return await prisma.twitchNab.create({ data: { id, username } })
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