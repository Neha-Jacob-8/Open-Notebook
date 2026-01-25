'use client';

/**
 * Job History Component
 * 
 * Displays monitoring job execution history.
 */

import { CheckCircle, XCircle, Loader2, Clock, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { MonitorJobRun } from '@/lib/types/monitoring';

interface JobHistoryProps {
  jobs: MonitorJobRun[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'running':
      return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
    completed: 'default',
    failed: 'destructive',
    running: 'secondary',
  };
  
  return (
    <Badge variant={variants[status] || 'outline'}>
      {status}
    </Badge>
  );
}

function formatDuration(start: string, end: string | null) {
  if (!end) return 'In progress...';
  
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  const durationMs = endTime - startTime;
  
  if (durationMs < 1000) return `${durationMs}ms`;
  if (durationMs < 60000) return `${Math.round(durationMs / 1000)}s`;
  return `${Math.round(durationMs / 60000)}m`;
}

export function JobHistory({ jobs }: JobHistoryProps) {
  return (
    <div className="space-y-3">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {getStatusIcon(job.status)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {new Date(job.started_at).toLocaleString()}
                  </span>
                  {getStatusBadge(job.status)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {job.sources_checked} sources checked
                  </span>
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {job.updates_found} updates found
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(job.started_at, job.completed_at || null)}
                  </span>
                </div>
              </div>

              {/* Errors */}
              {job.errors.length > 0 && (
                <div className="flex-shrink-0">
                  <Badge variant="destructive">
                    {job.errors.length} error{job.errors.length > 1 ? 's' : ''}
                  </Badge>
                </div>
              )}
            </div>

            {/* Error Details */}
            {job.errors.length > 0 && (
              <div className="mt-3 p-2 bg-destructive/10 rounded-md">
                <p className="text-xs font-medium text-destructive mb-1">Errors:</p>
                <ul className="text-xs text-destructive/80 space-y-1">
                  {job.errors.slice(0, 3).map((error, i) => (
                    <li key={i} className="truncate">{error}</li>
                  ))}
                  {job.errors.length > 3 && (
                    <li className="text-destructive/60">
                      +{job.errors.length - 3} more errors
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
