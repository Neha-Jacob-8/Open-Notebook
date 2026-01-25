/**
 * Knowledge Graph Hooks
 * React Query hooks for knowledge graph operations
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '../api/query-client'
import {
  buildKnowledgeGraph,
  getGraphStatus,
  getKnowledgeGraph,
  getNodeDetails,
  deleteKnowledgeGraph,
} from '../api/knowledge-graph'
import type { BuildGraphRequest, BuildStatus } from '../types/knowledge-graph'
import { useEffect } from 'react'

/**
 * Hook to get knowledge graph data for a notebook
 */
export function useKnowledgeGraph(notebookId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.knowledgeGraph(notebookId || ''),
    queryFn: () => getKnowledgeGraph(notebookId!),
    enabled: !!notebookId,
  })
}

/**
 * Hook to get knowledge graph build status with polling
 */
export function useKnowledgeGraphStatus(notebookId: string | null) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: QUERY_KEYS.knowledgeGraphStatus(notebookId || ''),
    queryFn: () => getGraphStatus(notebookId!),
    enabled: !!notebookId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      // Poll while building
      if (data.build_status === 'building') {
        return 2000
      }
      return false
    },
  })
  
  // Invalidate graph data when build completes
  useEffect(() => {
    if (query.data?.build_status === 'completed' && notebookId) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.knowledgeGraph(notebookId) })
    }
  }, [query.data?.build_status, notebookId, queryClient])
  
  return query
}

/**
 * Hook to build a knowledge graph
 */
export function useBuildKnowledgeGraph() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: buildKnowledgeGraph,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.knowledgeGraphStatus(data.notebook_id) 
      })
    },
  })
}

/**
 * Hook to get node details
 */
export function useNodeDetails(nodeId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.knowledgeGraphNode(nodeId || ''),
    queryFn: () => getNodeDetails(nodeId!),
    enabled: !!nodeId,
  })
}

/**
 * Hook to delete a knowledge graph
 */
export function useDeleteKnowledgeGraph() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteKnowledgeGraph,
    onSuccess: (_, notebookId) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.knowledgeGraph(notebookId) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.knowledgeGraphStatus(notebookId) })
    },
  })
}
