import { EmbedBuilder } from "discord.js"

const pct = (w ,l) => isNaN(w) || isNaN(l) ? '--' : Math.floor((w / (w+l))*10000)/100

export const embedNab = nab => {
  const name = nab.currentName
  const names = nab.names.join(', ')

  const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(name)
      .setURL(`https://www.ageofempires.com/stats/?profileId=${nab.id}&game=age&matchType=2`)
      // .setDescription(``)
      .setThumbnail(nab.avatar)
      .addFields([
        { name: 'ID', value: `${nab.id}`, inline: true},
        { name: 'ELO', value: `${nab.elo}`, inline: true },
        { name: 'Region', value: `${nab.region ?? 'no-region'}`, inline: true },
        { name: 'W/L', value: !nab.wins ? '--':  `${nab.wins}/${nab.losses} (${nab.wins+nab.losses})`, inline: false },
        { name: 'Win Streak', value: ''+ ( nab.streak ?? '--'), inline: true },
        { name: 'WinRate', value: `${pct(nab.wins, nab.losses)}%`, inline: true },
        { name: 'Rank', value: ''+ (nab.rank ?? '--'), inline: true },
        { name: 'Syncer', value: ( nab.syncer ? 'true' : 'false'), inline: true },
      ])

  if ( names.length > 0 ) embed.addFields( { name: 'Other names', value: names })
  if ( nab.notes?.length ) {
    nab.notes.forEach(n => embed.addFields({ name: `Note#${n.note_id}`, value: n.note }))
  }

  return embed
}