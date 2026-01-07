import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET single discount code (admin only)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !discountCode) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ discountCode });
  } catch (error) {
    console.error('Error fetching discount code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discount code' },
      { status: 500 }
    );
  }
}

// PUT update discount code (admin only)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
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

    const updateData: any = {};

    if (code !== undefined) updateData.code = code.toUpperCase().trim();
    if (description !== undefined) updateData.description = description;
    if (discount_type !== undefined) {
      if (!['percentage', 'fixed_amount', 'fixed_price'].includes(discount_type)) {
        return NextResponse.json(
          { error: 'Invalid discount_type' },
          { status: 400 }
        );
      }
      updateData.discount_type = discount_type;
    }
    if (discount_value !== undefined) updateData.discount_value = Number(discount_value);
    if (applies_to !== undefined) {
      if (!['circuits', 'pt', 'joint_pt', 'all'].includes(applies_to)) {
        return NextResponse.json(
          { error: 'Invalid applies_to' },
          { status: 400 }
        );
      }
      updateData.applies_to = applies_to;
    }
    if (min_purchase_amount_pence !== undefined) updateData.min_purchase_amount_pence = min_purchase_amount_pence;
    if (max_discount_amount_pence !== undefined) updateData.max_discount_amount_pence = max_discount_amount_pence;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (usage_limit !== undefined) updateData.usage_limit = usage_limit;
    if (valid_from !== undefined) updateData.valid_from = valid_from;
    if (valid_until !== undefined) updateData.valid_until = valid_until;

    const { data: discountCode, error } = await supabase
      .from('discount_codes')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'A discount code with this code already exists' },
          { status: 409 }
        );
      }
      throw error;
    }

    if (!discountCode) {
      return NextResponse.json(
        { error: 'Discount code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ discountCode });
  } catch (error) {
    console.error('Error updating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to update discount code' },
      { status: 500 }
    );
  }
}

// DELETE discount code (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
    const supabase = await createClient();

    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting discount code:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount code' },
      { status: 500 }
    );
  }
}

