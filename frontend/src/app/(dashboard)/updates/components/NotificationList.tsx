'use client';

/**
 * Notification List Component
 * 
 * Displays update notifications with severity badges and actions.
 */

import { AlertTriangle, Info, AlertCircle, X, Check, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useMarkNotificationRead,
  useDismissNotification,
} from '@/lib/hooks/use-monitoring';
import type { UpdateNotification, NotificationSeverity } from '@/lib/types/monitoring';

interface NotificationListProps {
  notifications: UpdateNotification[];
}

function getSeverityIcon(severity: NotificationSeverity) {
  switch (severity) {
    case 'critical':
      return <AlertCircle className="h-5 w-5 text-destructive" />;
    case 'warning':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

function getSeverityBadge(severity: NotificationSeverity) {
  const variants: Record<NotificationSeverity, 'destructive' | 'secondary' | 'outline'> = {
    critical: 'destructive',
    warning: 'secondary',
    info: 'outline',
  };
  
  return (
    <Badge variant={variants[severity]}>
      {severity}
    </Badge>
  );
}

export function NotificationList({ notifications }: NotificationListProps) {
  const markRead = useMarkNotificationRead();
  const dismiss = useDismissNotification();

  const handleMarkRead = (id: string) => {
    if (id) {
      markRead.mutate(id);
    }
  };

  const handleDismiss = (id: string) => {
    if (id) {
      dismiss.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`transition-all ${
            notification.is_read ? 'opacity-60' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Severity Icon */}
              <div className="flex-shrink-0 mt-1">
                {getSeverityIcon(notification.severity)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium truncate">{notification.source_title}</h4>
                  {getSeverityBadge(notification.severity)}
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {notification.change_summary}
                </p>

                {/* Diff Highlights */}
                {notification.diff_highlights.length > 0 && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <p className="text-xs font-medium mb-1">Changes:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {notification.diff_highlights.slice(0, 3).map((highlight, i) => (
                        <li key={i} className="truncate">
                          {highlight}
                        </li>
                      ))}
                      {notification.diff_highlights.length > 3 && (
                        <li className="text-muted-foreground/70">
                          +{notification.diff_highlights.length - 3} more changes
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {!notification.is_read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMarkRead(notification.id || '')}
                    disabled={markRead.isPending}
                    title="Mark as read"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(notification.id || '')}
                  disabled={dismiss.isPending}
                  title="Dismiss"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  title="View source"
                >
                  <a href={`/sources?id=${notification.source_id}`}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
