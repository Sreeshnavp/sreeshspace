import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://amagjkuvdpxlrfbzadyb.supabase.co';

const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtYWdqa3V2ZHB4bHJmYnphZHliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4NDc2MDAsImV4cCI6MjExMDQyMzYwMH0.5nLCBXXqOoz9F--Ih2NQSW-xVTUvgmGJz2077p1dvcY';

// Polyfill minimal WebSocket for Node 20 test runners if window is undefined
if (typeof globalThis.WebSocket === 'undefined' && typeof window === 'undefined') {
  (globalThis as any).WebSocket = class MockWebSocket {
    addEventListener() {}
    removeEventListener() {}
    send() {}
    close() {}
  };
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
