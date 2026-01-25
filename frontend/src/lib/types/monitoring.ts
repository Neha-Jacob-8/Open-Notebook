/**
 * Auto-Update Agent Types
 * 
 * Types for source monitoring and update notifications.
 */

// Source Monitor
export interface SourceMonitor {
  id?: string;
  source_id: string;
  enabled: boolean;
  check_frequency: 'hourly' | 'daily' | 'weekly';
  last_checked_at?: string;
  last_content_hash?: string;
  consecutive_failures: number;
}

export interface SourceMonitorCreate {
  source_id: string;
  check_frequency?: 'hourly' | 'daily' | 'weekly';
  enabled?: boolean;
}

export interface SourceMonitorUpdate {
  check_frequency?: 'hourly' | 'daily' | 'weekly';
  enabled?: boolean;
}

// Update Notification
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface UpdateNotification {
  id?: string;
  source_id: string;
  source_title: string;
  change_summary: string;
  diff_highlights: string[];
  old_content_preview?: string;
  new_content_preview?: string;
  severity: NotificationSeverity;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

// Monitor Job
export type JobStatus = 'running' | 'completed' | 'failed';

export interface MonitorJobRun {
  id?: string;
  started_at: string;
  completed_at?: string;
  status: JobStatus;
  sources_checked: number;
  updates_found: number;
  errors: string[];
}

// Stats
export interface MonitoringStats {
  total_monitors: number;
  enabled_monitors: number;
  unread_notifications: number;
  last_job_run?: string;
  last_job_status?: string;
}

// API Responses
export interface NotificationCountResponse {
  unread_count: number;
}

export interface JobTriggerResponse {
  status: 'started' | 'already_running';
  message?: string;
  job_id?: string;
  started_at?: string;
}
