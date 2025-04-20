import { fork } from 'child_process'
import { join } from 'path'

const isCompiled = __dirname.includes('dist')
const baseDir = __dirname

// Paths to bot files (use .js in compiled mode, .ts otherwise)
const ext = isCompiled ? 'js' : 'ts'
const discordBotPath = join(baseDir, `discordbot/index.${ext}`)
const twitchBotPath = join(baseDir, `twitchbot/index.${ext}`)

// Function to start a bot process
function startBot(botPath: string, botName: string): void {
  const botProcess = fork(botPath, [], {
    stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
  })

  botProcess.stdout?.on('data', (data) => {
    console.log(`[${botName}]: ${data.toString().trim()}`)
  })

  botProcess.stderr?.on('data', (data) => {
    console.error(`[${botName} ERROR]: ${data.toString().trim()}`)
  })

  botProcess.on('exit', (code) => {
    console.log(`[${botName}] Process exited with code ${code}`)
    console.log(`Restarting ${botName}...`)
    startBot(botPath, botName)
  })

  botProcess.on('error', (err) => {
    console.error(`[${botName} ERROR]: Failed to start process - ${err.message}`)
  })

  console.log(`[${botName}] Process started with PID ${botProcess.pid}`)
}

// Start both bots
function main(): void {
  startBot(discordBotPath, 'Discord')
  startBot(twitchBotPath, 'Twitch')
}

main()

process.on('SIGINT', () => {
  console.log('Shutting down...')
  process.exit(0)
})