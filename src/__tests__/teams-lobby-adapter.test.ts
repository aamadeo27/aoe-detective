import { makeTeamsFromLobby } from '../logic/teams'

describe('makeTeamsFromLobby adapter', () => {
  test('even players with elos returns division', async () => {
    const lobby = { name: 'L', players: [{ name:'P1', elo: 1600 }, { name:'P2', elo: 1400 }] }
    const res = await makeTeamsFromLobby(lobby as any)
    expect(res.division).toBeDefined()
  })

  test('odd players returns error', async () => {
    const lobby = { name: 'L', players: [{ name:'P1', elo:1600 }, { name:'P2', elo:1400 }, { name:'P3', elo:1500 }] }
    const res = await makeTeamsFromLobby(lobby as any)
    expect(res.errors).toBeDefined()
  })
})
