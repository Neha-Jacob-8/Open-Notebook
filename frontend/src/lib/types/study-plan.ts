/**
 * Study Plan types.
 * AI-generated personalized study schedules.
 */

export type PlanStatus = 'active' | 'completed' | 'paused' | 'cancelled';
export type TopicDifficulty = 'easy' | 'medium' | 'hard';
export type TopicStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type SessionType = 'learn' | 'review' | 'practice' | 'quiz';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
export type AdjustmentType = 'reschedule' | 'add_review' | 'extend_deadline' | 'increase_hours' | 'reduce_scope';
export type AdjustmentStatus = 'pending' | 'accepted' | 'rejected';

export interface StudyPlan {
  id: string;
  notebook_id: string;
  title: string;
  description?: string;
  deadline: string;
  available_hours_per_day: number;
  total_study_hours: number;
  status: PlanStatus;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface StudyPlanCreate {
  notebook_id: string;
  title: string;
  description?: string;
  deadline: string;
  available_hours_per_day?: number;
}

export interface StudyPlanUpdate {
  title?: string;
  description?: string;
  deadline?: string;
  available_hours_per_day?: number;
  status?: PlanStatus;
}

export interface StudyTopic {
  id: string;
  plan_id: string;
  name: string;
  description?: string;
  difficulty: TopicDifficulty;
  estimated_hours: number;
  priority: number;
  source_ids: string[];
  prerequisites: string[];
  status: TopicStatus;
  mastery_level: number;
  created_at: string;
}

export interface StudyTopicCreate {
  plan_id: string;
  name: string;
  description?: string;
  difficulty?: TopicDifficulty;
  estimated_hours: number;
  priority?: number;
  source_ids?: string[];
  prerequisites?: string[];
}

export interface StudyTopicUpdate {
  name?: string;
  description?: string;
  difficulty?: TopicDifficulty;
  estimated_hours?: number;
  priority?: number;
  status?: TopicStatus;
  mastery_level?: number;
}

export interface StudySession {
  id: string;
  plan_id: string;
  topic_id: string;
  scheduled_date: string;
  scheduled_duration_minutes: number;
  actual_start?: string;
  actual_end?: string;
  session_type: SessionType;
  status: SessionStatus;
  notes?: string;
  rating?: number;
  created_at: string;
  topic_name?: string;
}

export interface StudySessionCreate {
  plan_id: string;
  topic_id: string;
  scheduled_date: string;
  scheduled_duration_minutes: number;
  session_type?: SessionType;
}

export interface StudySessionUpdate {
  scheduled_date?: string;
  scheduled_duration_minutes?: number;
  session_type?: SessionType;
  actual_start?: string;
  actual_end?: string;
  status?: SessionStatus;
  notes?: string;
  rating?: number;
}

export interface PlanAdjustment {
  id: string;
  plan_id: string;
  adjustment_type: AdjustmentType;
  reason: string;
  original_value?: string;
  suggested_value?: string;
  status: AdjustmentStatus;
  created_at: string;
}

export interface StudyPlanFull extends StudyPlan {
  topics: StudyTopic[];
  sessions: StudySession[];
  adjustments: PlanAdjustment[];
  days_remaining: number;
  completed_hours: number;
  upcoming_sessions: StudySession[];
}

export interface DailySchedule {
  date: string;
  sessions: StudySession[];
  total_hours: number;
  is_today: boolean;
}

export interface WeeklySchedule {
  plan_id: string;
  week_start: string;
  week_end: string;
  days: DailySchedule[];
  total_planned_hours: number;
  total_completed_hours: number;
}

export interface StudyPlanStats {
  plan_id: string;
  total_topics: number;
  completed_topics: number;
  total_sessions: number;
  completed_sessions: number;
  total_planned_hours: number;
  total_completed_hours: number;
  average_rating?: number;
  on_track: boolean;
  days_remaining: number;
  hours_per_day_needed: number;
}

export interface PlanGenerationRequest {
  notebook_id: string;
  title: string;
  description?: string;
  deadline: string;
  available_hours_per_day?: number;
  include_reviews?: boolean;
  include_practice?: boolean;
  focus_areas?: string[];
}

export interface PlanGenerationResult {
  plan: StudyPlan;
  topics: StudyTopic[];
  sessions: StudySession[];
  total_hours: number;
  days_with_sessions: number;
  warnings: string[];
}
