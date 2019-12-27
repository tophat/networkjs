import StabilityMonitor from '.'
import EventEmitter from '../../events/EventEmitter'

describe('Stability Monitor', () => {
    window.PerformanceObserver = jest.fn(() => ({
        observe: jest.fn(),
        disconnect: jest.fn(),
    }))

    let monitor
    const emitter = new EventEmitter()

    beforeEach(() => {
        monitor = new StabilityMonitor(emitter, {
            runningRequestCount: 5,
            speedThreshold: 50,
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
            const initializeSpy = (StabilityMonitor.prototype.initialize = jest.fn())
            monitor.resume()

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
