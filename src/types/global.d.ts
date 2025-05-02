// Déclarations de types globales pour les modules externes

declare module 'react' {
  export interface FC<P = {}> {
    (props: P): JSX.Element | null;
  }
  
  export function createContext<T>(defaultValue: T): any;
  export function useContext<T>(context: any): T;
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
  
  export type ReactNode = any;
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
    type Element = any;
  }
}

declare module '@emailjs/browser' {
  export function init(publicKey: string): void;
  export function send(serviceId: string, templateId: string, templateParams: any): Promise<any>;
}

declare module 'react-hot-toast' {
  export function success(message: string, options?: any): string;
  export function error(message: string, options?: any): string;
  export function dismiss(toastId?: string): void;
  export default {
    success,
    error,
    dismiss
  };
}

declare module 'lucide-react' {
  export const Clock: any;
}
