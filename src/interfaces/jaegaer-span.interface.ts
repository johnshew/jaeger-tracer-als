import { Tracer } from "./jaegar-tracer.interface";

export interface Span {
    /**
     * @description Returns the SpanContext object associated with this Span.
     */
    context: () => SpanContext;

    /**
     * @description Returns the Tracer object used to create this Span.
     */
    tracer: () => Tracer;

    /**
     * @description Sets the string name for the logical operation this span represents.
     *
     * @param {string} name
     */

    setOperationName: (name: string) => this;

    /**
     * @description Sets a key:value pair on this Span that also propagates to future
     * children of the associated Span.
     *
     * setBaggageItem() enables powerful functionality given a full-stack
     * opentracing integration (e.g., arbitrary application data from a web
     * client can make it, transparently, all the way into the depths of a
     * storage system), and with it some powerful costs: use this feature with
     * care.
     *
     * IMPORTANT NOTE #1: setBaggageItem() will only propagate baggage items to
     * *future* causal descendants of the associated Span.
     *
     * IMPORTANT NOTE #2: Use this thoughtfully and with care. Every key and
     * value is copied into every local *and remote* child of the associated
     * Span, and that can add up to a lot of network and cpu overhead.
     *
     * @param {string} key
     * @param {string} value
     */

    setBaggageItem: (key: string, value: string) => this;

    /**
     * Returns the value for a baggage item given its key.
     *
     * @param  {string} key
     *         The key for the given trace attribute.
     * @return {string}
     *         String value for the given key, or undefined if the key does not
     *         correspond to a set trace attribute.
     */
    getBaggageItem: (key: string) => string | undefined;

    /**
     * Adds a single tag to the span.  See `addTags()` for details.
     *
     * @param {string} key
     * @param {any} value
     */
    setTag: (key: string, value: any) => this;

    /**
     * Adds the given key value pairs to the set of span tags.
     *
     * Multiple calls to addTags() results in the tags being the superset of
     * all calls.
     *
     * The behavior of setting the same key multiple times on the same span
     * is undefined.
     *
     * The supported type of the values is implementation-dependent.
     * Implementations are expected to safely handle all types of values but
     * may choose to ignore unrecognized / unhandle-able values (e.g. objects
     * with cyclic references, function objects).
     *
     * @return {[type]} [description]
     */
    addTags: (keyValueMap: { [key: string]: any }) => this;

    /**
     * @description Add a log record to this Span, optionally at a user-provided timestamp.
     *
     * For example:
     *
     *     span.log({
     *         size: rpc.size(),  // numeric value
     *         URI: rpc.URI(),  // string value
     *         payload: rpc.payload(),  // Object value
     *         "keys can be arbitrary strings": rpc.foo(),
     *     });
     *
     *     span.log({
     *         "error.description": someError.description(),
     *     }, someError.timestampMillis());
     *
     * @param {object} keyValuePairs
     *        An object mapping string keys to arbitrary value types. All
     *        Tracer implementations should support bool, string, and numeric
     *        value types, and some may also support Object values.
     * @param {number} timestamp
     *        An optional parameter specifying the timestamp in milliseconds
     *        since the Unix epoch. Fractional values are allowed so that
     *        timestamps with sub-millisecond accuracy can be represented. If
     *        not specified, the implementation is expected to use its notion
     *        of the current time of the call.
     */
    log: (keyValuePairs: { [key: string]: any }, timestamp?: number) => this;


    /**
     * Sets the end timestamp and finalizes Span state.
     *
     * With the exception of calls to Span.context() (which are always allowed),
     * finish() must be the last call made to any span instance, and to do
     * otherwise leads to undefined behavior.
     *
     * @param  {number} finishTime
     *         Optional finish time in milliseconds as a Unix timestamp. Decimal
     *         values are supported for timestamps with sub-millisecond accuracy.
     *         If not specified, the current time (as defined by the
     *         implementation) will be used.
     */
    finish: (finishTime?: number) => void;
}


export interface SpanOptions {

    /**
     * a parent SpanContext (or Span, for convenience) that the newly-started
     * span will be the child of (per REFERENCE_CHILD_OF). If specified,
     * `references` must be unspecified.
     */
    childOf?: Span | SpanContext;

    /**
     * an array of Reference instances, each pointing to a causal parent
     * SpanContext. If specified, `fields.childOf` must be unspecified.
     */
    references?: Reference[];

    /**
     * set of key-value pairs which will be set as tags on the newly created
     * Span. Ownership of the object is passed to the created span for
     * efficiency reasons (the caller should not modify this object after
     * calling startSpan).
     */
    tags?: { [key: string]: any };

    /**
     * a manually specified start time for the created Span object. The time
     * should be specified in milliseconds as Unix timestamp. Decimal value are
     * supported to represent time values with sub-millisecond accuracy.
     */
    startTime?: number;
}

/**
 * @description Reference pairs a reference type constant (e.g., REFERENCE_CHILD_OF or
 * REFERENCE_FOLLOWS_FROM) with the SpanContext it points to.
 *
 * See the exported childOf() and followsFrom() functions at the package level.
 */
export interface Reference {
    /**
     * @return {string} The Reference type (e.g., REFERENCE_CHILD_OF or
     *         REFERENCE_FOLLOWS_FROM).
     */
    type: () => string;

    /**
     * @return {SpanContext} The SpanContext being referred to (e.g., the
     *         parent in a REFERENCE_CHILD_OF Reference).
     */
    referencedContext: () => SpanContext;
}


export interface SpanContext {
    traceId: number;
    spanId: number;
    parentId: number;
    traceIdStr: string;
    spanIdStr: string;
    parentIdStr: string;
    flags: number;
    baggage: any;
    debugId: string;
    samplingFinalized: boolean;
    finalizeSampling: () => void;

    /**
     * @return {boolean} - returns whether or not this span context was sampled.
     **/
    isSampled(): boolean;

    /**
     * @return {string} - returns a string version of this span context.
     **/
    toString(): string;

    /**
     * @description create a new context with baggage item
     * @param key 
     * @param value 
     */
    withBaggageItem(key: string, value: string): SpanContext;
}