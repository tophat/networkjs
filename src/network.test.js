import { NetworkStatuses, Monitor, Monitors } from './constants'
import EventEmitter from './events/EventEmitter'
import NetworkMonitor from './monitors/network'
import StabilityMonitor from './monitors/stability'
import ServiceMonitor from './monitors/service'
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
        //TODO: test that the error matches - also put that error in a constants file 
        it('throws error on string not in NetworkStatuses', () => {
            expect(() => {
                monitor.on('INVALID', jest.fn)
            }).toThrow(Error)
        })
        //TODO:test matching args and use it.each to test each NetworkStatus
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
            //DONE: replace args 
            monitor.serviceError('/api/resource/1', 502)
            expect(
                monitor.monitors[Monitor.SERVICE].handleError,
            ).toHaveBeenCalled()
        })
    })
   //TODO: implement example 
    //describe('test Button component', () => {
    //  it.each`
    //    propName       | propValue | className       | result
    //    ${'isPrimary'} | ${true}   | ${'is-primary'} | ${true}
    //    ${'isDanger'}  | ${true}   | ${'is-danger'}  | ${true}
    //    ${'isSuccess'} | ${true}   | ${'is-success'} | ${true}
    //  `('should have class $className when prop $propName is equal to $propValue', ({propName, propValue, className, result}) => {
    //    props = { ...props, [propName]: propValue };
    //    const enzymeWrapper = shallow(<Button {...props} />);    expect(enzymeWrapper.hasClass(className)).toEqual(result);
    //  });
    //});
    
    describe('pause', () => {
        it('calls pause on the given monitor', () => {
            monitor.pause(Monitor.SERVICE)
            expect(monitor.monitors[Monitor.SERVICE].pause).toHaveBeenCalledTimes(1)
        })
        
        it('calls pause on all monitors', () => {
            monitor.pause()
            //this is the big WTF 
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
