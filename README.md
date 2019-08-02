# NetworkJS
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)

A utility library that emits network connectivity events

## Installation

```
yarn add networkjs
```

or

```
npm install networkjs
```

This library has no dependencies.

## Usage

```javascript
import Network from 'networkjs'
```

If you're not using ECMAScript modules:

```javascript
const Network = require('networkjs').default
```

This library supports three main use cases:

### Network: Detecting browser offline/online events

These events are enabled by default and do not require any additional configuration.

### Stability: Detecting network unstable/stable events

If you want to receive network stability events, you need to supply a URL to the resource you wish to ping. Please keep in mind that the resource you provide will affect the duration of the ping. If you choose a smaller/larger resource, you should decrease/increase the `durationThreshold` (see below).

```javascript
{
    stability: {
        resource: 'https://path.to.your.resource',
        ...
    }
}
```

`resource`: Resource to ping **(required)**<br />
`interval`: Ping interval **(optional, default 5000ms)**<br />
`durationThreshold`: Maximum duration that dictates a slow request **(optional, default 2000ms)**<br />
`requestThreshold`: Minimum number of consecutive slow requests that dictate an unstable network **(optional, default 2)**<br />

### Service: Detecting 3rd party service degraded/resolved events

If you want to receive service stability events, you can supply an array of URL prefixes for the services you wish to track.

```javascript
{
    service: {
        prefixes: ['prefix1', 'prefix2'],
        ...
    }
}
```

`prefixes`: Array of URL prefixes to track **(optional, defaults to tracking any failures)**<br />
`statuses`: Array of statuses dictating a service degradation **(optional, default [502, 503, 504])**<br />
`failureThreshold`: Minimum number of consecutive failures that dictate a degraded service **(optional, default 2)**<br />
`decrementTime`: Amount of time until a failure is dismissed **(optional, default 10000ms)**<br />

This monitor can be hooked into your current HTTP library. For each request, you feed it the request URL and the response status code, and it will emit events upon hitting the given failure threshold.

```javascript
const Net = new Network({ service = {...} })

this.axios.interceptors.response.use(
    success => success,
    (error) => {
        Net.serviceError(error.requestUrl, error.status)
        return error
    },
)
```

## Example

### Network

You can omit any configuration to just receive network online/offline events.

```javascript
const Net = new Network()

Net.on('online', () => {
    console.log('Network - ONLINE')
})

Net.on('offline', () => {
    console.log('Network - OFFLINE')
})
```

### Stability

```javascript
const Net = new Network({
    stability: {
        resource: 'https://path.to.your.resource'
    }
})

Net.on('unstable', () => {
    console.log('Network - UNSTABLE')
})

Net.on('stable', () => {
    console.log('Network - STABLE')
})
```

### Service

```javascript
const Net = new Network({
    services: {
        prefixes: ['api/v1/resource1', 'api/v2/resource2'],
        statuses: [500, 502, 503, 504]
    }
})

Net.on('degraded', (service) => {
    console.log(`Network - ${service} - DEGRADED`)
})

Net.on('resolved', (service) => {
    console.log(`Network - ${service} - RESOLVED`)
})
```

### All

```javascript
const Net = new Network({
    stability: {
        resource: 'https://path.to.your.resource'
    },
    services: {
        prefixes: ['api/v1/resource1', 'api/v2/resource2'],
        statuses: [500, 502, 503, 504]
    }
})

Net.all((event) => {
    console.log('Network -', event)
})
```

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/jackcohen5"><img src="https://avatars3.githubusercontent.com/u/8365264?v=4" width="100px;" alt="Jack Cohen"/><br /><sub><b>Jack Cohen</b></sub></a><br /><a href="#ideas-jackcohen5" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/tophat/networkjs/commits?author=jackcohen5" title="Code">💻</a></td>
  </tr>
</table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!