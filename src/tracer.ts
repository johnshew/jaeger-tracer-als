import { Tracer } from 'opentracing';
import { mergeDeep} from './util';
import { Config, Options } from './interfaces/jaeger-client-config.interface';
const { initTracer: initJaegerTracer } = require('jaeger-client');

/**
 * we should make a middleware function to be used for the requests 
 * which will log the requests and responses -- requests only (response remaining)
 * 
 * also dont forget that we need to extract the parent context and send it to the child off context -- checked
 */

/**
 * we should also make a wrapper function which will be give a function to wrap and inject 
 * the tracing headers inside it to be able to send the span context to the parent
 */


/**
 * @description this is the function that initiates the tracer
 * @param serviceName the name of the service 
 * @param config merge the current configs
 * @param options merget with the current options
 */
export let initTracer = (serviceName: string, config: Config = {}, options: Options = {}): Tracer => {
    // this is the configuration options 
    config = mergeDeep({
        serviceName: serviceName,
        sampler: {
            type: "const",
            param: 1,
        },
        reporter: {
            logSpans: true,
            agentHost: 'jaegar'
        }
    }, config);

    // options of the tracer
    options = mergeDeep({
        logger: {
            info(msg: any) {
                console.log("INFO ", msg);
            },
            error(msg: any) {
                console.log("ERROR", msg);
            }
        }
    }, options);

    // initialize the tracer
    let tracer = initJaegerTracer(config, options);

    return tracer;
};






