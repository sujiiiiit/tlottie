
import type {ArgumentTypes, SuperReturnType} from '../types';

export type EventListenerListeners = Record<string, Function>;

type ListenerObject<T> = {callback: T, options: boolean | AddEventListenerOptions};

export default class EventListenerBase<Listeners extends EventListenerListeners> {
  protected listeners!: Partial<{
    [k in keyof Listeners]: Set<ListenerObject<Listeners[k]>>
  }>;
  protected listenerResults!: Partial<{
    [k in keyof Listeners]: ArgumentTypes<Listeners[k]>
  }>;

  private reuseResults!: boolean;

  constructor(reuseResults?: boolean) {
    this._constructor(reuseResults);
  }

  public _constructor(reuseResults?: boolean): any {
    this.reuseResults = reuseResults ?? false;
    this.listeners = {};
    this.listenerResults = {};
  }

  public addEventListener<T extends keyof Listeners>(name: T, callback: Listeners[T], options?: boolean | AddEventListenerOptions) {
    const listenerObject: ListenerObject<Listeners[T]> = {callback, options: options ?? false};
    (this.listeners[name] ??= new Set()).add(listenerObject); // ! add before because if you don't, you won't be able to delete it from callback

    if(this.listenerResults.hasOwnProperty(name)) {
      callback(...this.listenerResults[name] as ArgumentTypes<Listeners[T]>);

      if((options as AddEventListenerOptions)?.once) {
        this.listeners[name].delete(listenerObject);
        return;
      }
    }

    // e.add(this, name, {callback, once});
  }

  public addMultipleEventsListeners(obj: {
    [name in keyof Listeners]?: Listeners[name]
  }) {
    for(const i in obj) {
      if (obj[i] !== undefined) {
        this.addEventListener(i, obj[i]);
      }
    }
  }

  public removeEventListener<T extends keyof Listeners>(
    name: T,
    callback: Listeners[T],
    options?: boolean | AddEventListenerOptions
  ) {
    if(this.listeners[name]) {
      for(const l of this.listeners[name]) {
        if(l.callback === callback) {
          this.listeners[name].delete(l);
          break;
        }
      }
    }
    // e.remove(this, name, callback);
  }

  protected invokeListenerCallback<T extends keyof Listeners, L extends ListenerObject<any>>(
    name: T,
    listener: L,
    ...args: ArgumentTypes<L['callback']>
  ) {
    let result: any, error: any;
    try {
      result = listener.callback(...args);
    } catch(err) {
      error = err;
      // console.error('listener callback error', err);
    }

    if((listener.options as AddEventListenerOptions)?.once) {
      this.removeEventListener(name, listener.callback);
    }

    if(error) {
      throw error;
    }

    return result;
  }

  private _dispatchEvent<T extends keyof Listeners>(
    name: T,
    collectResults: boolean,
    ...args: ArgumentTypes<Listeners[T]>
  ) {
    if(this.reuseResults) {
      this.listenerResults[name] = args;
    }

    const arr: Array<SuperReturnType<Listeners[typeof name]>> | undefined = collectResults ? [] : undefined;

    const listeners = this.listeners[name];
    if(listeners) {
      for(const listener of listeners) {
        const result = this.invokeListenerCallback(name, listener, ...args);
        if(arr) {
          arr.push(result);
        }
      }
    }

    return arr;
  }

  public dispatchResultableEvent<T extends keyof Listeners>(name: T, ...args: ArgumentTypes<Listeners[T]>) {
    return this._dispatchEvent(name, true, ...args);
  }

  // * must be protected, but who cares
  public dispatchEvent<L extends EventListenerListeners = Listeners, T extends keyof L = keyof L>(
    name: T,
    ...args: ArgumentTypes<L[T]>
  ) {
    // @ts-ignore
    this._dispatchEvent(name, false, ...args);
  }

  public cleanup() {
    this.listeners = {};
    this.listenerResults = {};
  }
}
