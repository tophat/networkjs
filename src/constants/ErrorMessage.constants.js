import NetworkStatuses from './NetworkStatus.constants'

export const ErrorMessage = {
    INVALID_EVENT: `Event must be one of ${NetworkStatuses}`,
}

export const ErrorMessages = Object.values(ErrorMessage)
