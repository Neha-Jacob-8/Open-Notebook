/**
 * Auto-Update Agent API Client
 * 
 * Functions for managing source monitoring and update notifications.
 */

import { apiClient } from './client';
import type {
  SourceMonitor,
  SourceMonitorCreate,
  SourceMonitorUpdate,
  UpdateNotification,
  MonitorJobRun,
  MonitoringStats,
  NotificationCountResponse,
  JobTriggerResponse,
} from '../types/monitoring';

// ============================================================================
// Monitor API
// ============================================================================

/**
 * Create or update a source monitor
 */
export async function createMonitor(data: SourceMonitorCreate): Promise<SourceMonitor> {
  const response = await apiClient.post('/monitoring/monitors', data);
  return response.data;
}

/**
 * List all monitors
 */
export async function listMonitors(): Promise<SourceMonitor[]> {
  const response = await apiClient.get('/monitoring/monitors');
  return response.data;
}

/**
 * Get monitor for a specific source
 */
export async function getMonitor(sourceId: string): Promise<SourceMonitor> {
  const response = await apiClient.get(`/monitoring/monitors/${sourceId}`);
  return response.data;
}

/**
 * Update a source monitor
 */
export async function updateMonitor(
  sourceId: string,
  data: SourceMonitorUpdate
): Promise<SourceMonitor> {
  const response = await apiClient.patch(`/monitoring/monitors/${sourceId}`, data);
  return response.data;
}

/**
 * Delete a source monitor
 */
export async function deleteMonitor(sourceId: string): Promise<void> {
  await apiClient.delete(`/monitoring/monitors/${sourceId}`);
}

// ============================================================================
// Notification API
// ============================================================================

/**
 * List notifications
 */
export async function listNotifications(
  includeDismissed = false,
  limit = 100
): Promise<UpdateNotification[]> {
  const response = await apiClient.get('/monitoring/notifications', {
    params: { include_dismissed: includeDismissed, limit },
  });
  return response.data;
}

/**
 * Get unread notifications
 */
export async function getUnreadNotifications(limit = 50): Promise<UpdateNotification[]> {
  const response = await apiClient.get('/monitoring/notifications/unread', {
    params: { limit },
  });
  return response.data;
}

/**
 * Get notification count
 */
export async function getNotificationCount(): Promise<NotificationCountResponse> {
  const response = await apiClient.get('/monitoring/notifications/count');
  return response.data;
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  await apiClient.post(`/monitoring/notifications/${notificationId}/read`);
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(notificationId: string): Promise<void> {
  await apiClient.post(`/monitoring/notifications/${notificationId}/dismiss`);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<{ status: string; count: number }> {
  const response = await apiClient.post('/monitoring/notifications/mark-all-read');
  return response.data;
}

// ============================================================================
// Job API
// ============================================================================

/**
 * Trigger a monitoring job
 */
export async function triggerMonitoringJob(
  frequency?: string
): Promise<JobTriggerResponse> {
  const response = await apiClient.post('/monitoring/jobs/run', null, {
    params: frequency ? { frequency } : undefined,
  });
  return response.data;
}

/**
 * Get job history
 */
export async function getJobHistory(limit = 10): Promise<MonitorJobRun[]> {
  const response = await apiClient.get('/monitoring/jobs/history', {
    params: { limit },
  });
  return response.data;
}

/**
 * Get current running job
 */
export async function getCurrentJob(): Promise<MonitorJobRun | { status: string }> {
  const response = await apiClient.get('/monitoring/jobs/current');
  return response.data;
}

// ============================================================================
// Stats API
// ============================================================================

/**
 * Get monitoring statistics
 */
export async function getMonitoringStats(): Promise<MonitoringStats> {
  const response = await apiClient.get('/monitoring/stats');
  return response.data;
}
