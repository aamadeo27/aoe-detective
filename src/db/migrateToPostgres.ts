import { Prisma, PrismaClient } from "@prisma/client";
import dao from ".";

const prisma = new PrismaClient()

async function truncate() {
  await prisma.$queryRaw`truncate table nabs_names`
  await prisma.$queryRaw`truncate table notes`
  await prisma.$queryRaw`truncate table nabs`
  await prisma.$queryRaw`truncate table nab_games`
  await prisma.$queryRaw`truncate table games`
  await prisma.$queryRaw`truncate table twitch_nabs`
}

type ORM<T> = {
  createMany: (p: { data: T[] }) => Promise<any>
}

async function migrateTable<T>(table: String, orm: ORM<T>, mapFn: (o: any) => T){
  let offset = 0
  let data = []

  do {
    data = await dao.db.all(`select * from ${table} limit 500 offset ${offset}`)

    await orm.createMany({ data: data.map(mapFn) })
    offset += 50
  } while(data.length === 50)
}

async function migrateNabs(){
  const mapFn = (n) => ({
    id: n.id,
    elo: n.elo,
    region: n.region,
    avatar: n.avatar,
    wins: n.wins,
    losses: n.losses,
    rank: n.rank,
    streak: n.streak,
  })

  return migrateTable('nabs', prisma.nab, mapFn)
}


async function migrateNabNames(){
    const mapFn =(nn) => ({
      nab_id: nn.id,
      name: nn.name,
      name_idx: nn.name_idx,
      current: nn.current === 1,
      added_at: new Date(nn.added_at),
    })
  
    return migrateTable('nabs_names', prisma.nabName, mapFn)
}

async function migrateNotes(){
  const mapFn =(n) => ({
    nab_id: n.nab_id,
    note: n.note,
  })

  return migrateTable('notes', prisma.note, mapFn)
}

async function migrateTwitchNabs(){
  const mapFn =(tn) => ({
    id: tn.id,
    username: tn.username,
  })

  return migrateTable('twitch_nabs', prisma.twitchNab, mapFn)
}


export default async function migrate(){
  await truncate()
  await dao.init()
  await migrateNabs()
  await migrateNabNames()
  await migrateNotes()
  await migrateTwitchNabs()
}