/**
 * Study Plan API client.
 */

import { apiClient } from './client';
import type {
  StudyPlan,
  StudyPlanCreate,
  StudyPlanUpdate,
  StudyPlanFull,
  StudyPlanStats,
  StudyTopic,
  StudyTopicCreate,
  StudyTopicUpdate,
  StudySession,
  StudySessionCreate,
  StudySessionUpdate,
  PlanAdjustment,
  WeeklySchedule,
  PlanGenerationRequest,
  PlanGenerationResult,
} from '../types/study-plan';

// ============ Study Plan API ============

export async function createStudyPlan(data: StudyPlanCreate): Promise<StudyPlan> {
  const response = await apiClient.post<StudyPlan>('/study-plans', data);
  return response.data;
}

export async function generateStudyPlan(request: PlanGenerationRequest): Promise<PlanGenerationResult> {
  const response = await apiClient.post<PlanGenerationResult>('/study-plans/generate', request);
  return response.data;
}

export async function getStudyPlans(notebookId?: string, activeOnly = false): Promise<StudyPlan[]> {
  const params = new URLSearchParams();
  if (notebookId) params.append('notebook_id', notebookId);
  if (activeOnly) params.append('active_only', 'true');

  const response = await apiClient.get<StudyPlan[]>(`/study-plans?${params.toString()}`);
  return response.data;
}

export async function getTodaySessions(planId?: string): Promise<StudySession[]> {
  const params = planId ? `?plan_id=${encodeURIComponent(planId)}` : '';
  const response = await apiClient.get<StudySession[]>(`/study-plans/today${params}`);
  return response.data;
}

export async function getStudyPlan(planId: string): Promise<StudyPlanFull> {
  const response = await apiClient.get<StudyPlanFull>(`/study-plans/${encodeURIComponent(planId)}`);
  return response.data;
}

export async function updateStudyPlan(planId: string, data: StudyPlanUpdate): Promise<StudyPlan> {
  const response = await apiClient.patch<StudyPlan>(`/study-plans/${encodeURIComponent(planId)}`, data);
  return response.data;
}

export async function deleteStudyPlan(planId: string): Promise<void> {
  await apiClient.delete(`/study-plans/${encodeURIComponent(planId)}`);
}

export async function getStudyPlanStats(planId: string): Promise<StudyPlanStats> {
  const response = await apiClient.get<StudyPlanStats>(`/study-plans/${encodeURIComponent(planId)}/stats`);
  return response.data;
}

export async function getWeeklySchedule(planId: string, weekStart?: string): Promise<WeeklySchedule> {
  const params = weekStart ? `?week_start=${weekStart}` : '';
  const response = await apiClient.get<WeeklySchedule>(`/study-plans/${encodeURIComponent(planId)}/schedule${params}`);
  return response.data;
}

// ============ Topic API ============

export async function createTopic(planId: string, data: StudyTopicCreate): Promise<StudyTopic> {
  const response = await apiClient.post<StudyTopic>(`/study-plans/${encodeURIComponent(planId)}/topics`, data);
  return response.data;
}

export async function getTopics(planId: string): Promise<StudyTopic[]> {
  const response = await apiClient.get<StudyTopic[]>(`/study-plans/${encodeURIComponent(planId)}/topics`);
  return response.data;
}

export async function getTopic(topicId: string): Promise<StudyTopic> {
  const response = await apiClient.get<StudyTopic>(`/study-plans/topics/${encodeURIComponent(topicId)}`);
  return response.data;
}

export async function updateTopic(topicId: string, data: StudyTopicUpdate): Promise<StudyTopic> {
  const response = await apiClient.patch<StudyTopic>(`/study-plans/topics/${encodeURIComponent(topicId)}`, data);
  return response.data;
}

export async function deleteTopic(topicId: string): Promise<void> {
  await apiClient.delete(`/study-plans/topics/${encodeURIComponent(topicId)}`);
}

// ============ Session API ============

export async function createSession(planId: string, data: StudySessionCreate): Promise<StudySession> {
  const response = await apiClient.post<StudySession>(`/study-plans/${encodeURIComponent(planId)}/sessions`, data);
  return response.data;
}

export async function getSessions(planId: string): Promise<StudySession[]> {
  const response = await apiClient.get<StudySession[]>(`/study-plans/${encodeURIComponent(planId)}/sessions`);
  return response.data;
}

export async function getSession(sessionId: string): Promise<StudySession> {
  const response = await apiClient.get<StudySession>(`/study-plans/sessions/${encodeURIComponent(sessionId)}`);
  return response.data;
}

export async function updateSession(sessionId: string, data: StudySessionUpdate): Promise<StudySession> {
  const response = await apiClient.patch<StudySession>(`/study-plans/sessions/${encodeURIComponent(sessionId)}`, data);
  return response.data;
}

export async function startSession(sessionId: string): Promise<StudySession> {
  const response = await apiClient.post<StudySession>(`/study-plans/sessions/${encodeURIComponent(sessionId)}/start`);
  return response.data;
}

export async function completeSession(
  sessionId: string,
  rating?: number,
  notes?: string
): Promise<StudySession> {
  const params = new URLSearchParams();
  if (rating !== undefined && rating !== null) params.append('rating', rating.toString());
  if (notes) params.append('notes', notes);

  const response = await apiClient.post<StudySession>(
    `/study-plans/sessions/${encodeURIComponent(sessionId)}/complete?${params.toString()}`
  );
  return response.data;
}

export async function skipSession(sessionId: string, reason?: string): Promise<StudySession> {
  const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  const response = await apiClient.post<StudySession>(
    `/study-plans/sessions/${encodeURIComponent(sessionId)}/skip${params}`
  );
  return response.data;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await apiClient.delete(`/study-plans/sessions/${encodeURIComponent(sessionId)}`);
}

// ============ Adjustment API ============

export async function getAdjustments(planId: string): Promise<PlanAdjustment[]> {
  const response = await apiClient.get<PlanAdjustment[]>(`/study-plans/${encodeURIComponent(planId)}/adjustments`);
  return response.data;
}

export async function respondToAdjustment(adjustmentId: string, accepted: boolean): Promise<void> {
  await apiClient.post(`/study-plans/adjustments/${encodeURIComponent(adjustmentId)}/respond`, {
    adjustment_id: adjustmentId,
    accepted,
  });
}
