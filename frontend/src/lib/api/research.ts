/**
 * Research API Client
 * Functions for interacting with the multi-agent research pipeline
 */

import { apiClient } from './client'
import type { 
  ResearchRequest, 
  ResearchProgress, 
  ResearchResult, 
  ResearchSummary 
} from '../types/research'

/**
 * Start a new research task (async)
 */
export async function startResearch(request: ResearchRequest): Promise<ResearchProgress> {
  const response = await apiClient.post<ResearchProgress>('/research/start', request)
  return response.data
}

/**
 * Get the status of a research task
 */
export async function getResearchStatus(taskId: string): Promise<ResearchProgress> {
  const response = await apiClient.get<ResearchProgress>(`/research/status/${taskId}`)
  return response.data
}

/**
 * Get the result of a completed research task
 */
export async function getResearchResult(taskId: string): Promise<ResearchResult> {
  const response = await apiClient.get<ResearchResult>(`/research/result/${taskId}`)
  return response.data
}

/**
 * Get history of research tasks
 */
export async function getResearchHistory(limit = 20, offset = 0): Promise<ResearchSummary[]> {
  const response = await apiClient.get<ResearchSummary[]>('/research/history', {
    params: { limit, offset }
  })
  return response.data
}

/**
 * Run a synchronous (quick) research task
 */
export async function quickResearch(request: ResearchRequest): Promise<ResearchResult> {
  const response = await apiClient.post<ResearchResult>('/research/quick', request)
  return response.data
}

/**
 * Delete a research task
 */
export async function deleteResearch(taskId: string): Promise<void> {
  await apiClient.delete(`/research/${taskId}`)
}
