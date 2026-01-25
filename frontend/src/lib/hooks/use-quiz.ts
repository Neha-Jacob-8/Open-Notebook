import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { quizApi } from '@/lib/api/quiz'
import { QUERY_KEYS } from '@/lib/api/query-client'
import { useToast } from '@/lib/hooks/use-toast'
import {
  QuizGenerateRequest,
  SubmitAnswerRequest,
  FlashcardCreateRequest,
  FlashcardGenerateRequest,
  FlashcardReviewRequest,
} from '@/lib/types/quiz'

// ==================== Quiz Hooks ====================

export function useQuizSessions(notebookId: string, limit: number = 20) {
  return useQuery({
    queryKey: QUERY_KEYS.quizSessions(notebookId),
    queryFn: () => quizApi.getQuizSessions(notebookId, limit),
    enabled: !!notebookId,
  })
}

export function useQuizSession(sessionId: string, showAnswers: boolean = false) {
  return useQuery({
    queryKey: QUERY_KEYS.quizSession(sessionId),
    queryFn: () => quizApi.getQuizSession(sessionId, showAnswers),
    enabled: !!sessionId,
  })
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: QuizGenerateRequest) => quizApi.generateQuiz(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.quizSessions(data.notebook_id) })
      toast({
        title: 'Quiz Generated!',
        description: `Created quiz with ${data.question_count} questions`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate quiz',
        variant: 'destructive',
      })
    },
  })
}

export function useSubmitAnswer(sessionId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SubmitAnswerRequest) => quizApi.submitAnswer(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.quizSession(sessionId) })
    },
  })
}

export function useCompleteQuiz() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (sessionId: string) => quizApi.completeQuiz(sessionId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.quizSessions(data.notebook_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.quizSession(data.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyStats })
      
      const scoreMsg = data.score !== undefined 
        ? `Score: ${data.score.toFixed(0)}%` 
        : 'Quiz completed'
      
      toast({
        title: 'Quiz Completed!',
        description: scoreMsg,
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to complete quiz',
        variant: 'destructive',
      })
    },
  })
}

// ==================== Flashcard Hooks ====================

export function useFlashcards(notebookId?: string, dueOnly: boolean = false) {
  const queryKey = dueOnly 
    ? QUERY_KEYS.dueFlashcards(notebookId) 
    : QUERY_KEYS.flashcards(notebookId)
  
  return useQuery({
    queryKey,
    queryFn: () => quizApi.getFlashcards({ 
      notebook_id: notebookId, 
      due_only: dueOnly 
    }),
  })
}

export function useFlashcardStats(notebookId?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.flashcardStats(notebookId),
    queryFn: () => quizApi.getFlashcardStats(notebookId),
  })
}

export function useCreateFlashcard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: FlashcardCreateRequest) => quizApi.createFlashcard(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flashcards(variables.notebook_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flashcardStats(variables.notebook_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyStats })
      toast({
        title: 'Flashcard Created',
        description: 'New flashcard added successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create flashcard',
        variant: 'destructive',
      })
    },
  })
}

export function useGenerateFlashcards() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: FlashcardGenerateRequest) => quizApi.generateFlashcards(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flashcards(variables.notebook_id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flashcardStats(variables.notebook_id) })
      toast({
        title: 'Flashcards Generated!',
        description: `Created ${data.length} flashcards`,
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate flashcards',
        variant: 'destructive',
      })
    },
  })
}

export function useReviewFlashcard() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ flashcardId, data }: { flashcardId: string; data: FlashcardReviewRequest }) =>
      quizApi.reviewFlashcard(flashcardId, data),
    onSuccess: () => {
      // Invalidate all flashcard queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.studyStats })
    },
  })
}

export function useDeleteFlashcard() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (flashcardId: string) => quizApi.deleteFlashcard(flashcardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
      toast({
        title: 'Flashcard Deleted',
        description: 'Flashcard removed successfully',
      })
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete flashcard',
        variant: 'destructive',
      })
    },
  })
}

// ==================== Study Stats Hooks ====================

export function useStudyStats(userId: string = 'default_user') {
  return useQuery({
    queryKey: QUERY_KEYS.studyStats,
    queryFn: () => quizApi.getStudyStats(userId),
  })
}
