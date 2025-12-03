import { FormEvent, useEffect, useRef, useState } from 'react'
import { useParseVoiceNote } from '../api/voice'
import { useCreateTask, type TaskPriority, type TaskStatus } from '../api/tasks'

type RecordingState = 'idle' | 'listening' | 'processing'

interface PreviewState {
  open: boolean
  rawTranscript: string
  title: string
  description: string
  priority: TaskPriority
  status: TaskStatus
  dueDate: string | ''
}

export function RecordTaskPage() {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [transcript, setTranscript] = useState('')
  const [supportsSpeech, setSupportsSpeech] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const parseVoice = useParseVoiceNote()
  const createTask = useCreateTask()

  const [preview, setPreview] = useState<PreviewState | null>(null)

  useEffect(() => {
    const SpeechRecognitionGlobal =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognitionGlobal) {
      setSupportsSpeech(true)
      const recognition = new SpeechRecognitionGlobal()
      recognition.lang = 'en-US'
      recognition.interimResults = true
      recognition.continuous = false

      let finalTranscript = ''

      recognition.onstart = () => {
        setRecordingState('listening')
        finalTranscript = ''
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            finalTranscript += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }
        setTranscript((finalTranscript + ' ' + interim).trim())
      }

      recognition.onend = () => {
        setRecordingState('idle')
        if (finalTranscript.trim()) {
          void handleTranscript(finalTranscript.trim())
        }
      }

      recognition.onerror = () => {
        setRecordingState('idle')
      }

      recognitionRef.current = recognition
    }
  }, [])

  const startRecording = () => {
    if (!recognitionRef.current) return
    setTranscript('')
    setRecordingState('listening')
    recognitionRef.current.start()
  }

  const handleTranscript = async (text: string) => {
    setRecordingState('processing')
    try {
      const result = await parseVoice.mutateAsync({ transcript: text })
      setPreview({
        open: true,
        rawTranscript: result.rawTranscript,
        title: result.title || 'New task from voice note',
        description: result.description || result.rawTranscript,
        priority: result.priority ?? 'MEDIUM',
        status: result.status,
        dueDate: result.dueDate ?? '',
      })
    } finally {
      setRecordingState('idle')
    }
  }

  const onManualSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const value = transcript.trim()
    if (!value) return
    await handleTranscript(value)
  }

  const closePreview = () => setPreview(null)

  const confirmCreateTask = (state: PreviewState) => {
    const { title, description, priority, status, dueDate } = state
    createTask.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
      },
      {
        onSuccess: () => {
          setPreview(null)
          setTranscript('')
        },
      },
    )
  }

  return (
    <div className="space-y-6 text-slate-900">
      {/* Mic section */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">
              Capture a task by voice
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Tap the microphone and speak your task. We&apos;ll parse the details so you can tweak them
              before saving.
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Try phrases like
              <span className="mx-1 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                "High priority task to call Alex tomorrow at 3pm"
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className={`group inline-flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 text-slate-900 shadow-[0_16px_40px_rgba(148,163,184,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(148,163,184,0.7)] disabled:cursor-not-allowed disabled:opacity-40 ${
                recordingState === 'listening' ? 'ring-4 ring-rose-500/70 ring-offset-4 ring-offset-white' : ''
              }`}
              onClick={startRecording}
              disabled={!supportsSpeech || recordingState === 'listening'}
            >
              <span className="relative flex h-8 w-8 items-center justify-center">
                {recordingState === 'listening' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400/60" />
                )}
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/90">
                  <span className="h-4 w-2 rounded-full bg-rose-400" />
                </span>
              </span>
            </button>

            <div className="space-y-1 text-sm text-slate-500">
              {!supportsSpeech && (
                <p className="text-amber-600">
                  Your browser does not support live speech recognition. You can still paste or type your
                  voice notes below.
                </p>
              )}
              {supportsSpeech && recordingState === 'idle' && <p>Tap the mic to start listening.</p>}
              {recordingState === 'listening' && (
                <p className="text-emerald-600">Listening… speak your task naturally.</p>
              )}
              {recordingState === 'processing' && (
                <p className="text-sky-600">Processing your voice input…</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Manual transcript box */}
      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.12)] sm:p-5">
        <form onSubmit={onManualSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              Or paste what you said
            </label>
            <textarea
              placeholder="Type or paste your spoken task here…"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
            />
          </div>
          <button
            type="submit"
            disabled={parseVoice.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-sky-500 via-emerald-400 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_35px_rgba(59,130,246,0.5)] transition hover:-translate-y-0.5 hover:from-sky-400 hover:via-emerald-300 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {parseVoice.isPending ? 'Parsing…' : 'Parse and review'}
          </button>
        </form>

        {parseVoice.error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Failed to parse voice input.
          </p>
        )}
      </section>

      {/* Preview modal */}
      {preview?.open && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/70 px-4 py-8">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_22px_70px_rgba(15,23,42,0.65)]">
            <h3 className="text-base font-semibold tracking-tight text-slate-900">Review voice task</h3>
            <p className="mt-1 text-xs text-slate-500">
              We parsed these fields from your voice input. You can tweak them before creating the task.
            </p>

            <div className="mt-3 space-y-3 text-sm">
              <div className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Transcript
                </label>
                <p className="max-h-32 overflow-y-auto rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-700">
                  {preview.rawTranscript}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="preview-title" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Title
                  </label>
                  <input
                    id="preview-title"
                    value={preview.title}
                    onChange={(e) =>
                      setPreview((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="preview-priority" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Priority
                  </label>
                  <select
                    id="preview-priority"
                    value={preview.priority}
                    onChange={(e) =>
                      setPreview((prev) =>
                        prev ? { ...prev, priority: e.target.value as TaskPriority } : prev,
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="preview-status" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </label>
                  <select
                    id="preview-status"
                    value={preview.status}
                    onChange={(e) =>
                      setPreview((prev) =>
                        prev ? { ...prev, status: e.target.value as TaskStatus } : prev,
                      )
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
                  >
                    <option value="PENDING">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="preview-due" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Due date
                  </label>
                  <input
                    id="preview-due"
                    type="datetime-local"
                    value={preview.dueDate}
                    onChange={(e) =>
                      setPreview((prev) => (prev ? { ...prev, dueDate: e.target.value } : prev))
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="preview-description" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Description
                </label>
                <textarea
                  id="preview-description"
                  value={preview.description}
                  onChange={(e) =>
                    setPreview((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/60"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 text-sm">
              <button
                type="button"
                onClick={closePreview}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700 shadow-sm hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => preview && confirmCreateTask(preview)}
                className="rounded-lg bg-gradient-to-r from-emerald-400 via-sky-400 to-indigo-500 px-4 py-1.5 font-semibold text-white shadow-[0_12px_35px_rgba(16,185,129,0.55)] hover:-translate-y-0.5 hover:from-emerald-300 hover:via-sky-300 hover:to-indigo-400"
              >
                Create task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
