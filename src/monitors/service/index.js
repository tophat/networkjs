import { NetworkStatus } from '../../constants'
import { ServiceDefaults } from './Service.constants'

class ServiceMonitor {
    constructor(
        emitter,
        {
            definitions = ServiceDefaults.DEFINITIONS,
            statuses = ServiceDefaults.STATUSES,
            failureThreshold = ServiceDefaults.FAILURE_THRESHOLD,
            decrementTime = ServiceDefaults.DECREMENT_TIME,
        } = {},
    ) {
        this.emitter = emitter
        this.definitions = definitions
        this.statuses = statuses
        this.failureThreshold = failureThreshold
        this.decrementTime = decrementTime

        this.initialize()
    }

    initialize() {
        this.paused = false
        this.failureCounts = {}

        for (const d of this.definitions) {
            this.failureCounts[d.name] = 0
        }
    }

    getPrefixForUrl(url) {
        for (const d of this.definitions) {
            if (d.regex.test(url)) {
                return d.name
            }
        }
        return undefined
    }

    getCountForPrefix(name) {
        return this.failureCounts[name]
    }

    increment(name) {
        this.failureCounts[name]++
    }

    decrement(name) {
        this.failureCounts[name]--
    }

    waitAndDecrement(name) {
        setTimeout(() => {
            if (!this.paused) {
                this.decrement(name)
                const count = this.getCountForPrefix(name)
                if (count === this.failureThreshold - 1) {
                    this.emitter.dispatchEvent(NetworkStatus.RESOLVED, name)
                }
            }
        }, this.decrementTime)
    }

    handleError(url, status) {
        if (!this.paused && this.statuses.includes(status)) {
            const name = this.getPrefixForUrl(url)
            this.increment(name)
            const count = this.getCountForPrefix(name)
            if (count === this.failureThreshold) {
                this.emitter.dispatchEvent(NetworkStatus.DEGRADED, name)
            }
            this.waitAndDecrement(name)
        }
    }

    pause() {
        this.paused = true
    }

    resume() {
        this.initialize()
    }
}

export default ServiceMonitor
