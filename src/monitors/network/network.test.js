import NetworkMonitor from '.'
import EventEmitter from '../../events/EventEmitter'

describe('Network Monitor', () => {
    describe('NetworkMonitor', () => {
        let monitor
        const emitter = new EventEmitter()

        beforeEach(() => {
            monitor = new NetworkMonitor(emitter)
        })

        afterEach(() => {
            jest.clearAllMocks()
        })

        describe('constructor', () => {
            it('initializes with the correct props', () => {
                expect(monitor).toMatchSnapshot()
            })
        })

        describe('initialize', () => {
            it('adds two event listeners to the window', () => {
                window.addEventListener = jest.fn()
                monitor.initialize()

                expect(window.addEventListener).toHaveBeenCalledTimes(2)
            })
        })

        describe('pause', () => {
            it('removes two event listeners to the window', () => {
                window.removeEventListener = jest.fn()
                monitor.pause()

                expect(window.removeEventListener).toHaveBeenCalledTimes(2)
            })
        })

        describe('resume', () => {
            it('runs initalize which adds two event listeners', () => {
                window.addEventListener = jest.fn()
                const initializeSpy = jest.spyOn(monitor, 'initialize')
                monitor.resume()

                expect(window.addEventListener).toHaveBeenCalledTimes(2)
                expect(initializeSpy).toHaveBeenCalled()
            })
        })
    })
})
