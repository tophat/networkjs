export const ServiceDefaults = {
    DEFINITIONS: [
        {
            name: '*',
            regex: new RegExp('.*'),
        },
    ],
    STATUSES: [502, 503, 504],
    FAILURE_THRESHOLD: 2,
    DECREMENT_TIME: 10000,
}
