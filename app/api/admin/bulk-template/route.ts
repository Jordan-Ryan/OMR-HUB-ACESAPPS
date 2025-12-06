import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();

    const { data: template, error } = await supabase
      .from('bulk_creation_templates')
      .select('*')
      .eq('user_id', admin.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" - that's okay, return default
      throw error;
    }

    return NextResponse.json({ template: template || null });
  } catch (error) {
    console.error('Error fetching bulk template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bulk template' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const supabase = await createClient();
    const body = await request.json();

    const { template_data } = body;

    if (!template_data || !Array.isArray(template_data)) {
      return NextResponse.json(
        { error: 'template_data is required and must be an array' },
        { status: 400 }
      );
    }

    // Check if template exists for this user
    const { data: existing } = await supabase
      .from('bulk_creation_templates')
      .select('id')
      .eq('user_id', admin.id)
      .limit(1)
      .single();

    let result;
    if (existing) {
      // Update existing template
      const { data, error } = await supabase
        .from('bulk_creation_templates')
        .update({
          template_data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new template
      const { data, error } = await supabase
        .from('bulk_creation_templates')
        .insert({
          user_id: admin.id,
          template_data,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ template: result });
  } catch (error) {
    console.error('Error saving bulk template:', error);
    return NextResponse.json(
      { error: 'Failed to save bulk template' },
      { status: 500 }
    );
  }
}

