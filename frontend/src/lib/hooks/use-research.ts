/**
 * Research Hooks
 * React Query hooks for the multi-agent research pipeline
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../api/query-client'
import {
  startResearch,
  getResearchStatus,
  getResearchResult,
  getResearchHistory,
  quickResearch,
  deleteResearch,
} from '../api/research'
import type { ResearchRequest, ResearchResult, ResearchStatus } from '../types/research'
import { useEffect } from 'react'

/**
 * Hook to start a new research task
 */
export function useStartResearch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: startResearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.researchHistory })
    },
  })
}

/**
 * Hook to get research status with polling
 */
export function useResearchStatus(taskId: string | null, enabled = true) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: QUERY_KEYS.researchStatus(taskId || ''),
    queryFn: () => getResearchStatus(taskId!),
    enabled: enabled && !!taskId,
    refetchInterval: (query) => {
      // Poll every 2 seconds while in progress
      const data = query.state.data
      if (!data) return 2000
      if (['completed', 'error'].includes(data.status)) {
        return false // Stop polling
      }
      return 2000
    },
  })
  
  // Invalidate result query when completed
  useEffect(() => {
    if (query.data?.status === 'completed' && taskId) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.researchResult(taskId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.researchHistory })
    }
  }, [query.data?.status, taskId, queryClient])
  
  return query
}

/**
 * Hook to get research result
 */
export function useResearchResult(taskId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.researchResult(taskId || ''),
    queryFn: () => getResearchResult(taskId!),
    enabled: !!taskId,
  })
}

/**
 * Hook to get research history
 */
export function useResearchHistory(limit = 20, offset = 0) {
  return useQuery({
    queryKey: [...QUERY_KEYS.researchHistory, limit, offset],
    queryFn: () => getResearchHistory(limit, offset),
  })
}

/**
 * Hook for quick (synchronous) research
 */
export function useQuickResearch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: quickResearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.researchHistory })
    },
  })
}

/**
 * Hook to delete a research task
 */
export function useDeleteResearch() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteResearch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.researchHistory })
    },
  })
}

/**
 * Combined hook for managing research workflow
 */
export function useResearch() {
  const startMutation = useStartResearch()
  const quickMutation = useQuickResearch()
  const deleteMutation = useDeleteResearch()
  const { data: history } = useResearchHistory()
  
  return {
    startResearch: startMutation.mutateAsync,
    isStarting: startMutation.isPending,
    quickResearch: quickMutation.mutateAsync,
    isQuickResearching: quickMutation.isPending,
    deleteResearch: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    history,
  }
}
