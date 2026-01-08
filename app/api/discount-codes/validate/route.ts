import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface DiscountCodeValidationRequest {
  code: string;
  creditType: 'circuits' | 'pt' | 'joint_pt';
  purchaseAmountPence: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body: DiscountCodeValidationRequest = await request.json();

    const { code, creditType, purchaseAmountPence } = body;

    if (!code || !creditType || purchaseAmountPence === undefined) {
      return NextResponse.json(
        { error: 'Code, creditType, and purchaseAmountPence are required' },
        { status: 400 }
      );
    }

    // Look up the discount code
    const { data: discountCode, error: lookupError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .single();

    if (lookupError || !discountCode) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 404 }
      );
    }

    // Check if code is active
    if (!discountCode.is_active) {
      return NextResponse.json(
        { error: 'This discount code is no longer active' },
        { status: 400 }
      );
    }

    // Check validity dates
    const now = new Date();
    if (discountCode.valid_from && new Date(discountCode.valid_from) > now) {
      return NextResponse.json(
        { error: 'This discount code is not yet valid' },
        { status: 400 }
      );
    }

    if (discountCode.valid_until && new Date(discountCode.valid_until) < now) {
      return NextResponse.json(
        { error: 'This discount code has expired' },
        { status: 400 }
      );
    }

    // Check if code applies to this credit type
    if (discountCode.applies_to !== 'all' && discountCode.applies_to !== creditType) {
      return NextResponse.json(
        { error: 'This discount code does not apply to this purchase type' },
        { status: 400 }
      );
    }

    // Check usage limit
    if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
      return NextResponse.json(
        { error: 'This discount code has reached its usage limit' },
        { status: 400 }
      );
    }

    // Check minimum purchase amount
    if (discountCode.min_purchase_amount_pence && purchaseAmountPence < discountCode.min_purchase_amount_pence) {
      return NextResponse.json(
        { 
          error: `Minimum purchase amount is £${(discountCode.min_purchase_amount_pence / 100).toFixed(2)}` 
        },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmountPence = 0;
    let finalPricePence = purchaseAmountPence;

    if (discountCode.discount_type === 'fixed_price') {
      // Fixed price: set final price to discount_value (in pence)
      finalPricePence = Number(discountCode.discount_value);
      discountAmountPence = purchaseAmountPence - finalPricePence;
    } else if (discountCode.discount_type === 'percentage') {
      // Percentage discount
      discountAmountPence = Math.floor(purchaseAmountPence * (Number(discountCode.discount_value) / 100));
      
      // Apply max discount limit if set
      if (discountCode.max_discount_amount_pence && discountAmountPence > discountCode.max_discount_amount_pence) {
        discountAmountPence = discountCode.max_discount_amount_pence;
      }
      
      finalPricePence = purchaseAmountPence - discountAmountPence;
    } else if (discountCode.discount_type === 'fixed_amount') {
      // Fixed amount discount (in pence)
      discountAmountPence = Number(discountCode.discount_value);
      
      // Apply max discount limit if set
      if (discountCode.max_discount_amount_pence && discountAmountPence > discountCode.max_discount_amount_pence) {
        discountAmountPence = discountCode.max_discount_amount_pence;
      }
      
      finalPricePence = purchaseAmountPence - discountAmountPence;
    }

    // Ensure final price is not negative
    if (finalPricePence < 0) {
      finalPricePence = 0;
      discountAmountPence = purchaseAmountPence;
    }

    return NextResponse.json({
      valid: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        description: discountCode.description,
      },
      originalPricePence: purchaseAmountPence,
      discountAmountPence,
      finalPricePence,
    });
  } catch (error) {
    console.error('Error validating discount code:', error);
    return NextResponse.json(
      { error: 'Failed to validate discount code' },
      { status: 500 }
    );
  }
}


