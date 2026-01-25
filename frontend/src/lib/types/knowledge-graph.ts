/**
 * Knowledge Graph Types
 */

export type NodeType = 'concept' | 'person' | 'event' | 'place' | 'organization'

export type BuildStatus = 'not_built' | 'pending' | 'building' | 'completed' | 'error'

export interface GraphNode {
  id: string
  label: string
  type: NodeType
  description?: string
  importance: number
  mentions: number
  val: number  // Size for visualization
  color: string
  // Added by force graph
  x?: number
  y?: number
  vx?: number
  vy?: number
}

export interface GraphLink {
  source: string | GraphNode
  target: string | GraphNode
  relationship: string
  weight: number
}

export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

export interface GraphMeta {
  notebook_id: string
  node_count: number
  edge_count: number
  last_built: string | null
  build_status: BuildStatus
  error_message?: string
}

export interface NodeDetail {
  node: {
    id: string
    label: string
    type: NodeType
    description?: string
    importance: number
    mentions: number
    source_ids: string[]
    notebook_id: string
  }
  connections: Array<{
    id: string
    label: string
    type: NodeType
    description?: string
  }>
  edges: Array<{
    id: string
    source_node: string
    target_node: string
    relationship: string
    description?: string
    weight: number
  }>
}

export interface BuildGraphRequest {
  notebook_id: string
  model_id?: string
}
