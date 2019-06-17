import { NetworkStatus } from '../constants'

const delay = async interval => {
    return await new Promise(done => setTimeout(() => done(), interval))
}

const ping = async resource => {
    try {
        await fetch(resource)
    } catch (e) {
        return false
    }
    return true
}

class StabilitySaga {
    constructor(
        emitter,
        { resource, interval, requestThreshold, durationThreshold },
    ) {
        this.emitter = emitter
        this.resource = resource
        this.interval = interval
        this.requestThreshold = requestThreshold
        this.durationThreshold = durationThreshold
        this.initialize()
    }

    initialize() {
        this.consecutiveSlowRequestCount = 0
        this.paused = false
        this.run()
    }

    pause() {
        this.paused = true
    }

    resume() {
        this.initialize()
    }

    async run() {
        let shouldDelay = true
        const start = window.performance.now()
        const success = await ping(this.resource)
        if (success) {
            if (window.performance.now() - start > this.durationThreshold) {
                this.consecutiveSlowRequestCount++
                if (this.consecutiveSlowRequestCount < this.requestThreshold) {
                    shouldDelay = false
                } else if (
                    this.consecutiveSlowRequestCount ===
                        this.requestThreshold &&
                    !this.paused
                ) {
                    this.emitter.dispatchEvent(NetworkStatus.UNSTABLE)
                }
            } else {
                if (
                    this.consecutiveSlowRequestCount >= this.requestThreshold &&
                    !this.paused
                ) {
                    this.emitter.dispatchEvent(NetworkStatus.STABLE)
                }
                this.consecutiveSlowRequestCount = 0
            }
        }
        shouldDelay && (await delay(this.interval))
        !this.paused && (await this.run())
    }
}

export default StabilitySaga
