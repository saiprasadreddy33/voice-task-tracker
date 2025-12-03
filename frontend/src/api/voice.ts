import { useMutation } from '@tanstack/react-query'
import { apiClient } from './client'
import type { Task, TaskPriority, TaskStatus } from './tasks'

export interface VoiceNote {
  id: string
  audioUrl?: string | null
  transcript?: string | null
  createdAt: string
}

export interface CreateVoiceNoteInput {
  transcript: string
  audioUrl?: string
}

export interface CreateVoiceNoteResponse {
  voiceNote: VoiceNote
  task: Task
}

export function useCreateVoiceNote() {
  return useMutation({
    mutationFn: (input: CreateVoiceNoteInput) =>
      apiClient.post<CreateVoiceNoteResponse>('/api/voice-notes', input),
  })
}

export function useParseVoiceNote() {
  return useMutation({
    mutationFn: (input: CreateVoiceNoteInput) =>
      apiClient.post<ParsedVoiceResult>('/api/voice-notes/parse', input),
  })
}
