import EventEmitter from '../../events/EventEmitter'
import { NetworkStatus } from '../../constants'
import StabilityMonitor from '.'

jest.mock('../../events/EventEmitter')

const MAX_BUFFER_SIZE = 5
const MAX_BUFFER_DIVISOR = 15
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
            expect(monitor.runningSpeedTotal).toBe(0)
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

        const makeList = ({
            entryLength = VALID_ENTRY_LENGTH,
            entry = DEFAULT_ENTRY,
            entries = [],
        }) => ({
            getEntries: () =>
                entries.length ? entries : Array(entryLength).fill(entry),
        })

        it('discards entries missing information', () => {
            const entry = {}
            monitor.run(
                makeList({
                    entryLength: VALID_ENTRY_LENGTH,
                    entry,
                }),
            )

            expect(monitor.entryBuffer).toHaveLength(0)
        })

        it('pushes entries onto buffer and adds them to the weighted average totals', () => {
            monitor.maxBufferSize = 3
            const entries = [
                {
                    transferSize: 500,
                    responseStart: 100,
                    responseEnd: 150,
                    speed: 500 / 50,
                },
                {
                    transferSize: 1000,
                    responseStart: 100,
                    responseEnd: 150,
                    speed: 1000 / 50,
                },
                {
                    transferSize: 100,
                    responseStart: 100,
                    responseEnd: 150,
                    speed: 100 / 50,
                },
            ]

            monitor.run(
                makeList({
                    entries,
                }),
            )

            expect(monitor.entryBuffer).toHaveLength(3)
            expect(monitor.runningSpeedTotal).toBe(
                3 * entries[2].speed +
                    2 * entries[1].speed +
                    1 * entries[0].speed,
            )
        })

        it('Removes overflow entries from buffer and totals', () => {
            monitor.run(makeList({ entryLength: MAX_BUFFER_SIZE + 1 }))

            expect(monitor.entryBuffer).toHaveLength(MAX_BUFFER_SIZE)
            expect(monitor.runningSpeedTotal).toBe(
                MAX_BUFFER_DIVISOR * (500 / 100),
            )
        })

        it('Emits network events on stability change', () => {
            expect(monitor.isStable).toBe(true)

            monitor.run(
                makeList({
                    entryLength: MAX_BUFFER_SIZE + 1,
                    entry: {
                        transferSize: 500,
                        responseStart: 10,
                        responseEnd: 2010,
                    },
                }),
            )

            expect(monitor.isStable).toBe(false)
            expect(monitor.emitter.dispatchEvent).toHaveBeenCalledWith(
                NetworkStatus.UNSTABLE,
            )

            monitor.run(
                makeList({
                    entryLength: MAX_BUFFER_SIZE + 1,
                    entry: {
                        transferSize: 500,
                        responseStart: 10,
                        responseEnd: 11,
                    },
                }),
            )

            expect(monitor.isStable).toBe(true)
            expect(monitor.emitter.dispatchEvent).toHaveBeenCalledWith(
                NetworkStatus.STABLE,
            )
        })
    })
})
