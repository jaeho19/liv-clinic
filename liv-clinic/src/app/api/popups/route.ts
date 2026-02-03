import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json([]);
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('popups')
      .select('*')
      .eq('is_active', true)
      .lte('display_start', now)
      .gte('display_end', now)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json([]);
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([]);
  }
}
