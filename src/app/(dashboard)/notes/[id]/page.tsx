import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import NoteEditor from '@/components/editor/NoteEditor'

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: note } = await supabase
    .from('notes')
    .select('*')
    .eq('id', id)
    .single()

  if (!note) notFound()

  return <NoteEditor note={note} />
}
