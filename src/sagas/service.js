import { NetworkStatus } from '../constants'

class ServiceSaga {
    constructor(
        emitter,
        { prefixes, statuses, failureThreshold, decrementTime },
    ) {
        this.emitter = emitter
        this.prefixes = prefixes
        this.statuses = statuses
        this.failureThreshold = failureThreshold
        this.decrementTime = decrementTime

        this.initialize()
    }

    initialize() {
        this.paused = false
        this.failures = this.prefixes.reduce((p, obj) => {
            obj[p] = 0
        }, {})
    }

    handleError(prefix, status) {
        if (!this.paused && this.statuses.includes(status)) {
            this.failures[prefix]++
            if (this.failures[prefix] >= this.failureThreshold) {
                this.emitter.dispatchEvent(NetworkStatus.DEGRADED, prefix)
            }

            setTimeout(() => {
                if (!this.paused) {
                    this.failures[prefix]--
                    if (this.failures[prefix] < this.failureThreshold) {
                        this.emitter.dispatchEvent(
                            NetworkStatus.RESOLVED,
                            prefix,
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
