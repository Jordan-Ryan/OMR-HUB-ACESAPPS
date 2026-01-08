import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET all discount codes (admin only)
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('include_inactive') === 'true';

    let query = supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data: discountCodes, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ discountCodes: discountCodes || [] });
  } catch (error) {
    console.error('Error fetching discount codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount codes' },
      { status: 500 }
    );
  }
}

// POST create new discount code (admin only)
export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const {
      code,
      description,
      discount_type,
      discount_value,
      applies_to,
      min_purchase_amount_pence,
      max_discount_amount_pence,
      is_active,
      usage_limit,
      valid_from,
      valid_until,
    } = body;

    if (!code || !discount_type || discount_value === undefined || !applies_to) {
      return NextResponse.json(
        { error: 'Code, discount_type, discount_value, and applies_to are required' },
        { status: 400 }
      );
    }

    // Validate discount_type
    if (!['percentage', 'fixed_amount', 'fixed_price'].includes(discount_type)) {
      return NextResponse.json(
        { error: 'Invalid discount_type. Must be percentage, fixed_amount, or fixed_price' },
        { status: 400 }
      );
    }

    // Validate applies_to
    if (!['circuits', 'pt', 'joint_pt', 'all'].includes(applies_to)) {
      return NextResponse.json(
        { error: 'Invalid applies_to. Must be circuits, pt, joint_pt, or all' },
        { status: 400 }
      );
    }

    // Validate discount_value based on type
    if (discount_type === 'percentage' && (discount_value < 0 || discount_value > 100)) {
      return NextResponse.json(
        { error: 'Percentage discount must be between 0 and 100' },
        { status: 400 }
      );
    }

    if ((discount_type === 'fixed_amount' || discount_type === 'fixed_price') && discount_value < 0) {
      return NextResponse.json(
        { error: 'Fixed amount/price discount must be >= 0' },
        { status: 400 }
      );
    }

    const { data: discountCode, error: insertError } = await supabase
      .from('discount_codes')
      .insert({
        code: code.toUpperCase().trim(),
        description: description || null,
        discount_type,
        discount_value: Number(discount_value),
        applies_to,
        min_purchase_amount_pence: min_purchase_amount_pence || null,
        max_discount_amount_pence: max_discount_amount_pence || null,
        is_active: is_active !== undefined ? is_active : true,
        usage_limit: usage_limit || null,
        valid_from: valid_from || new Date().toISOString(),
        valid_until: valid_until || null,
        created_by: admin.id,
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'A discount code with this code already exists' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    return NextResponse.json({ discountCode }, { status: 201 });
  } catch (error) {
    console.error('Error creating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to create discount code' },
      { status: 500 }
    );
  }
}


