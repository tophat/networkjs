import { EventEmitter } from './events'
import { NetworkSpeed, NetworkStatuses } from './constants'

import NetworkSaga from './sagas/network'
import StabilitySaga from './sagas/stability'

const _registerNetworkStatusEvents = emitter => {
    NetworkStatuses.forEach(s => {
        emitter.registerEvent(s)
    })
}

const _startNetworkSaga = emitter => {
    return new NetworkSaga(emitter)
}

const _startStabilitySaga = (
    emitter,
    {
        resource = null,
        interval = NetworkSpeed.INTERVAL,
        requestThreshold = NetworkSpeed.REQUEST_THRESHOLD,
        durationThreshold = NetworkSpeed.DURATION_THRESHOLD,
    },
) => {
    if (!resource || typeof resource !== 'string') return null

    return new StabilitySaga(emitter, {
        resource,
        interval,
        requestThreshold,
        durationThreshold,
    })
}

class Network {
    constructor({ stabilityConfig = {} }) {
        this.eventEmitter = new EventEmitter()
        _registerNetworkStatusEvents(this.eventEmitter)
        this.networkSaga = _startNetworkSaga(this.eventEmitter)
        this.stabilitySaga = _startStabilitySaga(
            this.eventEmitter,
            stabilityConfig,
        )
    }

    on(event, callback) {
        if (typeof event !== 'string' || !NetworkStatuses.includes(event)) {
            throw new Error(`Event must be one of ${NetworkStatuses}`)
        }

        this.eventEmitter.addEventListener(event, callback)
    }

    all(callback) {
        NetworkStatuses.forEach(s => {
            this.eventEmitter.addEventListener(s, (...args) => {
                callback(s, ...args)
            })
        })
    }

    pause() {
        this.networkSaga.pause()
        if (this.stabilitySaga) this.stabilitySaga.pause()
    }

    resume() {
        this.networkSaga.resume()
        if (this.stabilitySaga) this.stabilitySaga.resume()
    }
}

export default Network
