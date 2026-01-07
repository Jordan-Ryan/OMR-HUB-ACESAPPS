import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const creditType = searchParams.get('credit_type') || 'circuits';

    // Validate credit_type
    if (!['circuits', 'pt', 'joint_pt'].includes(creditType)) {
      return NextResponse.json(
        { error: 'Invalid credit_type. Must be circuits, pt, or joint_pt' },
        { status: 400 }
      );
    }

    const { data: packages, error } = await supabase
      .from('pricing_packages')
      .select('*')
      .eq('credit_type', creditType)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({ packages: packages || [] });
  } catch (error) {
    console.error('Error fetching pricing packages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing packages' },
      { status: 500 }
    );
  }
}

