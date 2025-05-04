interface Window {
  ENV?: {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    [key: string]: string;
  };
}
