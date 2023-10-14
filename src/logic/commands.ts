import dao from "@/db"
export { makeTeams } from "@/logic/teams"


// updateDB: () => dao.updateDB(),
export async function whothisnab(name: string){
  let data = await dao.getNabLike(name, false)
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
}

export function toggleTrackNab(id){
  return dao.toggleTrackNab(id)
}

export function getNabLike(name){
  return dao.getNabLike(name, false)
}