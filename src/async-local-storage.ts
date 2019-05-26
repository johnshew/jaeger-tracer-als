// Copied from async-local-storage and converted to Typescript

import * as async_hooks from 'async_hooks';
const nano = require('nano-seconds');
import * as util from 'util';
import * as  fs from 'fs';

const map = new Map();

let moduleExports: any = {};

const enabledDebug = process.env.DEBUG === 'als';

function debug(...args: any[]) {
  if (!enabledDebug) {
    return;
  }
  // use a function like this one when debugging inside an AsyncHooks callback
  fs.writeSync(1, `${util.format(args[0], ...args.slice(1))}\n`);
}

let defaultLinkedTop = false;

function isUndefined(value: any) {
  return value === undefined;
}

/**
 * Get data from itself or parent
 * @param {any} data The map data
 * @param {any} key The key
 * @returns {any}
 */
function getDataFromSelfOrParent(data: any, key: any) {
  /* istanbul ignore if */
  if (!data) {
    return null;
  }
  let currentData = data;
  let value = currentData[key];
  while (isUndefined(value) && currentData.parent) {
    currentData = currentData.parent;
    debug(`checking ${currentData.currentId}`)
    value = currentData[key];
  }
  return value;
}

/**
 * Get the top data
 */
function getTop(data: any) {
  let result = data;
  while (result && result.parent) {
    result = result.parent;
  }
  return result;
}

let trackCurrentId = 0;

const hooks = async_hooks.createHook({
  init: function init(id, type, triggerId) {
    // init, set the created time
    const data = {
      created: nano.now(),
      currentId: trackCurrentId,
      parent: undefined
    };
    const parentId = triggerId || trackCurrentId;
    // not trigger by itself, add parent
    if (parentId !== id) {
      const parent = map.get(parentId);
      if (parent) {
        data.parent = parent;
      }
    }
    debug(`${id}/${type}: trigger: ${triggerId} execution: ${async_hooks.executionAsyncId()}`);
    map.set(id, data);
  },
  /**
   * Set the current id
   */
  before: function before(id) {
    trackCurrentId = id;
  },
  /**
   * Remove the data
   */
  destroy: function destroy(id) {
    if (!map.has(id)) {
      return;
    }
    debug(`destroy ${id}`);
    map.delete(id);
  },
});

/**
 * Get the current id
 */
function getCurrentId() {
  if (async_hooks.executionAsyncId) {
    return async_hooks.executionAsyncId();
  }
  return trackCurrentId; // was async_hooks.currentId which doesn't exist according to the docs
}

/**
 * Get the current id
 */
export function xcurrentId() { return getCurrentId() }

/**
 * Enable the async hook
 */
export function enable() { return hooks.enable(); }

/**
 * Disable the async hook
 */
export function disable() { hooks.disable(); }

/**
 * Get the size of map
 */
export function size() { map.size; }

/**
 * Enable linked top
 */
export function enableLinkedTop() {
  defaultLinkedTop = true;
};

/**
 * Disable linked top
 */
export function disableLinkedTop() {
  defaultLinkedTop = false;
};

/**
 * Set the key/value for this score
 * @param {String} key The key of value
 * @param {String} value The value
 * @param {Boolean} linkedTop The value linked to top
 * @returns {Boolean} if success, will return true, otherwise false
 */
export function set(key: string, value: any, linkedTop?: boolean) {
  /* istanbul ignore if */
  if (key === 'created' || key === 'parent') {
    throw new Error("can't set created and parent");
  }
  const id = getCurrentId();
  debug(`set ${key}:${value} to ${id}`);
  let data = map.get(id);
  /* istanbul ignore if */
  if (!data) {
    return false;
  }
  let setToLinkedTop = linkedTop;
  if (isUndefined(linkedTop)) {
    setToLinkedTop = defaultLinkedTop;
  }
  if (setToLinkedTop) {
    data = getTop(data);
  }
  data[key] = value;
  return true;
};

/**
 * Get the value by key
 * @param {String} key The key of value
 */
export function get<T>(key: string): T {
  const id = getCurrentId();
  const data = map.get(id);
  debug(`get ${key} from ${id}`);
  const value = getDataFromSelfOrParent(data, key);
  debug(`get ${key}:${value} from ${id}`);
  return value;
};

/**
 * 获取当前current data
 */
export function getCurrentData() { map.get(getCurrentId()); }

/**
 * Get the value by key from parent
 * @param {String} key The key of value
 */
export function getFromParent<T>(key: string): T | null {
  const currentData = map.get(getCurrentId());
  if (!currentData) {
    return null;
  }
  const value = getDataFromSelfOrParent({ parent: currentData.parent }, key);
  debug(`get ${key}:${value} from ${currentData.parentId}`);
  return value;
};


/**
 * Remove the data of the current id
 */
export function remove() {
  const id = getCurrentId();
  if (id) {
    map.delete(id);
  }
};

/**
 * Get the use the of id
 * @param {Number} id The trigger id, is optional, default is `als.currentId()`
 * @returns {Number} The use time(ns) of the current id
 */
export function use(id: number) {
  const data = map.get(id || getCurrentId());
  /* istanbul ignore if */
  if (!data) {
    return -1;
  }
  return nano.difference(data.created);
};

/**
 * Get the top value
 */
export function top() {
  const data = map.get(getCurrentId());
  return getTop(data);
};

/**
 * Set the scope (it will change the top)
 */
export function scope() {
  const data = map.get(getCurrentId());
  if (data) {
    delete data.parent;
    return;
  }
  throw new Error('No scope.  May need to call a setTimeout?');
};

/**
 * Get all data of async locatl storage, please don't modify the data
 */
export function getAllData() {
  return map;
}