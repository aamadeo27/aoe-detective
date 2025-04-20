import { config } from "dotenv"
import { requireEnv } from "./logic/common"

config()

export const discord = {
    client_id: requireEnv('DISCORD_CLIENT_ID'),
    client_token: requireEnv('DISCORD_CLIENT_TOKEN'),
    guild_id: requireEnv('DISCORD_GUILD_ID'),
    history_channel_id: requireEnv('DISCORD_HISTORY_CHANNEL_ID'),
    general_channel_id: requireEnv('DISCORD_GENERAL_CHANNEL_ID'),
}

export const twitch = {
  channels: requireEnv('TWITCH_CHANNELS').split(','),
  username: requireEnv('TWITCH_USERNAME'),
  password: requireEnv('TWITCH_PASSWORD')
}