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
        this.weightDivisor = (this.maxBufferSize * (this.maxBufferSize + 1)) / 2
        this.speedThreshold = speedThreshold
        this.isStable = true
        this.run = this.run.bind(this)
        this.observer = new window.PerformanceObserver(this.run)
        this.initialize()
    }

    initialize() {
        this.entryBuffer = []
        this.runningSpeedTotal = 0
        this.observer.observe({ entryTypes: ['resource'] })
    }

    pause() {
        this.observer.disconnect()
    }

    resume() {
        this.initialize()
    }

    _adjustEntryWeights() {
        for (const speed of this.entryBuffer) {
            this.runningSpeedTotal -= speed
        }
    }

    _addEntry(entry) {
        const { responseStart, responseEnd, transferSize } = entry
        const speed = transferSize / (responseEnd - responseStart)
        this.entryBuffer.push(speed)
        this.runningSpeedTotal += this.maxBufferSize * speed
    }

    _removeOverflowEntry() {
        this.entryBuffer.shift()
    }

    _emitStabilityChanges() {
        const isThresholdHit =
            this.runningSpeedTotal / this.weightDivisor < this.speedThreshold
        if (this.isStable && isThresholdHit) {
            this.isStable = false
            this.emitter.dispatchEvent(NetworkStatus.UNSTABLE)
        } else if (!this.isStable && !isThresholdHit) {
            this.isStable = true
            this.emitter.dispatchEvent(NetworkStatus.STABLE)
        }
    }

    get isOverMaxBufferSize() {
        return this.entryBuffer.length > this.maxBufferSize
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

            this._adjustEntryWeights()
            this._addEntry(currentEntry)

            if (this.isOverMaxBufferSize) {
                this._removeOverflowEntry()
                this._emitStabilityChanges()
            }
        }
    }
}

export default StabilityMonitor
