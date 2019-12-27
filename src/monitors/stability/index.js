import { NetworkStatus } from '../../constants'
import { StabilityDefaults } from './Stability.constants'
// TODO note about cors
class StabilityMonitor {
    constructor(
        emitter,
        {
            durationThreshold = StabilityDefaults.DURATION_THRESHOLD,
            runningRequestCount = StabilityDefaults.RUNNING_REQUEST_COUNT,
        },
    ) {
        this.emitter = emitter
        this.durationThreshold = durationThreshold
        this.runningRequestCount = runningRequestCount
        this.run = this.run.bind(this)
        this.observer = new window.PerformanceObserver(this.run)
        this.initialize()
    }

    initialize() {
        this.requestDurationTotal = 0
        this.transferSizeTotal = 0
        this.currentRequest = window.performance.getEntriesByType(
            'resource',
        ).length
        this.startRequest = this.currentRequest
        this.observer.observe({ entryTypes: ['resource'] })
    }

    pause() {
        this.observer.disconnect()
    }

    resume() {
        this.initialize()
    }

    run(list) {
        const entries = window.performance.getEntriesByType('resource')
        for (const t of list.getEntries()) {
            // Add new entries to totals
            const {
                responseStart: nextResponseStart,
                responseEnd: nextResponseEnd,
                transferSize: nextTransferSize,
            } = t
            this.requestDurationTotal += nextResponseEnd - nextResponseStart
            this.transferSizeTotal += nextTransferSize

            // Remove overflow entry (if any) from totals
            if (
                this.currentRequest - this.startRequest >
                this.runningRequestCount
            ) {
                const {
                    responseStart: overflowResponseStart,
                    responseEnd: overflowResponseEnd,
                    transferSize: overflowTransferSize,
                } = entries[
                    this.currentRequest - (this.runningRequestCount + 1)
                ]
                this.requestDurationTotal -=
                    overflowResponseEnd - overflowResponseStart
                this.transferSizeTotal -= overflowTransferSize

                // Determine network connectivity
                console.log(
                    `
MARK
                    this.transferSizeTotal: ${this.transferSizeTotal}
                    this.requestDurationTotal: ${this.requestDurationTotal}
                    calc: ${this.transferSizeTotal / this.requestDurationTotal}
                    `,
                )
                if (this.transferSizeTotal / this.requestDurationTotal > 2000) {
                    this.emitter.dispatchEvent(NetworkStatus.UNSTABLE)
                } else {
                    this.emitter.dispatchEvent(NetworkStatus.STABLE)
                }
            }

            // Increment counter
            this.currentRequest++
        }
    }
}

export default StabilityMonitor
