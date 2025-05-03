import 'react';

declare module 'react' {
  export type FormEvent<T = Element> = React.BaseSyntheticEvent<Event, EventTarget & T, EventTarget>;
  export type ChangeEvent<T = Element> = React.BaseSyntheticEvent<Event, EventTarget & T, EventTarget>;
  export type MouseEvent<T = Element, E = NativeMouseEvent> = React.BaseSyntheticEvent<E, EventTarget & T, EventTarget>;
  export type SyntheticEvent<T = Element, E = Event> = React.BaseSyntheticEvent<E, EventTarget & T, EventTarget>;
  
  export interface BaseSyntheticEvent<E = object, C = any, T = any> {
    nativeEvent: E;
    currentTarget: C;
    target: T;
    bubbles: boolean;
    cancelable: boolean;
    defaultPrevented: boolean;
    eventPhase: number;
    isTrusted: boolean;
    preventDefault(): void;
    isDefaultPrevented(): boolean;
    stopPropagation(): void;
    isPropagationStopped(): boolean;
    persist(): void;
    timeStamp: number;
    type: string;
  }
}
