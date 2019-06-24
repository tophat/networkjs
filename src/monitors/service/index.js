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
        if (
            Array.isArray(prefixes) &&
            prefixes.every(p => typeof p === 'string')
        ) {
            this.isPrefixArray = true
            this.regexes = prefixes.map(p => new RegExp(p))
        } else if (prefixes === '*') {
            this.isPrefixArray = false
        } else {
            throw new Error(`prefixes must be an array or '*'`)
        }
        this.statuses = statuses

        if (typeof failureThreshold === 'number') {
            this.failureThreshold = failureThreshold
        } else {
            throw new Error(`failureThreshold must be a number`)
        }
        this.decrementTime = decrementTime

        this.initialize()
    }

    initialize() {
        this.paused = false
        this.failureCounts = {}
        if (this.isPrefixArray) {
            for (let i = 0; i < this.prefixes.length; i++) {
                this.failureCounts[this.prefixes[i]] = 0
            }
        } else {
            this.failureCount = 0
        }
    }

    getPrefixForUrl(url) {
        if (!this.isPrefixArray) return undefined

        for (let i = 0; i < this.regexes.length; i++) {
            if (this.regexes[i].test(url)) {
                return this.prefixes[i]
            }
        }
        return undefined
    }

    getCountForPrefix(prefix) {
        return this.isPrefixArray
            ? this.failureCounts[prefix]
            : this.failureCount
    }

    increment(prefix) {
        if (this.isPrefixArray) {
            this.failureCounts[prefix]++
        } else {
            this.failureCount++
        }
    }

    decrement(prefix) {
        if (this.isPrefixArray) {
            this.failureCounts[prefix]--
        } else {
            this.failureCount--
        }
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
