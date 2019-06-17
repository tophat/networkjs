# NetworkJS

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

Configuration:

If you want to receive network stability events, you need to supply a URL to the resource you wish to ping.

```javascript
{
    stabilityConfig: {
        resource: 'https://path.to.your.resource'
    }
}
```

Optionally you can omit any configuration to just receive network online/offline events.


```javascript
const Net = new Network()
```

Example:

```javascript
const Net = new Network({
    stabilityConfig: {
        resource: 'https://path.to.your.resource'
    }
})

Net.on('online', () => {
    console.log('Network - ONLINE')
})

Net.on('offline', () => {
    console.log('Network - OFFLINE')
})

Net.on('unstable', () => {
    console.log('Network - UNSTABLE')
})

Net.on('stable', () => {
    console.log('Network - STABLE')
})

Net.all((event) => {
    console.log('Network -', event)
})
```