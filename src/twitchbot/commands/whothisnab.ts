import dao from "@/db"
import { getNab, wait } from "@/logic/common"

const pct = (w ,l) => isNaN(w) || isNaN(l) ? '--' : Math.floor((w / (w+l))*10000)/100

function shortDate(timestamp){
  return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit'
  })
}

function streak(s){
  if (!s) return ''
  if (s < 0) return `NotLikeThis ${-s}`
  return `CurseLit ${s}`
}

function games(g) {
  if (g < 100) return 'Kappa'
  if (g < 500) return 'RalpherZ'
  if (g < 2000) return 'CorgiDerp'
  if (g < 10000) return 'CoolCat'
  return 'CaitlynS'
}

export default async function whothisnab(say: (comment: string) => void, name: string, current: boolean = false) {

  console.log(name)

  if (!name || name.length === 0) {
    say('Please specify a name')
    return
  }

  let data = await getNab(name, 0, current)
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
        currentName: names.find(n => n.current)!.name,
        ...nab,
        names: names.sort((a,b) => b.added_at - a.added_at ).map(d => d.name),
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
      const names = nab.names.slice(0,5).join(', ')
      const notes = nab.notes.length > 0 ? `Notes: ${nab.notes.map(({ note }) => note).join('. ')}` : ''
      const steamAccount = nab.avatar.match(/avatars.steamstatic.com/)
      const message = `${games(nab.wins+nab.losses)} (${nab.wins+nab.losses}) ${nab.currentName}
        [${shortDate(nab.added_at)}] - 
        ${steamAccount ? 'Steam' : 'Xbox' } - ${names} - 
        ${!nab.wins ? '--' : `${nab.wins}/${nab.losses}`} -
        ${pct(nab.wins, nab.losses)}% ${streak(nab.streak)} -
        #${nab.rank ?? '--'} - ELO:${nab.elo} - ${nab.region ?? ''} - 
        ${notes}
        ${nab.syncer ? '- Syncer ' : ''}
        `
      say(message)
      await wait(2000)

      
    }
  } catch (error) {
    console.error(error)
    say('NotLikeThis NotLikeThis NotLikeThis NotLikeThis')
  }
  
}
