import { NetworkStatus, NetworkStatuses, Monitor, Monitors, ErrorMessage } from './constants'
import NetworkMonitor from './monitors/network'
import ServiceMonitor from './monitors/service'
import StabilityMonitor from './monitors/stability'
import EventEmitter from './events/EventEmitter'
import Network from './index'

jest.mock('./events/EventEmitter')
jest.mock('./monitors/service')
jest.mock('./monitors/stability')
jest.mock('./monitors/network')

describe('Network', () => {
    let monitor
    const emitter = new EventEmitter()
    const networkMonitor = new NetworkMonitor() 
    const stabilityMonitor = new StabilityMonitor() 
    const serviceMonitor = new ServiceMonitor() 
    
    beforeEach(() => {
        window.PerformanceObserver = 'arbitraryTest'
        monitor = new Network()
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('constructor', () => {
        it('initializes with the correct props', () => {
            //TODO: refactor this to only check certain properties
            expect(monitor).toMatchSnapshot()
        })
    })

    describe('on', () => {
        it('throws error on string not in NetworkStatuses', () => {
            expect(() => {
                monitor.on('INVALID', jest.fn)
            }).toThrow(`${ErrorMessage.INVALID_EVENT}`)
        })
   
        it.each`
            networkStatus             
            ${NetworkStatus.ONLINE}      
            ${NetworkStatus.OFFLINE}      
            ${NetworkStatus.STABLE}      
            ${NetworkStatus.UNSTABLE}      
            ${NetworkStatus.DEGRADED}      
            ${NetworkStatus.RESOLVED}      
        `('adds an EventListener to the $networkStatus monitor eventEmitter', ({networkStatus}) => {
            monitor.on(networkStatus, jest.fn)
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
            monitor.serviceError('/api/resource/1', 502)
            expect(
                monitor.monitors[Monitor.SERVICE].handleError,
            ).toHaveBeenCalled()
        })
    })
    
    describe('pause', () => {
        it('calls pause on the given monitor', () => {
            monitor.pause(Monitor.SERVICE)
            expect(monitor.monitors[Monitor.SERVICE].pause).toHaveBeenCalledTimes(1)
        })
        
        it('calls pause on all monitors', () => {
            monitor.pause()
            
            Monitors.forEach( m => {
                expect(monitor.monitors[m].pause).toHaveBeenCalledTimes(1)
            })
        })
    })

    describe('resume', () => {
        it('calls resume on the given monitor', () => {
            monitor.resume(Monitor.SERVICE)
            expect(monitor.monitors[Monitor.SERVICE].resume).toHaveBeenCalledTimes(1)
        })

        it('calls resume on all monitors', () => {
            monitor.resume()

            Monitors.forEach(m => {
                expect(monitor.monitors[m].resume).toHaveBeenCalledTimes(1)
            })
        })
    })
})
