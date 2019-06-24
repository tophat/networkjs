import { NetworkStatus } from '../../constants'

class NetworkMonitor {
    constructor(emitter) {
        this.emitter = emitter
        this.emitOnlineEvent = () => {
            this.emitter.dispatchEvent(NetworkStatus.ONLINE)
        }
        this.emitOfflineEvent = () => {
            this.emitter.dispatchEvent(NetworkStatus.OFFLINE)
        }
        this.initialize()
    }

    initialize() {
        window.addEventListener('online', this.emitOnlineEvent)
        window.addEventListener('offline', this.emitOfflineEvent)
    }

    pause() {
        window.removeEventListener('online', this.emitOnlineEvent)
        window.removeEventListener('offline', this.emitOfflineEvent)
    }

    resume() {
        this.initialize()
    }
}

export default NetworkMonitor
