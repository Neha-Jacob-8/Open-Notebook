/**
 * Research System Types
 * Multi-agent research pipeline types
 */

export type ResearchType = 'deep_dive' | 'fact_check' | 'comparison' | 'synthesis' | 'quick_answer'

export type ResearchStatus = 'pending' | 'routing' | 'researching' | 'fact_checking' | 'synthesizing' | 'reporting' | 'completed' | 'error'

export interface Citation {
  source_id: string
  title: string
  quote?: string
}

export interface ResearchRequest {
  query: string
  source_ids?: string[]
  research_type?: ResearchType
  model_config?: Record<string, unknown>
}

export interface ResearchProgress {
  task_id: string
  status: ResearchStatus
  current_step: string
  progress_percent: number
  message: string
  started_at: string
  updated_at: string
}

export interface ResearchResult {
  task_id: string
  query: string
  research_type: ResearchType
  scholar_findings: string
  fact_check_results: string
  synthesis: string
  final_report: string
  citations: Citation[]
  metadata: Record<string, unknown>
  created_at: string
  completed_at?: string
}

export interface ResearchSummary {
  task_id: string
  query: string
  research_type: ResearchType
  status: ResearchStatus
  created_at: string
  completed_at?: string
}
