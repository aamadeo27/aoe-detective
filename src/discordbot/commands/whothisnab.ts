import dao from "@/db";
import { getNab } from "@/logic/common";
import { SlashCommandBuilder } from "discord.js";
import { embedNab } from "../utils";

const whothisnabCommand = {
  data: new SlashCommandBuilder()
    .setName('whothisnab')
    .setDescription('Finds out which nabs match this exact name and their info')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the nab you want to check')
        .setRequired(true)
    ),

  async execute(interaction){
    const ids = new Set()
		const name = interaction.options.getString('name')

    let data = await getNab(name, 0, false)
    if (!data) return undefined
  
    let response = await Promise.all(
      data.map(async p => {
        const id = p.id
        if (ids.has(id)) return
        ids.add(id)

        let names = await dao.getNamesById(id)
        const nab = await dao.getNabById(id)
        const notes = await dao.getNotes(id)
        
        return {
          currentName: names.find(n => n.current)?.name ?? null,
          ...nab,
          names: names.map(d => d.name),
          notes,
        }
      })
    )

    response = response.filter(n => !!n)
    if(response.length === 0) {
      await interaction.reply(`[${name}] Nab Not Found`)
      return
    }
    
    try {
      interaction.channel.send({ embeds: response.slice(0,10).map(embedNab) })

      if ( response.length > 10 ){
        interaction.cannel.send({ content: `+${response.length - 10}`})
      }
    } catch (error) {
      console.error(error)
      return await interaction.reply(`Internal error`)
    }
    
    interaction.reply({ content: '\`with: ' + name + '\`'})
  }
}

export default whothisnabCommand