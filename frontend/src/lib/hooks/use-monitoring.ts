/**
 * Auto-Update Agent Hooks
 * 
 * React Query hooks for source monitoring and notifications.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createMonitor,
  listMonitors,
  getMonitor,
  updateMonitor,
  deleteMonitor,
  listNotifications,
  getUnreadNotifications,
  getNotificationCount,
  markNotificationRead,
  dismissNotification,
  markAllNotificationsRead,
  triggerMonitoringJob,
  getJobHistory,
  getCurrentJob,
  getMonitoringStats,
} from '../api/monitoring';
import type {
  SourceMonitorCreate,
  SourceMonitorUpdate,
} from '../types/monitoring';

// Query keys
export const monitoringKeys = {
  all: ['monitoring'] as const,
  monitors: () => [...monitoringKeys.all, 'monitors'] as const,
  monitor: (sourceId: string) => [...monitoringKeys.monitors(), sourceId] as const,
  notifications: () => [...monitoringKeys.all, 'notifications'] as const,
  notificationsUnread: () => [...monitoringKeys.notifications(), 'unread'] as const,
  notificationCount: () => [...monitoringKeys.notifications(), 'count'] as const,
  jobs: () => [...monitoringKeys.all, 'jobs'] as const,
  jobHistory: () => [...monitoringKeys.jobs(), 'history'] as const,
  currentJob: () => [...monitoringKeys.jobs(), 'current'] as const,
  stats: () => [...monitoringKeys.all, 'stats'] as const,
};

// ============================================================================
// Monitor Hooks
// ============================================================================

/**
 * Hook to list all monitors
 */
export function useMonitors() {
  return useQuery({
    queryKey: monitoringKeys.monitors(),
    queryFn: listMonitors,
    staleTime: 30000, // 30 seconds
  });
}

/**
 * Hook to get a specific monitor
 */
export function useMonitor(sourceId: string, enabled = true) {
  return useQuery({
    queryKey: monitoringKeys.monitor(sourceId),
    queryFn: () => getMonitor(sourceId),
    enabled: enabled && !!sourceId,
  });
}

/**
 * Hook to create a monitor
 */
export function useCreateMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SourceMonitorCreate) => createMonitor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.monitors() });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.stats() });
      toast.success('Source monitoring enabled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to enable monitoring: ${error.message}`);
    },
  });
}

/**
 * Hook to update a monitor
 */
export function useUpdateMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sourceId, data }: { sourceId: string; data: SourceMonitorUpdate }) =>
      updateMonitor(sourceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.monitors() });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.monitor(variables.sourceId) });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.stats() });
      toast.success('Monitor settings updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update monitor: ${error.message}`);
    },
  });
}

/**
 * Hook to delete a monitor
 */
export function useDeleteMonitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) => deleteMonitor(sourceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.monitors() });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.stats() });
      toast.success('Source monitoring disabled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disable monitoring: ${error.message}`);
    },
  });
}

// ============================================================================
// Notification Hooks
// ============================================================================

/**
 * Hook to list notifications
 */
export function useNotifications(includeDismissed = false, limit = 100) {
  return useQuery({
    queryKey: [...monitoringKeys.notifications(), { includeDismissed, limit }],
    queryFn: () => listNotifications(includeDismissed, limit),
    staleTime: 30000,
  });
}

/**
 * Hook to get unread notifications
 */
export function useUnreadNotifications(limit = 50) {
  return useQuery({
    queryKey: monitoringKeys.notificationsUnread(),
    queryFn: () => getUnreadNotifications(limit),
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to get notification count
 */
export function useNotificationCount() {
  return useQuery({
    queryKey: monitoringKeys.notificationCount(),
    queryFn: getNotificationCount,
    staleTime: 30000,
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Hook to mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.notificationCount() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark as read: ${error.message}`);
    },
  });
}

/**
 * Hook to dismiss notification
 */
export function useDismissNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => dismissNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.notificationCount() });
      toast.success('Notification dismissed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to dismiss: ${error.message}`);
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: monitoringKeys.notifications() });
      queryClient.invalidateQueries({ queryKey: monitoringKeys.notificationCount() });
      toast.success(`Marked ${data.count} notifications as read`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to mark all as read: ${error.message}`);
    },
  });
}

// ============================================================================
// Job Hooks
// ============================================================================

/**
 * Hook to get job history
 */
export function useJobHistory(limit = 10) {
  return useQuery({
    queryKey: [...monitoringKeys.jobHistory(), limit],
    queryFn: () => getJobHistory(limit),
    staleTime: 30000,
  });
}

/**
 * Hook to get current running job
 */
export function useCurrentJob() {
  return useQuery({
    queryKey: monitoringKeys.currentJob(),
    queryFn: getCurrentJob,
    staleTime: 5000, // Check frequently
    refetchInterval: 5000, // Poll while job is running
  });
}

/**
 * Hook to trigger a monitoring job
 */
export function useTriggerMonitoringJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (frequency?: string) => triggerMonitoringJob(frequency),
    onSuccess: (data) => {
      if (data.status === 'already_running') {
        toast.info('A monitoring job is already running');
      } else {
        toast.success('Monitoring job started');
      }
      queryClient.invalidateQueries({ queryKey: monitoringKeys.jobs() });
    },
    onError: (error: Error) => {
      toast.error(`Failed to start job: ${error.message}`);
    },
  });
}

// ============================================================================
// Stats Hook
// ============================================================================

/**
 * Hook to get monitoring stats
 */
export function useMonitoringStats() {
  return useQuery({
    queryKey: monitoringKeys.stats(),
    queryFn: getMonitoringStats,
    staleTime: 30000,
  });
}
