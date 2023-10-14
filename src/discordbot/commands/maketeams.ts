import { makeTeams } from "@/logic/teams"
import { SlashCommandBuilder } from "discord.js"

const command = {
  data: new SlashCommandBuilder()
    .setName('tg')
    .setDescription('Makes teams from a list of nab names separated by a space')
    .addStringOption(option =>
      option.setName('nablist')
        .setDescription('The names or part of the name of the nabs in the lobby. It has to be an even number of names')
        .setRequired(true)
    ),

  async execute(interaction){
		const nablist = interaction.options.getString('nablist').replace(/\s+/g, ' ')

    const response = await makeTeams(nablist)

    let content = `\`/tg ${nablist}\`\n`
    const { division } = response
    
    if (response.errors) {
      console.log(response.errors)
      content += `\n${response.errors.join('\n')}`

    } else if (response.conflicts) {
      content += `\n${response.conflicts.join('\n')}`

    } else if ( !division) {
        content += `\nOdd number of players, should be even`

    } else {
      const showTeam = t =>
        `T${t+1} (${division.teams[t].elo}) => ${division.teams[t].players.map(p => `**${p.name}** (${p.elo})`).join(', ')}`
      const eloDiff = Math.abs(division.teams[0].elo - division.teams[1].elo)
      const selectors = `${division.selector} / ${division.selector2}`
  
      content = `${selectors}\n${showTeam(0)}\n${showTeam(1)}\nElo Difference: ${eloDiff}\nwith \`${nablist}\``
    }

    console.log(content)
    
    await interaction.reply({ content })  
  }
}

export default command

/*
  To do:
    - GetMPFull con gamertag cuando no se encuentre el nombre
    - GetMatches
    - Store Opponents
    - Get Online timeframes
*/