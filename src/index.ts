import * as als from './async-local-storage';
import * as restify from 'restify';
import { initTracer } from './tracer';
import * as opentracing from 'opentracing'
import * as fs from 'fs';
import * as util from 'util';
import * as utils from './util';
import { get } from 'got';

console.log = (...args: any[]) => {
  fs.writeFileSync(1, `${util.format(args[0], ...args.slice(1))}\n`, { flag: 'a' });
}

let tracer = initTracer('jaeger-tracer-als', { reporter: { agentHost: 'localhost' } })

als.enable();

class PromiseHandler<T> implements PromiseLike<T> {
  public resolver?: (value?: T | PromiseLike<T>) => void;
  public rejector?: (reason?: any) => void;
  public promise: Promise<T>;
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolver = resolve;
      this.rejector = reject;
    })
  }
  public resolve(value?: T | PromiseLike<T>) { this.resolver && this.resolver(value); }
  public reject(reason?: any) { this.rejector && this.rejector(reason); }
  public then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): PromiseLike<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }
  public catch(onrejected?: ((reason: any) => T | PromiseLike<T>) | null | undefined): Promise<T> {
    return this.promise.catch(onrejected);
  }
}

class Server {
  public server?: restify.Server;
  public ready = new PromiseHandler<void>();
  public finished = new PromiseHandler<void>();
  public serverSpan: opentracing.Span;

  constructor() {
    this.serverSpan = tracer.startSpan('server-span');
  }

  async run(args: { listenArgs: any[] }) {
    setTimeout(async () => {
      als.scope();
      als.set('debug', true);
      this.server = restify.createServer();
      this.configure();
      this.listen(...args.listenArgs);
      this.ready.resolve();
      console.log(`should be ready`)
      await this.ready.catch((err) => console.log(err));
      console.log(`waiting on finished in timeout`)
      await this.finished.catch((err) => console.log(err));
    }, 1)
    console.log(`waiting on finished in run`)
    await this.finished.catch((err) => console.log(err));
  }

  configure() {
    console.log(`configuring server`)
    if (!this.server) return;
    let app = this.server;

    app.use((req, res, next) => {
      console.log(`in middleware path = ${req.path()}`);
      let parentSpanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, req.headers);
      let span: opentracing.Span;

      // make a standalone span when no parent context came 
      if (!parentSpanContext || (parentSpanContext && !(parentSpanContext as any).spanId)) {
        span = tracer.startSpan('request-span');
      } else {
        als.set('parent-span', parentSpanContext);
        span = tracer.startSpan('request-span', { childOf: parentSpanContext });
      }
      als.set('current-span', span);
      span.setTag(opentracing.Tags.HTTP_URL, req.getRoute().path );
      span.setTag(opentracing.Tags.HTTP_METHOD, req.method);
      span.setTag('Hostname', req.headers.host);
      span.log({
          event: 'request',
          params: req.params,
          query: req.query,
          headers: req.headers
      });

      res.once('finish', () => {
        console.log('in middleware response finish');
        console.log(`Current debug status ${als.get('debug')}`);
        span.log({ 'event': 'response finished' });
        span.finish();
      });

      return next();
    });

    app.get('/test', (req, res, next) => {
      if (!als.get('debug')) { console.log('no context'); throw new Error('no context') }
      let span = als.get<opentracing.Span>('current-span');
      let newHeaders = {}
      tracer.inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, newHeaders);
      console.log('new headers', newHeaders);
      res.send('test complete');
      res.end();
      return next();
    });

    app.get('/close', async (req, res, next) => {
      if (!als.get('debug')) { console.log('no context'); throw new Error('no context') }
      let span = als.get<opentracing.Span>('current-span');
      let newHeaders = {}
      tracer.inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, newHeaders);
      console.log('new headers', newHeaders);
      res.send('closing');
      res.end();
      if (this.server) {
        this.close();
      }
      return next();
    });

    app.get('/call?:url', async (req, res, next) => {
      if (!als.get('debug')) { console.log('no context'); throw new Error('no context') }
      let url = req.params.url;
      if (!url) { throw new Error('no url') };
      let span = als.get<opentracing.Span>('current-span');
      let newHeaders = {}
      tracer.inject(span.context(), opentracing.FORMAT_HTTP_HEADERS, newHeaders);
      console.log('new headers', newHeaders);
      try {
        let response = await get(url);
      } catch (error) {
        console.log(error.response.body);
      }
      res.send('closing');
      res.end();
      if (this.server) {
        this.close();
      }
      return next();
    });

  }

  public listen(...args: any[]) {
    if (!this.server) return
    this.server.listen(...args);
  }

  async close(callback?: () => any): Promise<void> {
    if (!this.server) return;
    console.log(`closing Server`);
    this.server.close(() => {
      console.log(`Server is closed`)
      this.serverSpan.log({ 'event': 'stopping server' });
      this.serverSpan.finish();
      callback && callback();
      console.log(`resolving finished`)
      return this.finished.resolve();

    })
    return await this.finished;
  }
}


let server1 = new Server();

async function run() {
  await server1.run({ listenArgs: [8081] });
  console.log(`server finished - exiting in 2 seconds`)
  await utils.sleep(2000);
  process.exit(1)
  return;
}

function call() {
  setTimeout(async () => {
    try {
      als.scope()
      console.log(`awaiting server 1 ready`);
      await server1.ready;
      let callerSpan = tracer.startSpan('caller');
      let headers = {}
      tracer.inject(callerSpan, opentracing.FORMAT_HTTP_HEADERS, headers);
      console.log(`calling server1`, headers);
      let response = await get("http://localhost:8081/test", { headers }).catch((error) => console.log(error));
      if (response) console.log(`response ${response.statusMessage} ${response.body}`);
      callerSpan.log({ event: 'finished' });
      callerSpan.finish();
    } catch (error) { console.log(error) }
  }, 1)
}

run();
call();