import EventEmitter from '../../events/EventEmitter'
import NetworkMonitor from '.'
import { NetworkStatus } from '../../constants'

jest.mock('../../events/EventEmitter')

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
                // eslint-disable-next-line no-unused-vars
                const { emitter: e, ...otherProps } = monitor
                expect(otherProps).toMatchSnapshot()
            })
        })

        describe('initialize', () => {
            it('adds two event listeners to the window', () => {
                window.addEventListener = jest.fn()
                monitor.initialize()

                expect(window.addEventListener).toHaveBeenCalledTimes(2)
                expect(window.addEventListener).toHaveBeenNthCalledWith(
                    1,
                    'online',
                    monitor.emitOnlineEvent,
                )
                expect(window.addEventListener).toHaveBeenNthCalledWith(
                    2,
                    'offline',
                    monitor.emitOfflineEvent,
                )
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

        describe('event emitter', () => {
            it('dispatches online event on window online', () => {
                monitor.emitOnlineEvent()

                expect(monitor.emitter.dispatchEvent).toHaveBeenCalledWith(
                    NetworkStatus.ONLINE,
                )
            })
            it('dispatches offline event on window offline', () => {
                monitor.emitOfflineEvent()

                expect(monitor.emitter.dispatchEvent).toHaveBeenCalledWith(
                    NetworkStatus.OFFLINE,
                )
            })
        })
    })
})
