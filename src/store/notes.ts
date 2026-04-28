import { create } from 'zustand'
import { Note, Tag } from '@/types'

interface NotesStore {
  notes: Note[]
  tags: Tag[]
  activeNoteId: string | null
  searchQuery: string
  setNotes: (notes: Note[]) => void
  setTags: (tags: Tag[]) => void
  setActiveNote: (id: string | null) => void
  setSearchQuery: (q: string) => void
  addNote: (note: Note) => void
  updateNote: (note: Note) => void
  deleteNote: (id: string) => void
}

export const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  tags: [],
  activeNoteId: null,
  searchQuery: '',
  setNotes: (notes) => set({ notes }),
  setTags: (tags) => set({ tags }),
  setActiveNote: (id) => set({ activeNoteId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
  updateNote: (note) =>
    set((s) => ({ notes: s.notes.map((n) => (n.id === note.id ? note : n)) })),
  deleteNote: (id) =>
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
}))
