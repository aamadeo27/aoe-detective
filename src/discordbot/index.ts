import dao from '@/db'
import pgDao from '@/db/pgDao'
import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js'
import whothisnabCommand from './commands/whothisnab'
import makeTeamsCommand from './commands/maketeams'
import helpCommand from './commands/help'
import syncerCommand from './commands/syncer'
import addnoteCommand from './commands/addnote'
import delnotecommand from './commands/delnote'
import secrets from '../secrets.json'
import features from '../features.json'

const CLIENT_ID = '1075851918921978026'
const CLIENT_TOKEN = secrets.discord.client_token
const GUILD_ID = '1075803410022010900'
const HISTORY_CHANNEL_ID = '1075864498797281322'
const GENERAL_CHANNEL_ID = '1075803410621792388'

const rest = new REST({ version: '10' }).setToken(CLIENT_TOKEN)


const updateDB = () => {
  const post = async message => {
    try {
      await rest.post(Routes.channelMessages(HISTORY_CHANNEL_ID), {
        body: {
            content: message,
        },
      })
    } catch (error) {
      console.error(error)
    }
  }

  // dao.updateDB()
  if(features.postgres) pgDao.updateDB(console.log)

}

const client = new Client({ intents: [GatewayIntentBits.Guilds] })

const commands = [
  whothisnabCommand.data.toJSON(),
  makeTeamsCommand.data.toJSON(),
  helpCommand.data.toJSON(),
  syncerCommand.data.toJSON(),
  addnoteCommand.data.toJSON(),
  delnotecommand.data.toJSON(),
]
const commandLibrary = { 
  whothisnab: whothisnabCommand.execute,
  syncer: syncerCommand.execute,
  tg: makeTeamsCommand.execute,
  commands: helpCommand.execute,
  addnote: addnoteCommand.execute,
  delnote: delnotecommand.execute,
}

function registerCommands(){
  
  rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })

  client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return

    if (interaction.channelId != GENERAL_CHANNEL_ID) {
      await interaction.reply({ content: 'Commands can only be used in General Channel', ephemeral: true })
      return
    }
    
    const cmd = commandLibrary[interaction.commandName]

    if (!cmd){
      await interaction.reply({ content: 'Command unknown', ephemeral: true })
      return
    }
    
    try {
      await cmd(interaction)
    } catch (error) {
      console.error(error)
      await interaction.reply({ content: 'There was an error while executing this command', ephemeral: true })
    }
  })
  
}

const MIN = 60*1000

client.on(Events.ClientReady, async () => {
  await registerCommands()
  await dao.init(async () => {
    await updateDB()
    setInterval(updateDB, 5 * MIN)
  })
  
  console.log('HACKERMANS')
})


client.login(CLIENT_TOKEN)