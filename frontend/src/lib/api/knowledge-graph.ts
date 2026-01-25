/**
 * Knowledge Graph API Client
 */

import { apiClient } from './client'
import type { 
  GraphData, 
  GraphMeta, 
  NodeDetail, 
  BuildGraphRequest 
} from '../types/knowledge-graph'

/**
 * Build a knowledge graph for a notebook
 */
export async function buildKnowledgeGraph(request: BuildGraphRequest): Promise<GraphMeta> {
  const response = await apiClient.post<GraphMeta>('/knowledge-graph/build', request)
  return response.data
}

/**
 * Get the build status of a notebook's knowledge graph
 */
export async function getGraphStatus(notebookId: string): Promise<GraphMeta> {
  const response = await apiClient.get<GraphMeta>(`/knowledge-graph/status/${notebookId}`)
  return response.data
}

/**
 * Get the complete knowledge graph for a notebook
 */
export async function getKnowledgeGraph(notebookId: string): Promise<GraphData> {
  const response = await apiClient.get<GraphData>(`/knowledge-graph/${notebookId}`)
  return response.data
}

/**
 * Get detailed information about a specific node
 */
export async function getNodeDetails(nodeId: string): Promise<NodeDetail> {
  const response = await apiClient.get<NodeDetail>(`/knowledge-graph/node/${nodeId}`)
  return response.data
}

/**
 * Get all nodes for a notebook
 */
export async function getNodes(notebookId: string, type?: string): Promise<unknown[]> {
  const response = await apiClient.get(`/knowledge-graph/nodes/${notebookId}`, {
    params: type ? { type } : undefined
  })
  return response.data
}

/**
 * Delete a notebook's knowledge graph
 */
export async function deleteKnowledgeGraph(notebookId: string): Promise<void> {
  await apiClient.delete(`/knowledge-graph/${notebookId}`)
}
