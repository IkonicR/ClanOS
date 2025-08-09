import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/admin'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createClient()
    const { error, count } = await supabaseAdmin
      .from('invite_codes')
      .delete({ count: 'exact' })
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!count) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


