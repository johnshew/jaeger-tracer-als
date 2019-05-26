
declare module 'async-local-storage' {
    function get<T>(index: string) : T;
    function getFromParent<T>(key: string) : T;
    function set(index: string, item: any, top? : boolean) : boolean;
    function remove() : void; // removes the current scope
    function enable() : void;
    function disable() : void;
    function use(id: string) : any;
    function size() : number;
    function currentId() : number;
    function scope() : void;
    function enableLinkedTop() : void;
    function disableLinkedTop() : void;
    function getAllData() : Map<any,any>;

    function getCurrentData() : any;
}
