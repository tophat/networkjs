import { NetworkStatus } from '../../constants'
import { StabilityDefaults } from './Stability.constants'

class StabilityMonitor {
    constructor(
        emitter,
        {
            maxBufferSize = StabilityDefaults.MAX_BUFFER_SIZE,
            speedThreshold = StabilityDefaults.SPEED_THRESHOLD,
        } = {},
    ) {
        this.emitter = emitter
        this.maxBufferSize = maxBufferSize
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

    _addEntry(entry) {
        const { responseStart, responseEnd, transferSize } = entry
        const duration = responseEnd - responseStart
        this.entryBuffer.push({
            duration,
            transferSize,
        })
        this.durationTotal += duration
        this.transferSizeTotal += transferSize
    }

    _removeOverflowEntry() {
        const { duration, transferSize } = this.entryBuffer.shift()
        this.durationTotal -= duration
        this.transferSizeTotal -= transferSize
    }

    _emitStabilityChanges() {
        const isThresholdHit =
            this.transferSizeTotal / this.durationTotal < this.speedThreshold
        if (this.isStable && isThresholdHit) {
            this.isStable = false
            this.emitter.dispatchEvent(NetworkStatus.UNSTABLE)
        } else if (!this.isStable && !isThresholdHit) {
            this.isStable = true
            this.emitter.dispatchEvent(NetworkStatus.STABLE)
        }
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

            this._addEntry(currentEntry)

            if (this.entryBuffer.length > this.maxBufferSize) {
                this._removeOverflowEntry()
                this._emitStabilityChanges()
            }
        }
    }
}

export default StabilityMonitor
