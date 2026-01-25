'use client';

/**
 * Monitor List Component
 * 
 * Displays and manages source monitors.
 */

import { useState } from 'react';
import { Trash2, Clock, AlertTriangle, Settings, Pause, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useUpdateMonitor,
  useDeleteMonitor,
} from '@/lib/hooks/use-monitoring';
import type { SourceMonitor } from '@/lib/types/monitoring';

interface MonitorListProps {
  monitors: SourceMonitor[];
}

const frequencyLabels: Record<string, string> = {
  hourly: 'Every hour',
  daily: 'Daily',
  weekly: 'Weekly',
};

export function MonitorList({ monitors }: MonitorListProps) {
  const updateMonitor = useUpdateMonitor();
  const deleteMonitor = useDeleteMonitor();

  const handleToggleEnabled = (sourceId: string, currentEnabled: boolean) => {
    updateMonitor.mutate({
      sourceId,
      data: { enabled: !currentEnabled },
    });
  };

  const handleChangeFrequency = (sourceId: string, frequency: 'hourly' | 'daily' | 'weekly') => {
    updateMonitor.mutate({
      sourceId,
      data: { check_frequency: frequency },
    });
  };

  const handleDelete = (sourceId: string) => {
    if (confirm('Are you sure you want to stop monitoring this source?')) {
      deleteMonitor.mutate(sourceId);
    }
  };

  return (
    <div className="space-y-3">
      {monitors.map((monitor) => (
        <Card key={monitor.id} className={monitor.enabled ? '' : 'opacity-60'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className="flex-shrink-0">
                {monitor.consecutive_failures > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                ) : monitor.enabled ? (
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-muted" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    Source: {monitor.source_id.split(':')[1] || monitor.source_id}
                  </span>
                  <Badge variant={monitor.enabled ? 'default' : 'secondary'}>
                    {monitor.enabled ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {frequencyLabels[monitor.check_frequency]}
                  </span>
                  {monitor.last_checked_at && (
                    <span>
                      Last check: {new Date(monitor.last_checked_at).toLocaleString()}
                    </span>
                  )}
                  {monitor.consecutive_failures > 0 && (
                    <span className="text-yellow-500">
                      {monitor.consecutive_failures} failed attempts
                    </span>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <Select
                  value={monitor.check_frequency}
                  onValueChange={(value: 'hourly' | 'daily' | 'weekly') =>
                    handleChangeFrequency(monitor.source_id, value)
                  }
                >
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleEnabled(monitor.source_id, monitor.enabled)}
                  disabled={updateMonitor.isPending}
                  title={monitor.enabled ? 'Pause monitoring' : 'Resume monitoring'}
                >
                  {monitor.enabled ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(monitor.source_id)}
                  disabled={deleteMonitor.isPending}
                  title="Remove monitor"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
