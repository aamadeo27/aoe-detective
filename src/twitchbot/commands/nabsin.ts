import dao from "../../db"
import { wait } from "../../logic/common"

export default async function nabsin(say: (comment: string) => void, line: string) {

  let bottom: number, top: number
  try {
    [bottom, top] = line.split(' ').map((v) => Number(v))
  } catch(error) {
    say('Invalid range ' + line)
    return
  }

  let data = await dao.getNabsAround(bottom, top)
  if (!data) return undefined

  const ids = new Set()
  
  try {
    const message = data.filter((_, i) => i < 10).map((nab) => 
      `#${nab.rank} ${nab.name} (${nab.elo})`
    ).join(', ')

    say(message)

    if (data.length > 10) {
      await wait(1500)
      const nab = data.pop()
      
      const inbetween = data.length > 11
        ? `... (${data.length -11} nabs) `
        : ''

      say(`${inbetween}... [${nab.rank}-${nab.elo}] ${nab.name}`)
    }

  } catch (error) {
    console.error(error)
    say('NotLikeThis NotLikeThis NotLikeThis NotLikeThis')
  }
  
}
