import { ErrorMessage, Monitor, Monitors, NetworkStatuses } from './constants'
import Network from './index'
import NetworkMonitor from './monitors/network'
import ServiceMonitor from './monitors/service'
import StabilityMonitor from './monitors/stability'

jest.mock('./events/EventEmitter')
jest.mock('./monitors/service')
jest.mock('./monitors/stability')
jest.mock('./monitors/network')

describe('Network', () => {
    let lib

    beforeEach(() => {
        delete window.PerformanceObserver
        lib = new Network()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('initializes stability monitor to null when no PerformanceObserver is present', () => {
            expect(lib.monitors[Monitor.STABILITY]).toBeNull()
        })

        it.each`
            instanceType         | monitorType
            ${Monitor.SERVICE}   | ${ServiceMonitor}
            ${Monitor.STABILITY} | ${StabilityMonitor}
            ${Monitor.NETWORK}   | ${NetworkMonitor}
        `(
            'initializes with the correct props',
            ({ instanceType, monitorType }) => {
                window.PerformanceObserver = 'arbitraryTest'
                const mon = new Network()
                expect(mon.monitors[instanceType]).toBeInstanceOf(monitorType)
            },
        )
    })

    describe('on', () => {
        it('throws error on string not in NetworkStatuses', () => {
            expect(() => {
                lib.on('INVALID', jest.fn)
            }).toThrow(ErrorMessage.INVALID_EVENT)
        })

        it.each(
            NetworkStatuses,
            'adds an EventListener to the $networkStatus monitor eventEmitter',
            ({ networkStatus }) => {
                const callbackSpy = jest.fn()
                lib.on(networkStatus, callbackSpy)

                expect(lib.eventEmitter.addEventListener).toHaveBeenCalledWith(
                    networkStatus,
                    callbackSpy,
                )
            },
        )
    })

    describe('all', () => {
        it('listens for all network statuses', () => {
            const spy = jest.fn()
            lib.all(spy)

            for (let i = 0; i < NetworkStatuses.length; i++) {
                expect(
                    lib.eventEmitter.addEventListener,
                ).toHaveBeenNthCalledWith(
                    i + 1,
                    NetworkStatuses[i],
                    expect.any(Function),
                )
            }
        })
    })

    describe('serviceError', () => {
        it('Calls handleError from the service monitor', () => {
            lib.serviceError('/api/resource/1', 502)
            expect(
                lib.monitors[Monitor.SERVICE].handleError,
            ).toHaveBeenCalledWith('/api/resource/1', 502)
        })
    })

    describe('pause', () => {
        it('calls pause on the given monitor', () => {
            lib.pause(Monitor.SERVICE)
            expect(lib.monitors[Monitor.SERVICE].pause).toHaveBeenCalledTimes(1)
        })

        it('calls pause on all monitors', () => {
            window.PerformanceObserver = 'arbitraryTest'
            const mon = new Network()
            mon.pause()

            Monitors.forEach(m => {
                expect(mon.monitors[m].pause).toHaveBeenCalledTimes(1)
            })
        })
    })

    describe('resume', () => {
        it('calls resume on the given monitor', () => {
            lib.resume(Monitor.SERVICE)
            expect(lib.monitors[Monitor.SERVICE].resume).toHaveBeenCalledTimes(
                1,
            )
        })

        it('calls resume on all monitors', () => {
            window.PerformanceObserver = 'arbitraryTest'
            const mon = new Network()
            mon.resume()

            Monitors.forEach(m => {
                expect(mon.monitors[m].resume).toHaveBeenCalledTimes(1)
            })
        })
    })
})
