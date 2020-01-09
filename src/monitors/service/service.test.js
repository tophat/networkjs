import EventEmitter from '../../events/EventEmitter'
import { NetworkStatus } from '../../constants'
import ServiceMonitor from '.'

jest.mock('../../events/EventEmitter')

const FAILURE_THRESHOLD = 2
const DECREMENT_TIME = 5000

describe('Service Monitor', () => {
    let monitor
    const emitter = new EventEmitter()

    beforeEach(() => {
        jest.useFakeTimers()

        monitor = new ServiceMonitor(emitter, {
            failureThreshold: FAILURE_THRESHOLD,
            decrementTime: DECREMENT_TIME,
        })
    })

    describe('constructor', () => {
        it('initializes with default props', () => {
            monitor = new ServiceMonitor(emitter)
            const {
                /* eslint-disable no-unused-vars */
                emitter: e,
                /* eslint-enable no-unused-vars */
                ...otherProps
            } = monitor
            expect(otherProps).toMatchSnapshot()
        })

        it('initializes with the correct props', () => {
            const {
                /* eslint-disable no-unused-vars */
                emitter: e,
                /* eslint-enable no-unused-vars */
                ...otherProps
            } = monitor
            expect(otherProps).toMatchSnapshot()
        })
    })

    describe('initialize', () => {
        it('initializes failure counts', () => {
            monitor.initialize()

            expect(monitor.paused).toBe(false)
            expect(monitor.failureCounts).toStrictEqual({ '*': 0 })
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
            monitor.pause()
            expect(monitor.paused).toBe(true)

            monitor.resume()
            expect(monitor.paused).toBe(false)
        })
    })

    describe('error handler', () => {
        it('does nothing if paused', () => {
            monitor.pause()
            monitor.handleError('/path/1', 502)

            expect(monitor.failureCounts['*']).toBe(0)
            expect(setTimeout).not.toHaveBeenCalled()
        })

        it('does nothing if status not tracked', () => {
            monitor.handleError('/path/1', 400)

            expect(monitor.failureCounts['*']).toBe(0)
            expect(setTimeout).not.toHaveBeenCalled()
        })

        it('increments failure count and calls waitAndDecrement', () => {
            jest.spyOn(monitor, 'waitAndDecrement')
            monitor.handleError('/path/1', 502)

            expect(monitor.failureCounts['*']).toBe(1)
            expect(monitor.emitter.dispatchEvent).not.toHaveBeenCalled()
            expect(monitor.waitAndDecrement).toHaveBeenCalledTimes(1)
        })

        it('emits service degraded event when threshold is hit', () => {
            jest.spyOn(monitor, 'waitAndDecrement')
            monitor.handleError('/path/1', 502)
            monitor.handleError('/path/1', 502)

            expect(monitor.failureCounts['*']).toBe(2)
            expect(monitor.emitter.dispatchEvent).toHaveBeenCalledWith(
                NetworkStatus.DEGRADED,
                '*',
            )
            expect(monitor.waitAndDecrement).toHaveBeenCalledTimes(2)
        })

        it('does nothing if not tracking path', () => {
            monitor = new ServiceMonitor(emitter, {
                definitions: [
                    {
                        name: 'path 1',
                        regex: new RegExp('/path/1'),
                    },
                ],
            })

            jest.spyOn(monitor, 'waitAndDecrement')
            monitor.handleError('/path/2', 502)

            expect(monitor.failureCounts['path 1']).toBe(0)
            expect(monitor.waitAndDecrement).toHaveBeenCalledTimes(0)
        })
    })

    describe('wait and decrement', () => {
        beforeEach(() => {
            jest.restoreAllMocks()
        })

        it('calls set setTimeout with the provided decrement time', () => {
            monitor.waitAndDecrement('*')

            expect(setTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                DECREMENT_TIME,
            )
        })

        it('does nothing if paused', () => {
            const decrementSpy = jest.spyOn(monitor, 'decrement')

            monitor.pause()
            monitor.waitAndDecrement('*')

            jest.runAllTimers()
            expect(decrementSpy).not.toHaveBeenCalled()
        })

        it('decrements failure count', () => {
            monitor.failureCounts = { '*': 1 }
            monitor.waitAndDecrement('*')

            jest.runAllTimers()
            expect(monitor.failureCounts['*']).toBe(0)
        })

        it('emits service resolved event after falling under threshold', () => {
            monitor.failureCounts = { '*': 2 }
            monitor.waitAndDecrement('*')

            jest.runAllTimers()

            expect(monitor.failureCounts['*']).toBe(1)
            expect(monitor.emitter.dispatchEvent).toHaveBeenCalledWith(
                NetworkStatus.RESOLVED,
                '*',
            )
        })
    })
})
