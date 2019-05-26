/**
 * Simple is object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: any) {
    return (item && typeof item === 'object' && !Array.isArray(item) && item !== null);
}

/**
 * Deep merge two objects.
 * @param target
 * @param source
 */
export function mergeDeep(target: any, source: any) {
    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
        return target;
    } else {
        return undefined
    }
}


export async function sleep(ms: number) {
    return new Promise((resolve, reject) => setTimeout(() => { resolve(); }, ms));
}

export async function delay<T>(ms: number, item: Promise<T>) {
    return new Promise<T>((resolve, reject) => setTimeout(() => { resolve(item); }, ms));
}