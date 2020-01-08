import {
    ErrorMessage,
    Monitor,
    Monitors,
    NetworkStatus,
    NetworkStatuses,
} from './constants'
import Network from './index'
import NetworkMonitor from './monitors/network'
import ServiceMonitor from './monitors/service'
import StabilityMonitor from './monitors/stability'

jest.mock('./events/EventEmitter')
jest.mock('./monitors/service')
jest.mock('./monitors/stability')
jest.mock('./monitors/network')

describe('Network', () => {
    let monitor

    beforeEach(() => {
        delete window.PerformanceObserver
        monitor = new Network()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('initializes stability monitor to null when no PerformanceObserver is present', () => {
            expect(monitor.monitors[Monitor.STABILITY]).toBeNull()
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
                monitor.on('INVALID', jest.fn)
            }).toThrow(ErrorMessage.INVALID_EVENT)
        })

        it.each(
            NetworkStatuses,
            'adds an EventListener to the $networkStatus monitor eventEmitter',
            ({ networkStatus }) => {
                monitor.on(networkStatus, jest.fn)

                expect(
                    monitor.eventEmitter.addEventListener,
                ).toHaveBeenCalledWith(networkStatus, expect.any(Function))
            },
        )
    })

    describe('all', () => {
        it('Adds an EventListener for each NetworkStatus', () => {
            monitor.all(jest.fn)
            expect(monitor.eventEmitter.addEventListener).toHaveBeenCalledWith(
                expect.stringMatching(
                    `/${NetworkStatus.ONLINE}|${NetworkStatus.OFFLINE}|${NetworkStatus.DEGRADED}|${NetworkStatus.RESOLVED}|${NetworkStatus.UNSTABLE}|${NetworkStatus.STABLE}/g`,
                ),
                expect.any(Function),
            )
        })
    })

    describe('serviceError', () => {
        it('Calls handleError from the service monitor', () => {
            monitor.serviceError('/api/resource/1', 502)
            expect(
                monitor.monitors[Monitor.SERVICE].handleError,
            ).toHaveBeenCalled()
        })
    })

    describe('pause', () => {
        it('calls pause on the given monitor', () => {
            monitor.pause(Monitor.SERVICE)
            expect(
                monitor.monitors[Monitor.SERVICE].pause,
            ).toHaveBeenCalledTimes(1)
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
            monitor.resume(Monitor.SERVICE)
            expect(
                monitor.monitors[Monitor.SERVICE].resume,
            ).toHaveBeenCalledTimes(1)
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
