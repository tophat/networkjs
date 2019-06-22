import { EventEmitter } from './events'
import { NetworkSpeed, NetworkStatuses, Saga, Sagas } from './constants'

import NetworkSaga from './sagas/network'
import ServiceSaga from './sagas/service'
import StabilitySaga from './sagas/stability'

const _registerNetworkStatusEvents = emitter => {
    NetworkStatuses.forEach(s => {
        emitter.registerEvent(s)
    })
}

const _startNetworkSaga = emitter => {
    return new NetworkSaga(emitter)
}

const _startServiceSaga = (emitter, config) => {
    if (!emitter) return null

    const { prefixes = [], statuses = [502, 503, 504] } = config
    return new ServiceSaga(emitter, {
        prefixes,
        statuses,
    })
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
    constructor({ service = null, stability = {} } = {}) {
        this.eventEmitter = new EventEmitter()
        _registerNetworkStatusEvents(this.eventEmitter)
        this.sagas = {
            [Saga.NETWORK]: _startNetworkSaga(this.eventEmitter),
            [Saga.SERVICE]: _startServiceSaga(this.eventEmitter, service),
            [Saga.STABILITY]: _startStabilitySaga(this.eventEmitter, stability),
        }
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

    service(prefix, status) {
        if (!this.sagas[Saga.SERVICE]) {
            throw new Error(`Service saga not configured`)
        }

        this.sagas[Saga.SERVICE].handleError(prefix, status)
    }

    pause(saga) {
        Sagas.filter(s => !saga || s === saga).forEach(s => {
            this.sagas[s] && this.sagas[s].pause()
        })
    }

    resume(saga) {
        Sagas.filter(s => !saga || s === saga).forEach(s => {
            this.sagas[s] && this.sagas[s].resume()
        })
    }
}

export default Network
