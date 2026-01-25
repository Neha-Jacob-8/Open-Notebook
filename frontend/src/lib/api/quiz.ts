import apiClient from './client'
import {
  QuizSession,
  QuizSessionDetail,
  QuizGenerateRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  Flashcard,
  FlashcardCreateRequest,
  FlashcardGenerateRequest,
  FlashcardReviewRequest,
  FlashcardStats,
  StudyStats,
} from '@/lib/types/quiz'

export const quizApi = {
  // Quiz endpoints
  generateQuiz: async (data: QuizGenerateRequest) => {
    const response = await apiClient.post<QuizSession>('/quiz/generate', data)
    return response.data
  },

  getQuizSessions: async (notebookId: string, limit: number = 20) => {
    const response = await apiClient.get<QuizSession[]>('/quiz/sessions', {
      params: { notebook_id: notebookId, limit }
    })
    return response.data
  },

  getQuizSession: async (sessionId: string, showAnswers: boolean = false) => {
    const response = await apiClient.get<QuizSessionDetail>(`/quiz/sessions/${sessionId}`, {
      params: { show_answers: showAnswers }
    })
    return response.data
  },

  submitAnswer: async (sessionId: string, data: SubmitAnswerRequest) => {
    const response = await apiClient.post<SubmitAnswerResponse>(
      `/quiz/sessions/${sessionId}/answer`,
      data
    )
    return response.data
  },

  completeQuiz: async (sessionId: string) => {
    const response = await apiClient.post<QuizSession>(`/quiz/sessions/${sessionId}/complete`)
    return response.data
  },

  // Flashcard endpoints
  createFlashcard: async (data: FlashcardCreateRequest) => {
    const response = await apiClient.post<Flashcard>('/quiz/flashcards', data)
    return response.data
  },

  generateFlashcards: async (data: FlashcardGenerateRequest) => {
    const response = await apiClient.post<Flashcard[]>('/quiz/flashcards/generate', data)
    return response.data
  },

  getFlashcards: async (params?: { notebook_id?: string; due_only?: boolean; limit?: number }) => {
    const response = await apiClient.get<Flashcard[]>('/quiz/flashcards', { params })
    return response.data
  },

  getFlashcardStats: async (notebookId?: string) => {
    const response = await apiClient.get<FlashcardStats>('/quiz/flashcards/stats', {
      params: notebookId ? { notebook_id: notebookId } : undefined
    })
    return response.data
  },

  reviewFlashcard: async (flashcardId: string, data: FlashcardReviewRequest) => {
    const response = await apiClient.post<Flashcard>(`/quiz/flashcards/${flashcardId}/review`, data)
    return response.data
  },

  deleteFlashcard: async (flashcardId: string) => {
    await apiClient.delete(`/quiz/flashcards/${flashcardId}`)
  },

  // Study stats
  getStudyStats: async (userId: string = 'default_user') => {
    const response = await apiClient.get<StudyStats>('/quiz/stats', {
      params: { user_id: userId }
    })
    return response.data
  },
}
