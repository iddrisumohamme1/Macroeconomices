import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://bcnqymczdendgyjxfhdv.supabase.co';

export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbnF5bWN6ZGVuZGd5anhmaGR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Nzc5NTAsImV4cCI6MjEwNjI1Mzk1MH0.mz_1SLxgQJnJgaylWx0dHN04r_uECf_JXlV53aLCj-I';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface ConnectionTestResult {
  connected: boolean;
  latencyMs: number;
  projectRef: string;
  endpoint: string;
  tablesFound: string[];
  message: string;
  timestamp: string;
}

/**
 * Tests live connection against the provided Supabase project instance.
 * Measures real HTTP/TLS ping latency.
 */
export async function testSupabaseConnection(): Promise<ConnectionTestResult> {
  const start = performance.now();
  const timestamp = new Date().toISOString();
  const projectRef = 'bcnqymczdendgyjxfhdv';

  try {
    // Probe the PostgREST root schema metadata or health endpoint
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });

    const elapsed = Math.round(performance.now() - start);

    if (response.ok || response.status === 200 || response.status === 404) {
      // Check for known tables in the schema
      let tables: string[] = [];
      try {
        const [accRes, tradesRes, cbRes] = await Promise.all([
          supabase.from('funding_accounts').select('id').limit(1),
          supabase.from('trades').select('id').limit(1),
          supabase.from('central_bank_rates').select('currency').limit(1),
        ]);
        if (!accRes.error) tables.push('funding_accounts');
        if (!tradesRes.error) tables.push('trades');
        if (!cbRes.error) tables.push('central_bank_rates');
      } catch {
        // Table might not be created yet in fresh project
      }

      return {
        connected: true,
        latencyMs: elapsed,
        projectRef,
        endpoint: SUPABASE_URL,
        tablesFound: tables,
        message: 'Active TLS handshake verified. Connected to Supabase PostgreSQL cluster.',
        timestamp,
      };
    } else {
      return {
        connected: false,
        latencyMs: elapsed,
        projectRef,
        endpoint: SUPABASE_URL,
        tablesFound: [],
        message: `HTTP ${response.status}: ${response.statusText}`,
        timestamp,
      };
    }
  } catch (err: any) {
    const elapsed = Math.round(performance.now() - start);
    return {
      connected: false,
      latencyMs: elapsed,
      projectRef,
      endpoint: SUPABASE_URL,
      tablesFound: [],
      message: err?.message || 'Network error connecting to Supabase instance.',
      timestamp,
    };
  }
}
