import dao from "@/db"
import { getNab } from "@/logic/common"


const maps = [
  'Highland',
  'Inland',
  'Oasis',
  'Coastal',
  'Narrows',
  'Hill Country',
  'Continental',
  'Rivers',
  'Small Islands',
  'Large Islands',
  'Mediterranean',
]

export default async function whothisnab(say: (comment: string) => void, name: string) {
  
  try {
    const mapId = Math.floor(Math.random() * maps.length)
    console.log(`Picked Map: ${maps[mapId]}`)
    say(`Picked Map: ${maps[mapId]}`)
  } catch (error) {
    console.error(error)
    say('NotLikeThis NotLikeThis NotLikeThis NotLikeThis')
  }
  
}
