import dao from "@/db";
import { getNab } from "@/logic/common";
import { SlashCommandBuilder } from "discord.js"

const addnoteCommand = {
  data: new SlashCommandBuilder()
    .setName('addnote')
    .setDescription('`addnote` <nab> <note> Adds a note to the nab')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the nab you want to add a note')
        .setRequired(true)
    ).addStringOption(option =>
      option.setName('note')
        .setDescription('Note')
        .setRequired(true)
    ),
    

  async execute(interaction){
		const name = interaction.options.getString('name')
    const note = interaction.options.getString('note')
    let currentName
    
    try {
      let nabs = await getNab(name)

      if (nabs.length > 1) {
        await interaction.reply(`[${name}] More than 1 nab Found: ${nabs.map(n => `#${n.id}[${n.elo}]`).join(', ')}`)
        return

      } else if(!nabs || nabs.length === 0) {
        await interaction.reply(`[${name}] Nab Not Found`)
        return
      }
    
      await dao.addNote(nabs[0].id, `${interaction.member.user.username} said "${note}"`)
      currentName = nabs[0].name
    } catch (error) {
      console.error(error)
      return await interaction.reply(`Internal error`)
    }
    
    interaction.reply({ content: `Note added \`${note}\` to ${currentName}`})
  }
}

export default addnoteCommand