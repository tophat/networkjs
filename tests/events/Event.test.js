import Event from '../../src/events/Event'

const eventName = 'test'

describe('Event', () => {
    let e
    beforeEach(() => {
        e = new Event(eventName)
    })

    describe('constructor', () => {
        it('initializes with the correct props', () => {
            expect(e).toMatchSnapshot()
        })
    })

    describe('registerCallback', () => {
        it('adds callback to event callbacks', () => {
            const callback = jest.fn()
            e.registerCallback(callback)

            expect(e.callbacks).toStrictEqual([callback])
        })
    })
})
