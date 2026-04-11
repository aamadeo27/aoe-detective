import stg from '../twitchbot/commands/stg'

jest.mock('../aoe-api', () => ({
  findAdvertisementsByTitle: jest.fn()
}))

jest.mock('../logic/teams', () => ({
  makeTeamsFromLobby: jest.fn()
}))

import { findAdvertisementsByTitle } from '../aoe-api'
import { makeTeamsFromLobby } from '../logic/teams'

describe('stg command', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('no args shows usage', async () => {
    const say = jest.fn()
    await stg(say, '', 'user')
    expect(say).toHaveBeenCalledWith('Usage: !stg <lobby-title-or-host-substring>')
  })

  test('no ads found returns friendly message', async () => {
    ;(findAdvertisementsByTitle as jest.Mock).mockResolvedValue([])
    const say = jest.fn()
    await stg(say, 'query', 'user')
    expect(say).toHaveBeenCalledWith('No advertisements found matching "query".')
  })

  test('success path posts teams', async () => {
    const lobby = { name: 'L', players: [{ name: 'A', elo: 1600 }, { name: 'B', elo: 1400 }] }
    ;(findAdvertisementsByTitle as jest.Mock).mockResolvedValue([lobby])
    ;(makeTeamsFromLobby as jest.Mock).mockResolvedValue({ division: { teams: [{ elo: 1600, players: [{ name: 'A' }] }, { elo: 1400, players: [{ name: 'B' }] }], diff: 200 } })

    const say = jest.fn()
    await stg(say, 'L', 'user')
    expect(say).toHaveBeenCalled()
    const msg = (say as jest.Mock).mock.calls[0][0]
    expect(msg).toContain('STG — L:')
  })
})
