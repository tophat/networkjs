import StabilityMonitor from '.'
import EventEmitter from '../../events/EventEmitter'
import { NetworkStatus } from '../../constants'

jest.mock('../../events/EventEmitter')

const MAX_BUFFER_SIZE = 5
const SPEED_THRESHOLD = 50

describe('Stability Monitor', () => {
    window.PerformanceObserver = jest.fn(() => ({
        observe: jest.fn(),
        disconnect: jest.fn(),
    }))

    let monitor
    const emitter = new EventEmitter()

    beforeEach(() => {
        monitor = new StabilityMonitor(emitter, {
            maxBufferSize: MAX_BUFFER_SIZE,
            speedThreshold: SPEED_THRESHOLD,
        })
    })

    describe('constructor', () => {
        it('initializes with the correct props', () => {
            expect(monitor).toMatchSnapshot()
            expect(window.PerformanceObserver).toHaveBeenCalled()
        })
    })

    describe('initialize', () => {
        it('sets some default properties and starts observing', () => {
            const observeSpy = jest.spyOn(monitor.observer, 'observe')
            monitor.initialize()

            expect(monitor.entryBuffer).toStrictEqual([])
            expect(monitor.durationTotal).toBe(0)
            expect(monitor.transferSizeTotal).toBe(0)
            expect(observeSpy).toHaveBeenCalledWith({
                entryTypes: ['resource'],
            })
        })
    })

    describe('pause', () => {
        it('sets paused to true', () => {
            const disconnectSpy = jest.spyOn(monitor.observer, 'disconnect')
            monitor.pause()

            expect(disconnectSpy).toHaveBeenCalled()
        })
    })

    describe('resume', () => {
        it('re-initializes monitor', () => {
            const initializeSpy = jest.spyOn(monitor, 'initialize')
            monitor.resume()

            expect(initializeSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('run', () => {
        const VALID_ENTRY_LENGTH = MAX_BUFFER_SIZE - 1
        const DEFAULT_ENTRY = {
            transferSize: 500,
            responseStart: 900,
            responseEnd: 1000,
        }

        const makeList = (
            entryLength = VALID_ENTRY_LENGTH,
            entry = DEFAULT_ENTRY,
        ) => ({
            getEntries: () => Array(entryLength).fill(entry),
        })

        it('discards entries missing information', () => {
            const invalidEntry = {}
            monitor.run(makeList(VALID_ENTRY_LENGTH, invalidEntry))

            expect(monitor.entryBuffer).toHaveLength(0)
        })

        it('pushes entries and adds them to totals', () => {
            monitor.run(makeList())

            expect(monitor.durationTotal).toBe(
                VALID_ENTRY_LENGTH *
                    (DEFAULT_ENTRY.responseEnd - DEFAULT_ENTRY.responseStart),
            )
            expect(monitor.transferSizeTotal).toBe(
                VALID_ENTRY_LENGTH * DEFAULT_ENTRY.transferSize,
            )
        })

        it('Remove overflow entries from totals', () => {
            monitor.run(makeList(MAX_BUFFER_SIZE + 1))

            expect(monitor.durationTotal).toBe(
                MAX_BUFFER_SIZE *
                    (DEFAULT_ENTRY.responseEnd - DEFAULT_ENTRY.responseStart),
            )
            expect(monitor.transferSizeTotal).toBe(
                MAX_BUFFER_SIZE * DEFAULT_ENTRY.transferSize,
            )
        })

        it('Emits network events on stability change', () => {
            monitor.run(
                makeList(MAX_BUFFER_SIZE + 1, {
                    transferSize: 500,
                    responseStart: 900,
                    responseEnd: 1000,
                }),
            )

            expect(monitor.isStable).toBe(false)
            expect(monitor.emitter.dispatchEvent).toHaveBeenCalledWith(
                NetworkStatus.UNSTABLE,
            )

            monitor.run(
                makeList(MAX_BUFFER_SIZE + 1, {
                    transferSize: 50,
                    responseStart: 90,
                    responseEnd: 100,
                }),
            )

            expect(monitor.isStable).toBe(true)
            expect(monitor.emitter.dispatchEvent).toHaveBeenCalledWith(
                NetworkStatus.STABLE,
            )
        })
    })
})
