import dao from "@/db"
import { getNab } from "@/logic/common"


const wait = (n: number) => new Promise(r => setTimeout(r,n))

export default async function whothisnab(say: (comment: string) => void, name: string) {

  console.log(name)

  if (!name || name.length === 0) {
    say('Please specify a name')
    return
  }

  let data = await getNab(name, 0, false)
  if (!data) return undefined

  const ids = new Set()
  let response = await Promise.all(
    data.map(async p => {
      const id = p.id
      if (ids.has(id)) return
      ids.add(id)

      let names = await dao.getNamesById(id)
      const nab = await dao.getNabById(id)
      const notes = await dao.getNotes(id)

      console.log(nab)
      
      return {
        currentName: names.find(n => n.current)?.name ?? null,
        ...nab,
        names: names.map(d => d.name),
        notes,
      }
    })
  )

  response = response.filter(n => !!n)
  if(response.length === 0) {
    say(`[${name}] Nab Not Found StinkyGlitch`)
    return
  }
  
  try {
    for(let i = 0; i < response.length ; i++) {
      if ( i === 4 ) {
        say(`and ${response.length - i} more`)
        break
      }

      const nab = response[i]
      say(`[${nab.id}] ${nab.currentName} - Other Names: ${nab.names.join(', ')} - ELO: ${nab.elo} - Region: ${nab.region ?? ''} - Notes: ${nab.notes.map(({ note }) => note).join('. ')}`)
      await wait(2000)

      
    }
  } catch (error) {
    console.error(error)
    say('NotLikeThis NotLikeThis NotLikeThis NotLikeThis')
  }
  
}
