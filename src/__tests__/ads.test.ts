import { normalizeAdvertisement, parsePlayerEntry, findAdvertisementsByTitle } from '../aoe-api/ads'

describe('ads normalizer', () => {
  test('parses simple array-of-names payload', () => {
    const raw = { title: 'Lobby1', players: ['Alice','Bob'] }
    const l = normalizeAdvertisement(raw)
    expect(l).not.toBeNull()
    expect(l!.name).toBe('Lobby1')
    expect(l!.players.length).toBe(2)
    expect(l!.players[0].name).toBe('Alice')
  })

  test('parses objects with elo/rating', () => {
    const raw = { name: 'L2', players: [{name: 'A', elo: '1600'}, {name: 'B', rating: 1400}] }
    const l = normalizeAdvertisement(raw)
    expect(l).not.toBeNull()
    expect(l!.players[0].elo).toBe(1600)
    expect(l!.players[1].elo).toBe(1400)
  })

  test('findAdvertisementsByTitle uses injected client', async () => {
    const fakeClient = { get: jest.fn().mockResolvedValue({ data: [{ title: 't1', players: ['a','b'] }] }) }
    const res = await findAdvertisementsByTitle('x', fakeClient as any)
    expect((fakeClient.get as jest.Mock).mock.calls.length).toBeGreaterThan(0)
    expect(res.length).toBeGreaterThan(0)
  })

  test('retries on 429 with numeric Retry-After header', async () => {
    jest.useFakeTimers()
    const fakeClient = { get: jest.fn()
      .mockRejectedValueOnce({ response: { status: 429, headers: { 'retry-after': '2' } } })
      .mockResolvedValueOnce({ data: [{ title: 't1', players: ['a','b'] }] })
    }

    const promise = findAdvertisementsByTitle('x', fakeClient as any)
    // allow the initial rejection to schedule the retry timer
    await Promise.resolve()
    jest.advanceTimersByTime(2000)
    await Promise.resolve()
    const res = await promise

    expect((fakeClient.get as jest.Mock).mock.calls.length).toBe(2)
    expect(res.length).toBeGreaterThan(0)
    jest.useRealTimers()
  })

  test('retries on 429 with HTTP-date Retry-After header', async () => {
    jest.useFakeTimers()
    const date = new Date(Date.now() + 3000).toUTCString()
    const fakeClient = { get: jest.fn()
      .mockRejectedValueOnce({ response: { status: 429, headers: { 'retry-after': date } } })
      .mockResolvedValueOnce({ data: [{ title: 't2', players: ['c','d'] }] })
    }

    const promise = findAdvertisementsByTitle('x', fakeClient as any)
    await Promise.resolve()
    jest.advanceTimersByTime(3000)
    await Promise.resolve()
    const res = await promise

    expect((fakeClient.get as jest.Mock).mock.calls.length).toBe(2)
    expect(res.length).toBeGreaterThan(0)
    jest.useRealTimers()
  })

  test('throws exhausted 429 after retries with retryAfter set', async () => {
    jest.useFakeTimers()
    const fakeClient = { get: jest.fn().mockRejectedValue({ response: { status: 429, headers: { 'retry-after': '0' } } }) }

    const promise = findAdvertisementsByTitle('x', fakeClient as any)
    // allow the rejection and any scheduled timers to run
    await Promise.resolve()
    jest.runAllTimers()
    await Promise.resolve()

    await expect(promise).rejects.toMatchObject({ status: 429, retryAfter: 0 })
    jest.useRealTimers()
  })
})
