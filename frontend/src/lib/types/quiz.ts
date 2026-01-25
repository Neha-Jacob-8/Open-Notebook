// Quiz Types

export type QuizDifficulty = 'easy' | 'medium' | 'hard' | 'mixed'
export type QuizStatus = 'in_progress' | 'completed' | 'abandoned'

export interface QuizQuestion {
  id: string
  question: string
  question_type: string
  options: string[]
  difficulty: string
  user_answer?: number
  is_correct?: boolean
  correct_index?: number
  explanation?: string
}

export interface QuizSession {
  id: string
  notebook_id: string
  title?: string
  question_count: number
  correct_count: number
  score?: number
  difficulty: QuizDifficulty
  status: QuizStatus
  started_at?: string
  completed_at?: string
  created: string
}

export interface QuizSessionDetail extends QuizSession {
  questions: QuizQuestion[]
}

export interface QuizGenerateRequest {
  notebook_id: string
  num_questions?: number
  difficulty?: QuizDifficulty
  source_ids?: string[]
  model_id?: string
}

export interface SubmitAnswerRequest {
  question_id: string
  answer: number
  time_spent_seconds?: number
}

export interface SubmitAnswerResponse {
  is_correct: boolean
  correct_index: number
  explanation: string
  session_progress: {
    answered: number
    total: number
    correct: number
  }
}

// Flashcard Types

export type FlashcardState = 0 | 1 | 2 | 3  // New, Learning, Review, Relearning

export interface Flashcard {
  id: string
  front: string
  back: string
  tags: string[]
  difficulty: number
  state: FlashcardState
  due?: string
  reps: number
  created: string
}

export interface FlashcardCreateRequest {
  notebook_id: string
  front: string
  back: string
  source_id?: string
  tags?: string[]
}

export interface FlashcardGenerateRequest {
  notebook_id: string
  num_cards?: number
  source_ids?: string[]
  model_id?: string
}

export interface FlashcardReviewRequest {
  rating: 1 | 2 | 3 | 4  // Again, Hard, Good, Easy
}

export interface FlashcardStats {
  total: number
  new: number
  learning: number
  review: number
  due: number
}

// Study Stats / Gamification Types

export interface StudyStats {
  user_id: string
  current_streak: number
  longest_streak: number
  total_xp: number
  level: number
  badges: string[]
  total_quizzes_completed: number
  total_flashcards_reviewed: number
  total_correct_answers: number
  xp_to_next_level: number
}

// Rating descriptions for UI
export const FLASHCARD_RATINGS = {
  1: { label: 'Again', color: 'destructive', description: 'Complete blackout, wrong answer' },
  2: { label: 'Hard', color: 'warning', description: 'Correct but with significant difficulty' },
  3: { label: 'Good', color: 'default', description: 'Correct with some hesitation' },
  4: { label: 'Easy', color: 'success', description: 'Perfect, instant recall' },
} as const
