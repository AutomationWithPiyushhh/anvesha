'use client'

import { useState } from 'react'
import { StudentNoteItem, createStudentNoteAction, deleteStudentNoteAction } from '@/lib/notes/actions'
import { addLessonResourceAction, deleteLessonResourceAction } from '@/lib/resources/actions'
import {
  BookOpen,
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  Clock,
  Download,
  Loader2,
  Link as LinkIcon,
  CheckCircle2,
  Bookmark,
} from 'lucide-react'

interface ResourceItem {
  id: string
  video_id: string
  title: string
  url: string
  created_at: string
}

interface LessonTabsProps {
  videoId: string
  isAdmin: boolean
  initialResources: ResourceItem[]
  initialNotes: StudentNoteItem[]
}

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LessonTabs({
  videoId,
  isAdmin,
  initialResources,
  initialNotes,
}: LessonTabsProps) {
  const [activeTab, setActiveTab] = useState<'notes' | 'resources'>('notes')
  const [notes, setNotes] = useState<StudentNoteItem[]>(initialNotes)
  const [resources, setResources] = useState<ResourceItem[]>(initialResources)

  // Note form state
  const [noteContent, setNoteContent] = useState('')
  const [noteTimestamp, setNoteTimestamp] = useState<number>(0)
  const [savingNote, setSavingNote] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)

  // Resource form state (Admin)
  const [showAddResource, setShowAddResource] = useState(false)
  const [resTitle, setResTitle] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [savingRes, setSavingRes] = useState(false)
  const [resError, setResError] = useState<string | null>(null)

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!noteContent.trim()) return

    setSavingNote(true)
    setNoteError(null)

    try {
      const res = await createStudentNoteAction({
        videoId,
        content: noteContent,
        timestampSeconds: noteTimestamp,
      })

      if (!res.success || !res.note) {
        setNoteError(res.error || 'Failed to save note')
      } else {
        setNotes((prev) => [...prev, res.note!].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds))
        setNoteContent('')
        setNoteTimestamp(0)
      }
    } catch (err: unknown) {
      setNoteError(err instanceof Error ? err.message : 'Failed to save note')
    } finally {
      setSavingNote(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const res = await deleteStudentNoteAction(noteId)
      if (res.success) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId))
      }
    } catch {
      // Ignored
    }
  }

  const handleExportNotes = () => {
    if (notes.length === 0) return
    const content = notes
      .map((n) => `### [${formatDuration(n.timestamp_seconds)}]\n${n.content}\n`)
      .join('\n---\n\n')

    const blob = new Blob([`# Personal Study Notes\n\n${content}`], {
      type: 'text/markdown',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lesson-notes-${videoId.slice(0, 8)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resTitle.trim() || !resUrl.trim()) return

    setSavingRes(true)
    setResError(null)

    try {
      const res = await addLessonResourceAction(videoId, {
        title: resTitle,
        url: resUrl,
      })

      if (!res.success || !res.resource) {
        setResError(res.error || 'Failed to add resource')
      } else {
        setResources((prev) => [...prev, res.resource!])
        setResTitle('')
        setResUrl('')
        setShowAddResource(false)
      }
    } catch (err: unknown) {
      setResError(err instanceof Error ? err.message : 'Failed to add resource')
    } finally {
      setSavingRes(false)
    }
  }

  const handleDeleteResource = async (resId: string) => {
    const confirm = window.confirm('Delete this resource attachment?')
    if (!confirm) return

    try {
      const res = await deleteLessonResourceAction(resId, videoId)
      if (res.success) {
        setResources((prev) => prev.filter((r) => r.id !== resId))
      }
    } catch {
      // Ignored
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-6 pt-4 border-b border-slate-100">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4 text-amber-500" />
            <span>My Personal Notes</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {notes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'resources'
                ? 'border-amber-500 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Code & Resources</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {resources.length}
            </span>
          </button>
        </div>

        {activeTab === 'notes' && notes.length > 0 && (
          <button
            onClick={handleExportNotes}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors mb-2"
            title="Download notes as Markdown file"
          >
            <Download className="w-3.5 h-3.5" />
            Export (.md)
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* ================= NOTES TAB ================= */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            {/* Note Input Box */}
            <form onSubmit={handleAddNote} className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Add Timestamped Note:</span>
                <div className="flex items-center gap-2">
                  <span>Timestamp (seconds):</span>
                  <input
                    type="number"
                    min="0"
                    value={noteTimestamp}
                    onChange={(e) => setNoteTimestamp(parseInt(e.target.value, 10) || 0)}
                    className="w-16 px-2 py-0.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-1 focus:ring-amber-400"
                  />
                  <span className="font-mono text-slate-400">
                    ({formatDuration(noteTimestamp)})
                  </span>
                </div>
              </div>

              <textarea
                rows={2}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Write an insight, key takeaway, or code snippet reminder at this timestamp..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all resize-none"
              />

              {noteError && (
                <p className="text-xs text-rose-600 font-medium">{noteError}</p>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingNote || !noteContent.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 transition-colors shadow-sm disabled:opacity-40"
                >
                  {savingNote && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save Note
                </button>
              </div>
            </form>

            {/* Notes List */}
            {notes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No personal notes taken yet. Use the box above to jot down key engineering concepts while watching!
              </div>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-4 group hover:bg-white hover:border-slate-300 transition-all shadow-2xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          {formatDuration(note.timestamp_seconds)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Delete Note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= RESOURCES TAB ================= */}
        {activeTab === 'resources' && (
          <div className="space-y-6">
            {/* Admin Add Resource Form */}
            {isAdmin && (
              <div>
                {!showAddResource ? (
                  <button
                    onClick={() => setShowAddResource(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors border border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Attach Code / Resource Link
                  </button>
                ) : (
                  <form
                    onSubmit={handleAddResource}
                    className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3"
                  >
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Attach Lesson Resource
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={resTitle}
                        onChange={(e) => setResTitle(e.target.value)}
                        placeholder="Title (e.g. Starter Code & Architecture Diagrams)"
                        className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />

                      <input
                        type="url"
                        required
                        value={resUrl}
                        onChange={(e) => setResUrl(e.target.value)}
                        placeholder="https://github.com/your-username/course-repo"
                        className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                    </div>

                    {resError && (
                      <p className="text-xs text-rose-600 font-medium">{resError}</p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddResource(false)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingRes}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 shadow-sm"
                      >
                        {savingRes && <Loader2 className="w-3 h-3 animate-spin" />}
                        Add Resource
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Resources List */}
            {resources.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                No external resources or code repositories attached to this lesson yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resources.map((res) => {
                  let hostname = 'External Link'
                  try {
                    hostname = new URL(res.url).hostname
                  } catch {
                    // Ignored
                  }

                  return (
                    <div
                      key={res.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3 group hover:border-amber-400 hover:bg-white transition-all shadow-2xs"
                    >
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center shrink-0">
                          <LinkIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                            {res.title}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{hostname}</span>
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </div>
                      </a>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteResource(res.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                          title="Delete Resource"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
