import { NetworkStatus } from '../../constants'
import { ServiceDefaults } from './Service.constants'

class ServiceMonitor {
    constructor(
        emitter,
        {
            prefixes = ServiceDefaults.PREFIXES,
            statuses = ServiceDefaults.STATUSES,
            failureThreshold = ServiceDefaults.FAILURE_THRESHOLD,
            decrementTime = ServiceDefaults.DECREMENT_TIME,
        },
    ) {
        this.emitter = emitter
        this.prefixes = prefixes
        this.regexes = prefixes.map(p => new RegExp(p))
        this.statuses = statuses
        this.failureThreshold = failureThreshold
        this.decrementTime = decrementTime

        this.initialize()
    }

    initialize() {
        this.paused = false
        this.failureCounts = {}

        for (const prefix of this.prefixes) {
            this.failureCounts[prefix] = 0
        }
    }

    getPrefixForUrl(url) {
        for (let i = 0; i < this.regexes.length; i++) {
            if (this.regexes[i].test(url)) {
                return this.prefixes[i]
            }
        }
        return undefined
    }

    getCountForPrefix(prefix) {
        return this.failureCounts[prefix]
    }

    increment(prefix) {
        this.failureCounts[prefix]++
    }

    decrement(prefix) {
        this.failureCounts[prefix]--
    }

    waitAndDecrement(prefix) {
        setTimeout(() => {
            if (!this.paused) {
                this.decrement(prefix)
                const count = this.getCountForPrefix(prefix)
                if (count === this.failureThreshold - 1) {
                    this.emitter.dispatchEvent(NetworkStatus.RESOLVED, prefix)
                }
            }
        }, this.decrementTime)
    }

    handleError(url, status) {
        if (!this.paused && this.statuses.includes(status)) {
            const prefix = this.getPrefixForUrl(url)
            this.increment(prefix)
            const count = this.getCountForPrefix(prefix)
            if (count === this.failureThreshold) {
                this.emitter.dispatchEvent(NetworkStatus.DEGRADED, prefix)
            }
            this.waitAndDecrement(prefix)
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
