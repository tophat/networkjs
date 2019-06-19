// import { NetworkStatus } from '../constants'
import * as stability from '../../src/sagas/stability'
import EventEmitter from '../../src/events/EventEmitter'

const delay = stability.delay
const ping = stability.ping
const StabilitySaga = stability.default

describe('Stability Saga', () => {
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

    describe('StabilitySaga', () => {
        let saga
        const emitter = new EventEmitter()

        beforeEach(() => {
            saga = new StabilitySaga(emitter, {
                resource: 'URL',
                interval: 5000,
                requestThreshold: 2000,
                durationThreshold: 2,
            })
        })

        describe('constructor', () => {
            it('initializes with the correct props', () => {
                expect(saga).toMatchSnapshot()
            })
        })

        describe('initialize', () => {
            it('sets some default properties and runs saga', () => {
                const runSpy = (StabilitySaga.prototype.run = jest.fn())
                saga.initialize()

                expect(saga.consecutiveSlowRequestCount).toBe(0)
                expect(saga.paused).toBe(false)
                expect(runSpy).toHaveBeenCalledTimes(1)
            })
        })

        describe('pause', () => {
            it('sets paused to true', () => {
                saga.pause()

                expect(saga.paused).toBe(true)
            })
        })

        describe('resume', () => {
            it('re-initializes saga', () => {
                const initializeSpy = (StabilitySaga.prototype.initialize = jest.fn())
                saga.resume()

                expect(saga.consecutiveSlowRequestCount).toBe(0)
                expect(saga.paused).toBe(false)
                expect(initializeSpy).toHaveBeenCalledTimes(1)
            })
        })

        describe('run', () => {
            it('pings the provided resource', async () => {
                const pingSpy = jest
                    .spyOn(stability, 'ping')
                    .mockImplementation(() => false)
                await saga.run()

                expect(pingSpy).toHaveBeenCalledTimes(1)
                expect(pingSpy).toHaveBeenLastCalledWith(URL)
            })
        })
    })
})

/*
class StabilitySaga {

    async run() {
        let shouldDelay = true
        const start = window.performance.now()
        const success = await ping(this.resource)
        if (success) {
            if (window.performance.now() - start > this.durationThreshold) {
                this.consecutiveSlowRequestCount++
                if (this.consecutiveSlowRequestCount < this.requestThreshold) {
                    shouldDelay = false
                } else if (
                    this.consecutiveSlowRequestCount ===
                        this.requestThreshold &&
                    !this.paused
                ) {
                    this.emitter.dispatchEvent(NetworkStatus.UNSTABLE)
                }
            } else {
                if (
                    this.consecutiveSlowRequestCount >= this.requestThreshold &&
                    !this.paused
                ) {
                    this.emitter.dispatchEvent(NetworkStatus.STABLE)
                }
                this.consecutiveSlowRequestCount = 0
            }
        }
        shouldDelay && (await delay(this.interval))
        !this.paused && (await this.run())
    }
}

export default StabilitySaga
*/
