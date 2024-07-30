/**
 * An element that is displayed only if the current route starts with elements path attribute.
 *
 * For example,
 *  route({path: "/proc"},
 *      div(
 *          "proc",
 *          div({path: "/cpuinfo"},
 *              "cpuinfo"
 *              )
 *          )
 *      )
 *
 *  You can override this behavior by setting the attribute, absolute to any value
 *
 *  route({path: "/usr"},
 *      div(
 *          "proc",
 *          div({path: "/cpuinfo", absolute: true},
 *              "cpuinfo"
 *              )
 *          )
 *      )
 *
 * @param {Object|Node} children The attributes and children of this element.
 * @returns {HTMLDivElement} A div element that will only be displayed if the current route starts with the path attribute.
 */
export function route(...children: any | Node): HTMLDivElement;
/**
 * An element that only renders the first route that matches and updates when the route is changed
 * The primary purpose of this element is to provide catchall routes for not found pages and path variables
 * @param {any} children
 * @returns {Node|(()=>Node)}
 */
export function routeSwitch(...children: any): Node | (() => Node);
/**
 * The main function of this library. It will load the route at the specified path and render it into the container element.
 * @param {object} options
 * @param {string} options.routePath The path to the root of the routes. This is used to resolve the paths of the routes.
 * @param {object} options.attrs The attributes of the container element
 * @param {(error: Error, newPathState: object)=>void|Node} options.onerror A function that will be called if the route fails to load. The function receives the error and the current pathState object. Should return an error to display if it's not handled.
 * @param {(node: Node, module: object)=>Node} options.frame A function that will be called with the rendered route element and the module that was loaded. The function should return a new element to be rendered.
 * @param {boolean} options.sendRawPath If true, the raw path will be sent to the route. Otherwise, the path will be stripped of parameter values.
 * @param {(path: string)=>string} options.formatPath A function that will be called with the raw path before it is used to load the route. The function should return a new path.
 * @return {HTMLElement} The container element
 */
export function modRouter({ routePath, attrs, onerror, frame, sendRawPath, formatPath }: {
    routePath: string;
    attrs: object;
    onerror: (error: Error, newPathState: object) => void | Node;
    frame: (node: Node, module: object) => Node;
    sendRawPath: boolean;
    formatPath: (path: string) => string;
}): HTMLElement;
/**
 * A link element that is a link to another route in this single page app
 * @param {any} children The attributes of the anchor element and any children
 * @returns {HTMLAnchorElement} An anchor element that will navigate to the specified route when clicked
 */
export function fnlink(...children: any): HTMLAnchorElement;
/**
 * A function to navigate to the specified route
 * @param {string} route The route to navigate to
 * @param {any} context Data related to the route change
 * @param {boolean} replace Whether to replace the state or push it. pushState is used by default.
 * @param {boolean} silent Prevent route change events from being emitted for this route change
 */
export function goTo(route: string, context: any, replace?: boolean, silent?: boolean): void;
/**
 * Listen for routing events
 * @param event a string event to listen for
 * @param handler A function that will be called when the event occurs.
 *                  The function receives the new and old pathState objects, in that order.
 * @return {()=>void} a function to stop listening with the passed handler.
 */
export function listenFor(event: any, handler: any): () => void;
/**
 * Set the root path of the app. This is necessary to make deep linking work in cases where the same html file is served from all paths.
 * @param {string} rootPath The root path of the app
 */
export function setRootPath(rootPath: string): void;
/**
 * Key value pairs of path parameter names to their values
 * @typedef {Object} PathParameters
 */
/**
 * The path parameters of the current route
 * @type {import("./fntags.mjs").FnState<PathParameters>}
 */
export const pathParameters: import("./fntags.mjs").FnState<PathParameters>;
/**
 * The path information for a route
 * @typedef {{currentRoute: string, rootPath: string, context: any}} PathState
 */
/**
 * The current path state
 * @type {import("./fntags.mjs").FnState<PathState>}
 */
export const pathState: import("./fntags.mjs").FnState<PathState>;
/**
 * @typedef {string} RouteEvent
 */
/**
 * Before the route is changed
 * @type {RouteEvent}
 */
export const beforeRouteChange: RouteEvent;
/**
 * After the route is changed
 * @type {RouteEvent}
 */
export const afterRouteChange: RouteEvent;
/**
 * After the route is changed and the route element is rendered
 * @type {RouteEvent}
 */
export const routeChangeComplete: RouteEvent;
/**
 * Key value pairs of path parameter names to their values
 */
export type PathParameters = any;
/**
 * The path information for a route
 */
export type PathState = {
    currentRoute: string;
    rootPath: string;
    context: any;
};
export type RouteEvent = string;
//# sourceMappingURL=fnroute.d.mts.map