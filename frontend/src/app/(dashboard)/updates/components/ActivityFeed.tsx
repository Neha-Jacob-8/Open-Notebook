'use client';

/**
 * Activity Feed Component
 * 
 * Shows a unified timeline of all monitoring activity including
 * notifications, job runs, and monitor status changes.
 */

import { useMemo } from 'react';
import { 
  Bell, CheckCircle, XCircle, RefreshCw, Clock, 
  AlertTriangle, Info, AlertCircle, Eye, Zap, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTriggerMonitoringJob } from '@/lib/hooks/use-monitoring';
import type { UpdateNotification, MonitorJobRun, SourceMonitor } from '@/lib/types/monitoring';

interface ActivityFeedProps {
  notifications: UpdateNotification[];
  jobs: MonitorJobRun[];
  monitors: SourceMonitor[];
  isLoading?: boolean;
}

interface ActivityItem {
  id: string;
  type: 'notification' | 'job' | 'monitor';
  timestamp: Date;
  title: string;
  description: string;
  icon: React.ReactNode;
  severity?: 'info' | 'warning' | 'critical' | 'success' | 'error';
  metadata?: Record<string, any>;
}

function getSeverityColor(severity?: string) {
  switch (severity) {
    case 'critical':
    case 'error':
      return 'text-destructive bg-destructive/10';
    case 'warning':
      return 'text-yellow-500 bg-yellow-500/10';
    case 'success':
      return 'text-green-500 bg-green-500/10';
    case 'info':
    default:
      return 'text-blue-500 bg-blue-500/10';
  }
}

function getNotificationIcon(severity: string) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ notifications, jobs, monitors, isLoading }: ActivityFeedProps) {
  const triggerJob = useTriggerMonitoringJob();

  // Combine all activities into a unified timeline
  const activities = useMemo(() => {
    const items: ActivityItem[] = [];

    // Add notifications
    notifications.forEach(n => {
      items.push({
        id: `notification-${n.id}`,
        type: 'notification',
        timestamp: new Date(n.created_at),
        title: n.source_title,
        description: n.change_summary,
        icon: getNotificationIcon(n.severity),
        severity: n.severity,
        metadata: {
          isRead: n.is_read,
          diffHighlights: n.diff_highlights,
        },
      });
    });

    // Add job runs
    jobs.forEach(j => {
      const status = j.status;
      items.push({
        id: `job-${j.id}`,
        type: 'job',
        timestamp: new Date(j.started_at),
        title: `Monitoring check ${status}`,
        description: `Checked ${j.sources_checked} sources, found ${j.updates_found} updates`,
        icon: status === 'completed' 
          ? <CheckCircle className="h-4 w-4" />
          : status === 'failed'
          ? <XCircle className="h-4 w-4" />
          : <RefreshCw className="h-4 w-4 animate-spin" />,
        severity: status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info',
        metadata: {
          duration: j.completed_at 
            ? `${Math.round((new Date(j.completed_at).getTime() - new Date(j.started_at).getTime()) / 1000)}s`
            : 'In progress',
          errors: j.errors,
        },
      });
    });

    // Sort by timestamp, newest first
    return items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notifications, jobs]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <CardDescription>
            Real-time updates from your source monitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <p className="font-medium mb-1">No activity yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              {monitors.length === 0 
                ? 'Add some monitors to start tracking source changes'
                : 'Run a check to see activity here'}
            </p>
            {monitors.length > 0 && (
              <Button onClick={() => triggerJob.mutate(undefined)} disabled={triggerJob.isPending}>
                {triggerJob.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Run First Check
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Activity Feed
            </CardTitle>
            <CardDescription>
              Real-time updates from your source monitors
            </CardDescription>
          </div>
          <Badge variant="secondary">
            {activities.length} events
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          {/* Activity items */}
          <div className="space-y-6">
            {activities.map((activity, index) => (
              <div key={activity.id} className="relative flex gap-4 pl-10">
                {/* Timeline dot */}
                <div 
                  className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${getSeverityColor(activity.severity)}`}
                >
                  {activity.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium truncate">{activity.title}</span>
                    <Badge 
                      variant={
                        activity.type === 'notification' 
                          ? activity.severity === 'critical' ? 'destructive' : 'secondary'
                          : activity.severity === 'success' ? 'default' 
                          : activity.severity === 'error' ? 'destructive' 
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {activity.type === 'notification' ? activity.severity : activity.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  
                  {/* Additional metadata */}
                  {activity.type === 'notification' && activity.metadata && activity.metadata.diffHighlights && activity.metadata.diffHighlights.length > 0 && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <ul className="space-y-1">
                        {(activity.metadata.diffHighlights as string[]).slice(0, 2).map((highlight: string, i: number) => (
                          <li key={i} className="truncate">{highlight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {activity.type === 'job' && activity.metadata && activity.metadata.errors && activity.metadata.errors.length > 0 && (
                    <div className="mt-2 p-2 bg-destructive/10 rounded text-xs text-destructive">
                      {(activity.metadata.errors as string[]).length} error(s) occurred
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
