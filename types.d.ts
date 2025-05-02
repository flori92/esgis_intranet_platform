declare module 'vite' {
  interface UserConfig {
    plugins?: unknown[];
    optimizeDeps?: {
      exclude?: string[];
    };
    base?: string;
    build?: {
      outDir?: string;
      sourcemap?: boolean;
    };
    [key: string]: unknown;
  }
  
  export function defineConfig(config: UserConfig): UserConfig;
}

declare module '@vitejs/plugin-react' {
  interface PluginOptions {
    include?: string | RegExp | (string | RegExp)[];
    exclude?: string | RegExp | (string | RegExp)[];
    jsxRuntime?: 'automatic' | 'classic';
    babel?: Record<string, unknown>;
    [key: string]: unknown;
  }
  
  export default function react(options?: PluginOptions): {
    name: string;
    enforce?: string;
    apply?: string;
    [key: string]: unknown;
  };
}
