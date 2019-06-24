import Event from '../../src/events/Event'
import EventEmitter from '../../src/events/EventEmitter'

const eventName = 'test'

describe('EventEmitter', () => {
    let emitter
    beforeEach(() => {
        emitter = new EventEmitter()
    })

    describe('constructor', () => {
        it('initializes with the correct props', () => {
            expect(emitter).toMatchSnapshot()
        })
    })

    describe('registerEvent', () => {
        it('adds event to map', () => {
            emitter.registerEvent(eventName)

            expect(emitter.events[eventName]).toStrictEqual(
                new Event(eventName),
            )
        })
    })

    describe('addEventListener', () => {
        it('adds event callback to map', () => {
            const callback = jest.fn()
            emitter.registerEvent(eventName)
            emitter.addEventListener(eventName, callback)

            expect(emitter.events[eventName].callbacks).toStrictEqual([
                callback,
            ])
        })
    })

    describe('dispatchEvent', () => {
        it('calls event callbacks', () => {
            const callback1 = jest.fn()
            const callback2 = jest.fn()
            emitter.registerEvent(eventName)
            emitter.addEventListener(eventName, callback1)
            emitter.addEventListener(eventName, callback2)
            emitter.dispatchEvent(eventName)

            expect(callback1).toHaveBeenCalled()
            expect(callback2).toHaveBeenCalled()
        })
    })
})
