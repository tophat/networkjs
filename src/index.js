import { EventEmitter } from './events'
import { NetworkStatuses, Monitor, Monitors } from './constants'

import NetworkMonitor from './monitors/network'
import ServiceMonitor from './monitors/service'
import StabilityMonitor from './monitors/stability'

const _registerNetworkStatusEvents = emitter => {
    NetworkStatuses.forEach(s => {
        emitter.registerEvent(s)
    })
}

const _monitorNetwork = emitter => {
    return new NetworkMonitor(emitter)
}

const _monitorService = (emitter, config) => {
    return new ServiceMonitor(emitter, config)
}

const _monitorStability = (emitter, config) => {
    if (!('performance' in window && 'PerformanceObserver' in window))
        return null

    return new StabilityMonitor(emitter, config)
}

class Network {
    constructor({
        service: serviceConfig = {},
        stability: stabilityConfig = {},
    } = {}) {
        this.eventEmitter = new EventEmitter()
        _registerNetworkStatusEvents(this.eventEmitter)
        this.monitors = {
            [Monitor.NETWORK]: _monitorNetwork(this.eventEmitter),
            [Monitor.SERVICE]: _monitorService(
                this.eventEmitter,
                serviceConfig,
            ),
            [Monitor.STABILITY]: _monitorStability(
                this.eventEmitter,
                stabilityConfig,
            ),
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

    serviceError(url, status) {
        if (!this.monitors[Monitor.SERVICE]) {
            throw new Error(`Service monitor not configured`)
        }

        this.monitors[Monitor.SERVICE].handleError(url, status)
    }

    pause(monitor) {
        Monitors.filter(m => !monitor || m === monitor).forEach(m => {
            this.monitors[m] && this.monitors[m].pause()
        })
    }

    resume(monitor) {
        Monitors.filter(m => !monitor || m === monitor).forEach(m => {
            this.monitors[m] && this.monitors[m].resume()
        })
    }
}

export default Network
