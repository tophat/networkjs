import { Monitor, Monitors, NetworkStatuses } from './constants'

import Network from './index'

describe('Network', () => {
    let monitor

    beforeEach(() => {
        monitor = new Network()
        monitor.eventEmitter.addEventListener = jest.fn()
        monitor.monitors[Monitor.SERVICE].handleError = jest.fn()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('initializes with the correct props', () => {
            expect(monitor).toMatchSnapshot()
        })
    })

    describe('on', () => {
        it('throws error on bad input', () => {
            expect(() => {
                monitor.on({}, jest.fn)
            }).toThrow(Error)
        })
        it('throws error on string not in NetworkStatuses', () => {
            expect(() => {
                monitor.on('INVALID', jest.fn)
            }).toThrow(Error)
        })
        it('adds an EventListener to the monitor eventEmitter', () => {
            monitor.on('online', jest.fn)
            expect(monitor.eventEmitter.addEventListener).toHaveBeenCalledTimes(
                1,
            )
        })
    })

    describe('all', () => {
        it('Adds an EventListener for each NetworkStatus', () => {
            monitor.all(jest.fn)
            expect(monitor.eventEmitter.addEventListener).toHaveBeenCalledTimes(
                NetworkStatuses.length,
            )
        })
    })

    describe('serviceError', () => {
        it('Calls handleError from the service monitor', () => {
            monitor.serviceError('', {})
            expect(
                monitor.monitors[Monitor.SERVICE].handleError,
            ).toHaveBeenCalled()
        })
    })

    describe('pause', () => {
        it('calls pause on the given monitor', () => {
            const pauseSpy = jest.spyOn(
                monitor.monitors[Monitor.SERVICE],
                'pause',
            )
            monitor.pause(Monitor.SERVICE)
            expect(pauseSpy).toHaveBeenCalledTimes(1)
        })

        it('calls pause on all monitors', () => {
            const pauseSpies = []

            Monitors.forEach(m => {
                pauseSpies[m] = () => jest.spyOn(monitor.monitors[m], 'pause')
            })

            monitor.pause()

            pauseSpies.forEach(spy => {
                expect(spy).toHaveBeenCalledTimes(1)
            })
        })
    })

    describe('resume', () => {
        it('calls resume on the given monitor', () => {
            const resumeSpy = jest.spyOn(
                monitor.monitors[Monitor.SERVICE],
                'resume',
            )
            monitor.resume(Monitor.SERVICE)
            expect(resumeSpy).toHaveBeenCalledTimes(1)
        })

        it('calls resume on all monitors', () => {
            const resumeSpies = []

            Monitors.forEach(m => {
                resumeSpies[m] = () => jest.spyOn(monitor.monitors[m], 'resume')
            })

            monitor.resume()

            resumeSpies.forEach(spy => {
                expect(spy).toHaveBeenCalledTimes(1)
            })
        })
    })
})
