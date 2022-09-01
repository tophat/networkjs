# NetworkJS

> ## Deprecation Notice
>
> **As part of general Open Source org housekeeping, and due to lack of interest in this project, we have decided to archive NetworkJS.**
>

---

[![GitHub license](https://img.shields.io/github/license/tophat/networkjs)](https://github.com/tophat/networkjs/blob/master/LICENSE) [![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat)](#contributors)
[![Maturity badge - level 1](https://img.shields.io/badge/Maturity-Level%201%20--%20New%20Project-yellow.svg)](https://github.com/tophat/getting-started/blob/master/scorecard.md)
[![Slack workspace](https://slackinvite.dev.tophat.com/badge.svg)](https://opensource.tophat.com/slack)

[![codecov](https://codecov.io/gh/tophat/networkjs/branch/master/graph/badge.svg)](https://codecov.io/gh/tophat/networkjs)

## Overview

Network JS is a utility library that emits network connectivity events.

## Installation

Min Node Version. 12.16.1

```sh
yarn add git@github.com:tophat/networkjs.git
```

or

```sh
npm install git@github.com:tophat/networkjs.git
```

## Usage

```javascript
import Network from 'network-js'
```

If you're not using ECMAScript modules:

```javascript
const Network = require('network-js').default
```

Then initialize the library with your preferred configuration described below.

```javascript
const Net = new Network({
    service: { /* service config */ },
    stability: { /* stability config */ }
})
```

This library monitors for three types of network events:

## Network: Browser offline/online events

### Events

- `offline`: Fired when the browser loses network connection
- `online`: Fired when the browser reconnects

## Stability: Network unstable/stable events

### Events

- `unstable`: Fired when the network speed goes under a given threshold
- `stable`: Fired when the network speed goes back above the given threshold

### Options

- `maxBufferSize`: The number of recent performance entries to track at any given time **(optional, default 10)**<br />
- `speedThreshold`: The speed threshold (in KBps) that determines network stability **(optional, default 100)**<br />

### Notes

Avoid using a large value for `maxBufferSize` (>100) as performance entries are stored in memory. The smaller the number you provide, the less accurate the monitor may be. The larger the number you provide, the longer it will take to propagate changes in network stability. You should play around with this value until you find a good balance.

This monitor uses the `window.PerformanceObserver` API which is [not supported in Internet Explorer](https://caniuse.com/#feat=mdn-api_performanceobserver). As such, this monitor will be disabled in Internet Explorer.

## Service: Service degraded/resolved events

### Events

- `degraded`: Fired when a service that matches a given prefix becomes degraded
- `resolved`: Fired when a service degradation is resolved

### Options

- `definitions`: Array of service definitions to track **(optional, defaults to tracking any failures)**<br />
    - `name`: Name of the service
    - `regex`: The `RegExp` to test against
- `statuses`: Array of statuses that determine a service degradation **(optional, default [502, 503, 504])**<br />
- `failureThreshold`: Minimum number of consecutive failures that determine if a service is degraded **(optional, default 2)**<br />
- `decrementTime`: Amount of time until a failure is dismissed **(optional, default 10000ms)**<br />

### Notes

This monitor needs to be hooked into your current HTTP library. For each request, you feed it the request URL and the response status code, and it will emit events upon hitting the given failure threshold.

```javascript
const Net = new Network({ service = { /* service config */ } })

this.axios.interceptors.response.use(
    success => success,
    (error) => {
        Net.serviceError(error.requestUrl, error.status)
        return error
    },
)
```

## Examples

### Network

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
        maxBufferSize: 15,
        speedThreshold: 150
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
        definitions: [
            {
                name: 'resource 1',
                regex: new RegExp('api/v1/resource1')
            },
            {
                name: 'resource 2',
                regex: new RegExp('api/v2/resource2')
            }
        ],
        statuses: [500, 502, 503, 504]
    }
})

Net.on('degraded', (serviceName) => {
    console.log(`Network - ${serviceName} - DEGRADED`)
})

Net.on('resolved', (serviceName) => {
    console.log(`Network - ${serviceName} - RESOLVED`)
})
```

### All

```javascript
const Net = new Network({
    stability: {
        maxBufferSize: 15,
        speedThreshold: 150
    },
    services: {
        prefixes: ['api/v1/resource1', 'api/v2/resource2'],
        statuses: [500, 502, 503, 504]
    }
})

Net.all((event) => {
    console.log(`Network - ${event}`)
})
```

## Contributors ✨

[See Contributing Guide](./CONTRIBUTING.md) to get started contributing.

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/jackcohen5"><img src="https://avatars3.githubusercontent.com/u/8365264?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jack Cohen</b></sub></a><br /><a href="#ideas-jackcohen5" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/tophat/networkjs/commits?author=jackcohen5" title="Code">💻</a></td>
    <td align="center"><a href="https://mcataford.github.io"><img src="https://avatars2.githubusercontent.com/u/6210361?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marc Cataford</b></sub></a><br /><a href="#infra-mcataford" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/StealthGiraffe"><img src="https://avatars0.githubusercontent.com/u/23384568?v=4?s=100" width="100px;" alt=""/><br /><sub><b>StealthGiraffe</b></sub></a><br /><a href="https://github.com/tophat/networkjs/commits?author=StealthGiraffe" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/asottile"><img src="https://avatars3.githubusercontent.com/u/1810591?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Anthony Sottile</b></sub></a><br /><a href="#security-asottile" title="Security">🛡️</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
