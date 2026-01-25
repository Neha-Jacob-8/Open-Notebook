/**
 * Study Plan React Query hooks.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as studyPlansApi from '../api/study-plans';
import type {
  StudyPlanCreate,
  StudyPlanUpdate,
  StudyTopicCreate,
  StudyTopicUpdate,
  StudySessionCreate,
  StudySessionUpdate,
  PlanGenerationRequest,
} from '../types/study-plan';

// ============ Query Keys ============

export const studyPlanKeys = {
  all: ['study-plans'] as const,
  lists: () => [...studyPlanKeys.all, 'list'] as const,
  list: (notebookId?: string) => [...studyPlanKeys.lists(), { notebookId }] as const,
  active: () => [...studyPlanKeys.all, 'active'] as const,
  details: () => [...studyPlanKeys.all, 'detail'] as const,
  detail: (planId: string) => [...studyPlanKeys.details(), planId] as const,
  stats: (planId: string) => [...studyPlanKeys.all, 'stats', planId] as const,
  schedule: (planId: string, weekStart?: string) => [...studyPlanKeys.all, 'schedule', planId, weekStart] as const,
  topics: (planId: string) => [...studyPlanKeys.all, 'topics', planId] as const,
  sessions: (planId: string) => [...studyPlanKeys.all, 'sessions', planId] as const,
  todaySessions: (planId?: string) => [...studyPlanKeys.all, 'today', planId] as const,
  adjustments: (planId: string) => [...studyPlanKeys.all, 'adjustments', planId] as const,
};

// ============ Plan Hooks ============

export function useStudyPlans(notebookId?: string) {
  return useQuery({
    queryKey: studyPlanKeys.list(notebookId),
    queryFn: () => studyPlansApi.getStudyPlans(notebookId),
  });
}

export function useActivePlans() {
  return useQuery({
    queryKey: studyPlanKeys.active(),
    queryFn: () => studyPlansApi.getStudyPlans(undefined, true),
  });
}

export function useStudyPlan(planId: string) {
  return useQuery({
    queryKey: studyPlanKeys.detail(planId),
    queryFn: () => studyPlansApi.getStudyPlan(planId),
    enabled: !!planId,
  });
}

export function useStudyPlanStats(planId: string) {
  return useQuery({
    queryKey: studyPlanKeys.stats(planId),
    queryFn: () => studyPlansApi.getStudyPlanStats(planId),
    enabled: !!planId,
  });
}

export function useWeeklySchedule(planId: string, weekStart?: string) {
  return useQuery({
    queryKey: studyPlanKeys.schedule(planId, weekStart),
    queryFn: () => studyPlansApi.getWeeklySchedule(planId, weekStart),
    enabled: !!planId,
  });
}

export function useTodaySessions(planId?: string) {
  return useQuery({
    queryKey: studyPlanKeys.todaySessions(planId),
    queryFn: () => studyPlansApi.getTodaySessions(planId),
  });
}

export function useCreateStudyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StudyPlanCreate) => studyPlansApi.createStudyPlan(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.all });
    },
  });
}

export function useGenerateStudyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: PlanGenerationRequest) => studyPlansApi.generateStudyPlan(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.all });
    },
  });
}

export function useUpdateStudyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: StudyPlanUpdate }) =>
      studyPlansApi.updateStudyPlan(planId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.lists() });
    },
  });
}

export function useDeleteStudyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (planId: string) => studyPlansApi.deleteStudyPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.all });
    },
  });
}

// ============ Topic Hooks ============

export function useTopics(planId: string) {
  return useQuery({
    queryKey: studyPlanKeys.topics(planId),
    queryFn: () => studyPlansApi.getTopics(planId),
    enabled: !!planId,
  });
}

export function useCreateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: StudyTopicCreate }) =>
      studyPlansApi.createTopic(planId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.topics(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
    },
  });
}

export function useUpdateTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, data, planId }: { topicId: string; data: StudyTopicUpdate; planId: string }) =>
      studyPlansApi.updateTopic(topicId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.topics(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
    },
  });
}

export function useDeleteTopic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId, planId }: { topicId: string; planId: string }) =>
      studyPlansApi.deleteTopic(topicId),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.topics(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
    },
  });
}

// ============ Session Hooks ============

export function useSessions(planId: string) {
  return useQuery({
    queryKey: studyPlanKeys.sessions(planId),
    queryFn: () => studyPlansApi.getSessions(planId),
    enabled: !!planId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, data }: { planId: string; data: StudySessionCreate }) =>
      studyPlansApi.createSession(planId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.sessions(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.todaySessions() });
    },
  });
}

export function useUpdateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, data, planId }: { sessionId: string; data: StudySessionUpdate; planId: string }) =>
      studyPlansApi.updateSession(sessionId, data),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.sessions(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.todaySessions() });
    },
  });
}

export function useStartSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, planId }: { sessionId: string; planId: string }) =>
      studyPlansApi.startSession(sessionId),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.sessions(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.todaySessions() });
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId, planId, rating, notes }: {
      sessionId: string;
      planId: string;
      rating?: number;
      notes?: string
    }) => {
      console.log('[useCompleteSession] Calling API with:', { sessionId, planId, rating, notes });
      const result = await studyPlansApi.completeSession(sessionId, rating, notes);
      console.log('[useCompleteSession] API returned:', result);
      return result;
    },
    onSuccess: (data, { planId }) => {
      console.log('[useCompleteSession] onSuccess - invalidating queries for planId:', planId);
      console.log('[useCompleteSession] Session data after completion:', data);
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.sessions(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.stats(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.todaySessions() });
      // Also invalidate the active plans list so progress % updates in the tab buttons
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.active() });
      console.log('[useCompleteSession] All queries invalidated');
    },
    onError: (error) => {
      console.error('[useCompleteSession] Error:', error);
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, planId }: { sessionId: string; planId: string }) =>
      studyPlansApi.deleteSession(sessionId),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.sessions(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.todaySessions() });
    },
  });
}

export function useSkipSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, planId, reason }: { sessionId: string; planId: string; reason?: string }) =>
      studyPlansApi.skipSession(sessionId, reason),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.sessions(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.stats(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.todaySessions() });
    },
  });
}

// ============ Adjustment Hooks ============

export function useAdjustments(planId: string) {
  return useQuery({
    queryKey: studyPlanKeys.adjustments(planId),
    queryFn: () => studyPlansApi.getAdjustments(planId),
    enabled: !!planId,
  });
}

export function useRespondToAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adjustmentId, accepted, planId }: { adjustmentId: string; accepted: boolean; planId: string }) =>
      studyPlansApi.respondToAdjustment(adjustmentId, accepted),
    onSuccess: (_, { planId }) => {
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.adjustments(planId) });
      queryClient.invalidateQueries({ queryKey: studyPlanKeys.detail(planId) });
    },
  });
}
