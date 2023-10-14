import { SlashCommandBuilder } from "discord.js"

const command = {
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Show Nabdbs commands and examples'),

  async execute(interaction){
    const content = `--
    \`/commands\`
    Show this message

    \`/whothisnab <name>\`
    Looks in the database nabs with a name similar to the argument \`name\`
    try:
      - \`/whothisnab efffdis\`
      - \`/whothisnab <your name>\`
      - \`/whothisnab blackwoltz\`

    \`/tg <nablist>\`
    Makes teams according to ELO using names, aoe ids #ID or just elo $ELO from \`nablist\`.
    Requires players to be separated using space, "The Player" is treated as 2 players "The" and "Player".
    Requires to be an even number of players.
    try:
    - \`/tg efffdis ykew easy alberto\`
    - \`/tg efffdis ykew easy alberto jeanluck felipe\`
    - \`/tg efffdis ykew easy alberto jeanluck felipe jowjow branco\`
    - \`/tg efffdis #1437816 easy alberto jeanluck felipe $2800 branco\`
    \`/syncar [name]\`
    If a name is provided, it marks the player as syncer and return the updated list of syncers.
    If no name is provided it just returns the list of syncers.
    `
    
    await interaction.reply({ content })  
  }
}

export default command