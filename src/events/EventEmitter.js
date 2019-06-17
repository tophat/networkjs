import Event from './Event'

export default class EventEmitter {
    constructor() {
        this.events = {}
    }

    registerEvent(eventName) {
        const event = new Event(eventName)
        this.events[eventName] = event
    }

    dispatchEvent(eventName, ...eventArgs) {
        this.events[eventName].callbacks.forEach(callback => {
            callback(...eventArgs)
        })
    }

    addEventListener(eventName, callback) {
        this.events[eventName].registerCallback(callback)
    }
}
