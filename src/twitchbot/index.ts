import tmi from 'tmi.js'
import { twitch as config } from '../config'
import whothisnab from './commands/whothisnab'
import pickmap from './commands/pickmap'
import tg from './commands/tg'
import dao from '../db'
import nabsin from './commands/nabsin'

const nabsCache = {}

const identity = {
  username: config.username,
  password: config.password,
}
const client = tmi.Client({ identity, channels: config.channels })

client.connect()
  .then(e=> {
      console.log('HACKERMANS',e)
      dao.init(() =>
        console.log('HACKERMANS DB')
      )
    }
  )
  .catch(console.error)

const commands = {
  tg,
  wtfn: (say: (comment: string) => void, name: string) => whothisnab(say, name, true),
  wtn: (say: (comment: string) => void, name: string) => whothisnab(say, name, false),
  whothisnab: (say: (comment: string) => void, name: string) => whothisnab(say, name, false),
  pickmap,
  nabsin,
}


client.on('message', (channel, tags, message, self) => {
  if (!nabsCache[tags.username] && !self) {
    dao.addTwitchNab(tags.username, tags['user-id'])
    nabsCache[tags.username] = tags['user-id']
  }
  if(self || !message || !message.startsWith('!')) return

  const args = message.slice(1).split(' ')
	const command = args.shift()

  if(!commands[command]) {
    return
  }

  try {
    commands[command]((s: string) => {
      console.debug(s)
      client.say(channel, s ?? '')
    }, args.join(' ')
    )
  } catch (error) {
    console.error(`${channel}: ${message} : ${tags.username} : ${error}`)
  }  
})

