import dao from "@/db";
import { getNab } from "@/logic/common";
import { SlashCommandBuilder } from "discord.js";
import { embedNab } from "../utils";

const syncerCommand = {
  data: new SlashCommandBuilder()
    .setName('syncer')
    .setDescription('`syncer` <nab> Marks nab as a syncer. `syncer` with no args list known syncers')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the nab you want to mark as syncer')
        .setRequired(false)
    ),

  async execute(interaction){
		const name = interaction.options.getString('name')
    
    if (name) {
      let nabs = await getNab(name, 0, false)

      if (nabs.length > 1) {
        await interaction.reply(`[${name}] More than 1 nab Found: ${nabs.map(n => `#${n.id}[${n.elo}]`).join(', ')}`)
        return

      } else if(!nabs || nabs.length === 0) {
        await interaction.reply(`[${name}] Nab Not Found`)
        return
      }

      await dao.setSyncer(nabs[0].id, true)
      await interaction.channel.send(`[#${nabs[0].id}] ${nabs[0].name} was marked as syncer`)
    } 
    
    try {
      const syncerList = await dao.getSyncers()

      await Promise.all(
        syncerList.map( async syncer => {
          let names = await dao.getNamesById(syncer.id)
          const nab = await dao.getNabById(syncer.id)

          nab.currentName = names.find(n => n.current)?.name ?? null
          nab.names = names.map(d => d.name)
          
          await interaction.channel.send({ embeds: [embedNab(nab)]})
        })
      )

    } catch (error) {
      console.error(error)
      return await interaction.reply(`Internal error`)
    }
    
    interaction.reply({ content: '\`with: ' + (name ?? 'no argument') + '\`'})
  }
}

export default syncerCommand