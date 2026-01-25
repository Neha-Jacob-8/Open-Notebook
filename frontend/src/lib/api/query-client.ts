import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

export const QUERY_KEYS = {
  notebooks: ['notebooks'] as const,
  notebook: (id: string) => ['notebooks', id] as const,
  notes: (notebookId?: string) => ['notes', notebookId] as const,
  note: (id: string) => ['notes', id] as const,
  sources: (notebookId?: string) => ['sources', notebookId] as const,
  sourcesInfinite: (notebookId: string) => ['sources', 'infinite', notebookId] as const,
  source: (id: string) => ['sources', id] as const,
  settings: ['settings'] as const,
  sourceChatSessions: (sourceId: string) => ['source-chat', sourceId, 'sessions'] as const,
  sourceChatSession: (sourceId: string, sessionId: string) => ['source-chat', sourceId, 'sessions', sessionId] as const,
  notebookChatSessions: (notebookId: string) => ['notebook-chat', notebookId, 'sessions'] as const,
  notebookChatSession: (sessionId: string) => ['notebook-chat', 'sessions', sessionId] as const,
  podcastEpisodes: ['podcasts', 'episodes'] as const,
  podcastEpisode: (episodeId: string) => ['podcasts', 'episodes', episodeId] as const,
  episodeProfiles: ['podcasts', 'episode-profiles'] as const,
  speakerProfiles: ['podcasts', 'speaker-profiles'] as const,
  // Quiz and Flashcard keys
  quizSessions: (notebookId: string) => ['quiz', 'sessions', notebookId] as const,
  quizSession: (sessionId: string) => ['quiz', 'sessions', 'detail', sessionId] as const,
  flashcards: (notebookId?: string) => ['flashcards', notebookId] as const,
  flashcardStats: (notebookId?: string) => ['flashcards', 'stats', notebookId] as const,
  dueFlashcards: (notebookId?: string) => ['flashcards', 'due', notebookId] as const,
  studyStats: ['study', 'stats'] as const,
  // Research keys
  researchHistory: ['research', 'history'] as const,
  researchStatus: (taskId: string) => ['research', 'status', taskId] as const,
  researchResult: (taskId: string) => ['research', 'result', taskId] as const,
  // Knowledge Graph keys
  knowledgeGraph: (notebookId: string) => ['knowledge-graph', notebookId] as const,
  knowledgeGraphStatus: (notebookId: string) => ['knowledge-graph', 'status', notebookId] as const,
  knowledgeGraphNode: (nodeId: string) => ['knowledge-graph', 'node', nodeId] as const,
  // Monitoring keys
  monitoring: ['monitoring'] as const,
  monitors: () => ['monitoring', 'monitors'] as const,
  monitor: (sourceId: string) => ['monitoring', 'monitors', sourceId] as const,
  notifications: () => ['monitoring', 'notifications'] as const,
  notificationsUnread: () => ['monitoring', 'notifications', 'unread'] as const,
  notificationCount: () => ['monitoring', 'notifications', 'count'] as const,
  monitoringJobs: () => ['monitoring', 'jobs'] as const,
  monitoringJobHistory: () => ['monitoring', 'jobs', 'history'] as const,
  currentJob: () => ['monitoring', 'jobs', 'current'] as const,
  monitoringStats: () => ['monitoring', 'stats'] as const,
  // OCR keys
  ocrStatus: (taskId: string) => ['ocr', 'status', taskId] as const,
  // Study Plan keys
  studyPlans: (notebookId?: string) => ['study-plans', notebookId] as const,
  studyPlan: (planId: string) => ['study-plans', 'detail', planId] as const,
  studyPlanStats: (planId: string) => ['study-plans', 'stats', planId] as const,
  weeklySchedule: (planId: string) => ['study-plans', 'schedule', planId] as const,
  todaySessions: () => ['study-plans', 'today'] as const,
}
