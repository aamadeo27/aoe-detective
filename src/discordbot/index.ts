import dao from '../db'
import { Client, Events, GatewayIntentBits, REST, Routes } from 'discord.js'
import whothisnabCommand from './commands/whothisnab'
import makeTeamsCommand from './commands/maketeams'
import helpCommand from './commands/help'
import syncerCommand from './commands/syncer'
import addnoteCommand from './commands/addnote'
import delnotecommand from './commands/delnote'
import { discord as config } from '../config'
import features from '../features.json'

const rest = new REST({ version: '10' }).setToken(config.client_token)

const updateDB = () => {
  const post = async message => {
    try {
      await rest.post(Routes.channelMessages(config.history_channel_id), {
        body: {
            content: message,
        },
      })
    } catch (error) {
      console.error(error)
    }
  }

  dao.updateDB(post)
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
  
  rest.put(Routes.applicationGuildCommands(config.client_id, config.guild_id), { body: commands })

  client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return

    if (interaction.channelId != config.general_channel_id) {
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


client.login(config.client_token)