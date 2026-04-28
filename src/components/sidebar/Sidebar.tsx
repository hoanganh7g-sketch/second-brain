'use client'

import { useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useNotesStore } from '@/store/notes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Brain, Plus, Search, GitFork, FileText, LogOut, Trash2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from '@/lib/date'

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const { notes, activeNoteId, searchQuery, setNotes, setActiveNote, setSearchQuery, addNote, deleteNote } =
    useNotesStore()

  const loadNotes = useCallback(async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false })
    if (data) setNotes(data)
  }, [supabase, setNotes])

  useEffect(() => { loadNotes() }, [loadNotes])

  async function createNote() {
    const { data, error } = await supabase
      .from('notes')
      .insert({ title: 'Untitled', content: '' })
      .select()
      .single()
    if (data && !error) {
      addNote(data)
      setActiveNote(data.id)
      router.push(`/notes/${data.id}`)
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    await supabase.from('notes').delete().eq('id', id)
    deleteNote(id)
    if (activeNoteId === id) {
      router.push('/notes')
      setActiveNote(null)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <aside className="flex flex-col w-64 h-full bg-slate-900 border-r border-slate-700/50">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-700/50">
        <div className="p-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30">
          <Brain className="w-5 h-5 text-indigo-400" />
        </div>
        <span className="font-semibold text-white text-sm">Second Brain</span>
      </div>

      {/* Actions */}
      <div className="p-3 space-y-2">
        <Button
          onClick={createNote}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm h-8 gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Ghi chú mới
        </Button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm bg-slate-800 border-slate-600 text-white placeholder:text-slate-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Nav */}
      <div className="px-3 pb-2">
        <Link href="/graph">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2 text-sm h-8 text-slate-400 hover:text-white hover:bg-slate-800',
              pathname === '/graph' && 'bg-slate-800 text-white'
            )}
          >
            <GitFork className="w-3.5 h-3.5" /> Graph View
          </Button>
        </Link>
      </div>

      <Separator className="bg-slate-700/50" />

      {/* Notes list */}
      <ScrollArea className="flex-1 px-2 py-2">
        <p className="px-2 py-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
          Ghi chú ({filtered.length})
        </p>
        <div className="space-y-0.5 mt-1">
          {filtered.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`}>
              <div
                className={cn(
                  'group flex items-start justify-between px-2 py-2 rounded-lg cursor-pointer transition-colors',
                  activeNoteId === note.id
                    ? 'bg-indigo-600/20 border border-indigo-500/30'
                    : 'hover:bg-slate-800'
                )}
                onClick={() => setActiveNote(note.id)}
              >
                <div className="flex items-start gap-2 min-w-0">
                  <FileText className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className={cn(
                      'text-sm truncate',
                      activeNoteId === note.id ? 'text-indigo-300' : 'text-slate-300'
                    )}>
                      {note.title || 'Untitled'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {formatDistanceToNow(note.updated_at)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(e, note.id)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-500 hover:text-red-400 transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-slate-500 px-2 py-4 text-center">
              {searchQuery ? 'Không tìm thấy ghi chú' : 'Chưa có ghi chú nào'}
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-2 text-sm h-8 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <LogOut className="w-3.5 h-3.5" /> Đăng xuất
        </Button>
      </div>
    </aside>
  )
}
