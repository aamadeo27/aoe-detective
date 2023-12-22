import tmi from 'tmi.js'
import config from './config.json'
import { twitch } from '../secrets.json'
import whothisnab from './commands/whothisnab'
import pickmap from './commands/pickmap'
import tg from './commands/tg'
import dao from '@/db'

const nabsCache = {}

const identity = {
  username: config.username,
  password: twitch.password,
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
  wtn: whothisnab,
  whothisnab,
  pickmap,
}


client.on('message', (channel, tags, message, self) => {
  console.log(tags)
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
      console.log(s)
      client.say(channel, s ?? '')
    }, args.join(' ')
    )
  } catch (error) {
    console.error(`${channel}: ${message} : ${tags.username} : ${error}`)
  }

  
})

