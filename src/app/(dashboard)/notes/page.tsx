import { Brain, FileText, GitFork } from 'lucide-react'

export default function NotesPage() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
            <Brain className="w-10 h-10 text-indigo-400" />
          </div>
        </div>
        <h2 className="text-xl font-semibold text-white">Chào mừng đến Second Brain</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Chọn một ghi chú từ sidebar hoặc tạo ghi chú mới để bắt đầu.
          Dùng <code className="text-indigo-400 bg-indigo-400/10 px-1 rounded">[[tên-ghi-chú]]</code> để tạo liên kết giữa các ý tưởng.
        </p>
        <div className="flex items-center justify-center gap-6 text-xs text-slate-500 pt-2">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Markdown editor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5" />
            <span>Graph view</span>
          </div>
        </div>
      </div>
    </div>
  )
}
