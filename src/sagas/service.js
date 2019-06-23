import { NetworkStatus } from '../constants'

class ServiceSaga {
    constructor(
        emitter,
        { prefixes, statuses, failureThreshold, decrementTime },
    ) {
        this.emitter = emitter
        this.prefixes = prefixes
        if (
            Array.isArray(prefixes) &&
            prefixes.every(p => typeof p === 'string')
        ) {
            this.isPrefixArray = true
            this.regexes = prefixes.map(p => new RegExp(p))
            this.failureCounts = prefixes.reduce((obj, p) => {
                obj[p] = 0
            }, {})
        } else if (prefixes === '*') {
            this.isPrefixArray = false
            this.failureCount = 0
        } else {
            throw new Error(`prefixes must be an array or '*'`)
        }
        this.statuses = statuses
        this.failureThreshold = failureThreshold
        this.decrementTime = decrementTime

        this.initialize()
    }

    initialize() {
        this.paused = false
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
    }

    getCountForUrl(url) {
        return this.isPrefixArray
            ? this.failureCounts[this.getPrefixForUrl(url)]
            : this.failureCount
    }

    increment(url) {
        if (this.isPrefixArray) {
            this.failureCounts[this.getPrefixForUrl(url)]++
        } else {
            this.failureCount++
        }
    }

    decrement(url) {
        if (this.isPrefixArray) {
            this.failureCounts[this.getPrefixForUrl(url)]--
        } else {
            this.failureCount--
        }
    }

    handleError(url, status) {
        if (!this.paused && this.statuses.includes(status)) {
            this.increment()
            if (this.getCountForUrl(url) >= this.failureThreshold) {
                this.emitter.dispatchEvent(
                    NetworkStatus.DEGRADED,
                    this.getPrefixForUrl(url),
                )
            }

            setTimeout(() => {
                if (!this.paused) {
                    this.decrement()
                    if (this.getCountForUrl(url) < this.failureThreshold) {
                        this.emitter.dispatchEvent(
                            NetworkStatus.RESOLVED,
                            this.getPrefixForUrl(url),
                        )
                    }
                }
            }, this.decrementTime)
        }
    }

    pause() {
        this.paused = true
    }

    resume() {
        this.initialize()
    }
}

export default ServiceSaga
