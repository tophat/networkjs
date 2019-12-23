import * as stability from '.'
import EventEmitter from '../../events/EventEmitter'

const delay = stability.delay
const ping = stability.ping
const StabilityMonitor = stability.default

describe('Stability Monitor', () => {
    describe('delay', () => {
        it('waits the provided interval', () => {
            jest.useFakeTimers()
            delay(1000)

            expect(setTimeout).toHaveBeenCalledTimes(1)
            expect(setTimeout).toHaveBeenLastCalledWith(
                expect.any(Function),
                1000,
            )
        })
    })

    describe('ping', () => {
        it('returns true on fetch success', async () => {
            global.fetch = jest
                .fn()
                .mockImplementation(() =>
                    Promise.resolve({ ok: true, Id: '123' }),
                )
            const result = await ping('TEST')

            expect(global.fetch).toHaveBeenCalledTimes(1)
            expect(result).toBe(true)
        })

        it('returns false on fetch error', async () => {
            global.fetch = jest.fn().mockImplementation(() => Promise.reject())
            const result = await ping('TEST')

            expect(global.fetch).toHaveBeenCalledTimes(1)
            expect(result).toBe(false)
        })
    })

    describe('StabilityMonitor', () => {
        let monitor
        const emitter = new EventEmitter()

        beforeEach(() => {
            monitor = new StabilityMonitor(emitter, {
                resource: 'URL',
                interval: 5000,
                requestThreshold: 2000,
                durationThreshold: 2,
            })
        })

        describe('constructor', () => {
            it('initializes with the correct props', () => {
                expect(monitor).toMatchSnapshot()
            })
        })

        describe('initialize', () => {
            it('sets some default properties and runs monitor', () => {
                const runSpy = (StabilityMonitor.prototype.run = jest.fn())
                monitor.initialize()

                expect(monitor.consecutiveSlowRequestCount).toBe(0)
                expect(monitor.paused).toBe(false)
                expect(runSpy).toHaveBeenCalledTimes(1)
            })
        })

        describe('pause', () => {
            it('sets paused to true', () => {
                monitor.pause()

                expect(monitor.paused).toBe(true)
            })
        })

        describe('resume', () => {
            it('re-initializes monitor', () => {
                const initializeSpy = (StabilityMonitor.prototype.initialize = jest.fn())
                monitor.resume()

                expect(monitor.consecutiveSlowRequestCount).toBe(0)
                expect(monitor.paused).toBe(false)
                expect(initializeSpy).toHaveBeenCalledTimes(1)
            })
        })

        // describe('run', () => {
        //     it('pings the provided resource', async () => {
        //         const pingSpy = jest
        //             .spyOn(stability, 'ping')
        //             .mockImplementation(async () => false)
        //         await monitor.run()

        //         expect(pingSpy).toHaveBeenCalledTimes(1)
        //         expect(pingSpy).toHaveBeenLastCalledWith('URL')
        //     })
        // })
    })
})
