import { NetworkStatus } from '../../constants'
import { StabilityDefaults } from './Stability.constants'

class StabilityMonitor {
    constructor(
        emitter,
        {
            runningRequestCount = StabilityDefaults.RUNNING_REQUEST_COUNT,
            speedThreshold = StabilityDefaults.SPEED_THRESHOLD,
        },
    ) {
        this.emitter = emitter
        this.runningRequestCount = runningRequestCount
        this.speedThreshold = speedThreshold
        this.isStable = true
        this.run = this.run.bind(this)
        this.observer = new window.PerformanceObserver(this.run)
        this.initialize()
    }

    initialize() {
        this.entryBuffer = []
        this.durationTotal = 0
        this.transferSizeTotal = 0
        this.observer.observe({ entryTypes: ['resource'] })
    }

    pause() {
        this.observer.disconnect()
    }

    resume() {
        this.initialize()
    }

    run(list) {
        for (const currentEntry of list.getEntries()) {
            // Discard entries with missing information (CORS)
            if (
                !currentEntry.transferSize ||
                !currentEntry.responseEnd ||
                !currentEntry.responseStart
            )
                continue

            // Add entries to buffer and totals
            this.entryBuffer.push(currentEntry)
            this.durationTotal +=
                currentEntry.responseEnd - currentEntry.responseStart
            this.transferSizeTotal += currentEntry.transferSize

            // Remove overflow entry (if any) from totals
            if (this.entryBuffer.length > this.runningRequestCount) {
                const overflowEntry = this.entryBuffer.shift()
                this.durationTotal -=
                    overflowEntry.responseEnd - overflowEntry.responseStart
                this.transferSizeTotal -= currentEntry.transferSize

                // Emit stability changes
                const thresholdHit =
                    this.transferSizeTotal / this.durationTotal <
                    this.speedThreshold
                if (this.isStable && thresholdHit) {
                    this.isStable = false
                    this.emitter.dispatchEvent(NetworkStatus.UNSTABLE)
                } else if (!this.isStable && !thresholdHit) {
                    this.isStable = true
                    this.emitter.dispatchEvent(NetworkStatus.STABLE)
                }
            }
        }
    }
}

export default StabilityMonitor
