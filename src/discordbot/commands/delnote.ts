import dao from "@/db";
import { SlashCommandBuilder } from "discord.js";

const delnotecommand = {
  data: new SlashCommandBuilder()
    .setName('delnote')
    .setDescription('`delnote` <nab> <note_id> Removes a note of a nab')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the nab you want to delete a note')
        .setRequired(true)
    ).addStringOption(option =>
      option.setName('note_id')
        .setDescription('Note ID')
        .setRequired(true)
    ),
    

  async execute(interaction){
		const name = interaction.options.getString('name')
    const note_id = interaction.options.getString('note_id')
    
    try {
      let nabs = await dao.getNabLike(name, false)

      if (nabs.length > 1) {
        await interaction.reply(`[${name}] More than 1 nab Found: ${nabs.map(n => `#${n.id}[${n.elo}]`).join(', ')}`)
        return

      } else if(!nabs || nabs.length === 0) {
        await interaction.reply(`[${name}] Nab Not Found`)
        return
      }
    
      await dao.delNote(nabs[0].id, note_id)
    } catch (error) {
      console.error(error)
      return await interaction.reply(`Internal error`)
    }
    
    interaction.reply({ content: `Note ${note_id} deleted from ${name}`})
  }
}

export default delnotecommand