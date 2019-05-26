# jaeger-tracer-restify
This is a module for jaeger instrumentation to allow your node backend with just four lines of code and the require statements included to be able to send the incoming and outgoing requests and responses data to the jaeger backend.

This is essentially a fork of `jaeger-tracer` and `async-local-storage`

[![npm version](https://badge.fury.io/js/jaeger-tracer-als.svg)](https://badge.fury.io/js/jaeger-tracer-restify)
[![Dependency Status](https://david-dm.org/johnshew/jaeger-tracer-als.svg)](https://david-dm.org/johnshew/jaeger-tracer-restify.svg)
[![NPM](https://nodei.co/npm/jaeger-tracer-als.png)](https://nodei.co/npm/cls2/)

## Table of contents


## Installation
` npm install jaeger-tracer-als`

## Usage
All you need to do is include the following middleware in your app with the following way
```javascript
let { jaegarTracerMiddleware } = require('jaeger-tracer-als');
let http = require('http');
let https = require('https');


// some middlewares
// body parser middleware

// jaeger tracer middleware here
app.use(jaegarTracerMiddleware({ http, https }, 'your-app', {
	reporter: {
	    // host name of your 
		agentHost:  'localhost'
	}
}
));
```
This is the simplest usage of the package. You can customize the collector host and many other data through the configs.

----------------
## How the package works
Inside the package we just log the incoming requests and their responses from this backend. 
the middleware takes the http or https to be able to monkey patch the http.request or https.request functions and put the tracer headers in any outgoing requests to third party backends. Also the it extracts the headers from any incoming requests to relate spans with the parent child relations. It provides the basics for extracting and injecting the headers across requests.

### Important notes
The package inside uses a forked version of [async-local-storage](https://www.npmjs.com/package/async-local-storage), so be careful to lose the context.

Also there is a function which gets you the context to be able to pass it over if it is lost in some place in your code.

## API Reference
The package exports the following functions:

#### jaegarTracerMiddleware
#### initTracer
#### startSpan
#### startSpanFromContext
#### getContext
#### unirestWrapper
#### requestWrapper
#### getInjectionHeaders
