'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { createClient } from '@/lib/supabase/client'
import { useNotesStore } from '@/store/notes'
import { Note } from '@/types'
import { WIKI_LINK_REGEX } from './WikiLinkExtension'
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  note: Note
}

export default function NoteEditor({ note }: Props) {
  const supabase = createClient()
  const { updateNote, notes } = useNotesStore()
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const extractWikiLinks = useCallback((content: string): string[] => {
    const matches: string[] = []
    let match
    const regex = new RegExp(WIKI_LINK_REGEX.source, 'g')
    while ((match = regex.exec(content)) !== null) {
      matches.push(match[1])
    }
    return matches
  }, [])

  const syncLinks = useCallback(async (noteId: string, content: string) => {
    const linkedTitles = extractWikiLinks(content)
    await supabase.from('note_links').delete().eq('source_id', noteId)
    if (linkedTitles.length === 0) return

    const { data: targetNotes } = await supabase
      .from('notes')
      .select('id, title')
      .in('title', linkedTitles)

    if (targetNotes && targetNotes.length > 0) {
      await supabase.from('note_links').insert(
        targetNotes.map((t) => ({ source_id: noteId, target_id: t.id }))
      )
    }
  }, [supabase, extractWikiLinks])

  const saveNote = useCallback(async (title: string, content: string) => {
    const { data } = await supabase
      .from('notes')
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq('id', note.id)
      .select()
      .single()
    if (data) {
      updateNote(data)
      await syncLinks(note.id, content)
    }
  }, [supabase, note.id, updateNote, syncLinks])

  const scheduleSave = useCallback((title: string, content: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => saveNote(title, content), 800)
  }, [saveNote])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Bắt đầu viết... Dùng [[tên-ghi-chú]] để liên kết' }),
      CharacterCount,
    ],
    content: note.content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[calc(100vh-200px)] px-8 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML()
      const title = titleRef.current?.value || note.title
      scheduleSave(title, content)
    },
  })

  useEffect(() => {
    if (editor && note.content !== editor.getHTML()) {
      editor.commands.setContent(note.content)
    }
    if (titleRef.current) {
      titleRef.current.value = note.title
    }
  }, [note.id])

  useEffect(() => {
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [])

  const ToolbarButton = ({ onClick, active, children, title }: {
    onClick: () => void; active?: boolean; children: React.ReactNode; title: string
  }) => (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={cn(
        'p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors',
        active && 'bg-slate-700 text-white'
      )}
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-col h-full bg-slate-950">
      {/* Title */}
      <div className="px-8 pt-6 pb-2 border-b border-slate-800">
        <input
          ref={titleRef}
          defaultValue={note.title}
          placeholder="Tiêu đề..."
          onChange={(e) => {
            const content = editor?.getHTML() || note.content
            scheduleSave(e.target.value, content)
          }}
          className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-slate-600 outline-none"
        />
        <p className="text-xs text-slate-600 mt-1">
          {editor?.storage.characterCount?.characters() ?? 0} ký tự ·{' '}
          {editor?.storage.characterCount?.words() ?? 0} từ
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-6 py-1.5 border-b border-slate-800 bg-slate-900/50">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          title="Bold"
        ><Bold className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          title="Italic"
        ><Italic className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          active={editor?.isActive('strike')}
          title="Strikethrough"
        ><Strikethrough className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleCode().run()}
          active={editor?.isActive('code')}
          title="Code"
        ><Code className="w-3.5 h-3.5" /></ToolbarButton>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor?.isActive('heading', { level: 1 })}
          title="H1"
        ><span className="text-xs font-bold">H1</span></ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive('heading', { level: 2 })}
          title="H2"
        ><span className="text-xs font-bold">H2</span></ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor?.isActive('heading', { level: 3 })}
          title="H3"
        ><span className="text-xs font-bold">H3</span></ToolbarButton>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
          title="Bullet list"
        ><List className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
          title="Ordered list"
        ><ListOrdered className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive('blockquote')}
          title="Quote"
        ><Quote className="w-3.5 h-3.5" /></ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          title="Divider"
        ><Minus className="w-3.5 h-3.5" /></ToolbarButton>
        <div className="w-px h-4 bg-slate-700 mx-1" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          active={editor?.isActive('codeBlock')}
          title="Code block"
        ><span className="text-xs font-mono">{ }</span></ToolbarButton>

        <div className="ml-auto flex items-center gap-2">
          <WikiLinkHint notes={notes} editorContent={editor?.getText() || ''} />
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function WikiLinkHint({ notes, editorContent }: { notes: Note[]; editorContent: string }) {
  const matches = [...editorContent.matchAll(/\[\[([^\]]+)\]\]/g)]
  if (matches.length === 0) return null

  const linked = matches
    .map((m) => m[1])
    .filter((title) => notes.some((n) => n.title === title))

  return (
    <span className="text-xs text-indigo-400">
      {linked.length} liên kết
    </span>
  )
}
