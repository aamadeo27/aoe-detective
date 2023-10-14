import tmi from 'tmi.js'
import config from './config.json'
import whothisnab from './commands/whothisnab'
import dao from '@/db'

const client = tmi.Client(config)

client.connect()
  .then(() => 
    dao.init(() =>
      console.log('HACKERMANS')
    )
  )
  .catch(console.error)

const commands = {
  whothisnab,
}


client.on('message', (channel, tags, message, self) => {
  if(self || !message || !message.startsWith('!')) return

  const args = message.slice(1).split(' ')
	const command = args.shift()

  if(!commands[command]) {
    client.say(channel, 'Command not found StinkyGlitch')
    return
  }

  try {
    commands[command]((s: string) => {
      console.log(s)
      client.say(channel, s ?? '')
    }, args.join(' ')
    )
  } catch (error) {
    console.error(error)
  }

  
})

