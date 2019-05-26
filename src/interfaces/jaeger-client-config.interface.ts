export interface Config {

    /**
     * @description service name to use in tracing
     */
    serviceName?: string;

    /**
     * @description sampler configuration
     */
    sampler?: {
        type?: "const" | "probabilistic" | "ratelimiting" | "remote" | String;
        param?: number;
        hostPort?: string;
        host?: string;
        port?: number;
        refreshIntervalMs?: number;
    },

    /**
     * @description reporter configuration
     */
    reporter?: {
        logSpans?: boolean;
        agentHost?: string;
        agentPort?: number;
        collectorEndpoint?: string;
        username?: string;
        password?: string;
        flushIntervalMs?: number;
    },

    /**
     * @description throttler configuration
     */
    throttler?: {
        host?: string;
        port?: number;
        refreshIntervalMs?: number;
    },

    /**
     * @description this is a property to control if the tracer should work or not
     * usually used to stop tracing in production systems
     */
    shouldTrace?: () => Boolean | Boolean;

};

export interface Options {
    tags?: any;
    metrics?: any;
    logger?: any;

    /**
     * @description this is a function which will be applied on the data before they 
     * are put into log 
     * @returns has to return the data to be logged or else it will log nothing
     */
    filterData?: (data: any) => any;
}