'use client';

/**
 * Updates Page
 * 
 * Dashboard for source monitoring and update notifications.
 * Enhanced with activity feed, source picker, and better UX.
 */

import { useState } from 'react';
import { 
  Bell, RefreshCw, Settings, Play, Clock, Plus, Zap, 
  TrendingUp, Eye, Globe, FileText, Activity, Sparkles,
  ArrowRight, CheckCircle2, AlertCircle, Timer
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  useUnreadNotifications,
  useMonitors,
  useMonitoringStats,
  useJobHistory,
  useTriggerMonitoringJob,
  useMarkAllNotificationsRead,
  useNotifications,
} from '@/lib/hooks/use-monitoring';
import { NotificationList } from './components/NotificationList';
import { MonitorList } from './components/MonitorList';
import { JobHistory } from './components/JobHistory';
import { AddMonitorDialog } from './components/AddMonitorDialog';
import { ActivityFeed } from './components/ActivityFeed';

function LoadingBox({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded ${className}`} />;
}

export default function UpdatesPage() {
  const [activeTab, setActiveTab] = useState('activity');
  const [showAddMonitor, setShowAddMonitor] = useState(false);
  
  const { data: stats, isLoading: statsLoading } = useMonitoringStats();
  const { data: unreadNotifications, isLoading: notificationsLoading } = useUnreadNotifications();
  const { data: allNotifications } = useNotifications(true, 20);
  const { data: monitors, isLoading: monitorsLoading } = useMonitors();
  const { data: jobs, isLoading: jobsLoading } = useJobHistory(10);
  
  const triggerJob = useTriggerMonitoringJob();
  const markAllRead = useMarkAllNotificationsRead();

  const handleRunCheck = () => {
    triggerJob.mutate(undefined);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  const hasNoMonitors = !monitorsLoading && (!monitors || monitors.length === 0);
  const isRunning = triggerJob.isPending || jobs?.some(j => j.status === 'running');

  // Calculate health score
  const healthScore = stats ? Math.round(
    ((stats.enabled_monitors / Math.max(stats.total_monitors, 1)) * 50) +
    (stats.unread_notifications === 0 ? 50 : Math.max(0, 50 - stats.unread_notifications * 10))
  ) : 100;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Source Updates
          </h1>
          <p className="text-muted-foreground mt-1">
            Automatically track changes in your web sources and stay informed
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowAddMonitor(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Monitor
          </Button>
          <Button
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={markAllRead.isPending || !stats?.unread_notifications}
          >
            <Bell className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button onClick={handleRunCheck} disabled={isRunning}>
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 mr-2" />
            )}
            {isRunning ? 'Checking...' : 'Check Now'}
          </Button>
        </div>
      </div>

      {/* Quick Start Card - Show if no monitors */}
      {hasNoMonitors && (
        <Card className="border-dashed border-2 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="py-8">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Get Started with Source Monitoring</h3>
                <p className="text-muted-foreground mb-3">
                  Track changes in web pages, documentation, and research papers automatically. 
                  Get notified when your sources are updated!
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Auto-detect changes
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Smart notifications
                  </span>
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Change highlights
                  </span>
                </div>
              </div>
              <Button onClick={() => setShowAddMonitor(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Monitor
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Sources</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <LoadingBox className="h-8 w-16" />
            ) : (
              <>
                <div className="text-3xl font-bold">{stats?.enabled_monitors || 0}</div>
                <p className="text-xs text-muted-foreground">
                  of {stats?.total_monitors || 0} configured
                </p>
                {stats && stats.total_monitors > 0 && (
                  <Progress 
                    value={(stats.enabled_monitors / stats.total_monitors) * 100} 
                    className="h-1 mt-2" 
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 bg-orange-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Updates</CardTitle>
            <Bell className={`h-4 w-4 ${stats?.unread_notifications ? 'text-orange-500 animate-pulse' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <LoadingBox className="h-8 w-16" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${stats?.unread_notifications ? 'text-orange-500' : ''}`}>
                  {stats?.unread_notifications || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.unread_notifications ? 'pending review' : 'all caught up!'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Check</CardTitle>
            <Timer className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <LoadingBox className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.last_job_run
                    ? new Date(stats.last_job_run).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Never'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.last_job_run 
                    ? new Date(stats.last_job_run).toLocaleDateString()
                    : 'No jobs run yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 h-20 w-20 bg-green-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <TrendingUp className={`h-4 w-4 ${healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <LoadingBox className="h-8 w-20" />
            ) : (
              <>
                <div className={`text-3xl font-bold ${healthScore >= 80 ? 'text-green-500' : healthScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {healthScore}%
                </div>
                <Progress 
                  value={healthScore} 
                  className={`h-1 mt-2 ${healthScore >= 80 ? '[&>div]:bg-green-500' : healthScore >= 50 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'}`}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="activity" className="relative">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="notifications" className="relative">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {stats?.unread_notifications ? (
              <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] p-0 justify-center">
                {stats.unread_notifications}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="monitors">
            <Eye className="h-4 w-4 mr-2" />
            Monitors ({monitors?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Activity Feed Tab */}
        <TabsContent value="activity" className="mt-4">
          <ActivityFeed 
            notifications={allNotifications || []}
            jobs={jobs || []}
            monitors={monitors || []}
            isLoading={notificationsLoading || jobsLoading}
          />
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Update Notifications</CardTitle>
                <CardDescription>
                  Changes detected in your monitored sources
                </CardDescription>
              </div>
              {unreadNotifications && unreadNotifications.length > 0 && (
                <Badge variant="secondary" className="text-sm">
                  {unreadNotifications.length} unread
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {notificationsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <LoadingBox key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : unreadNotifications && unreadNotifications.length > 0 ? (
                <NotificationList notifications={unreadNotifications} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="font-medium">All caught up!</p>
                  <p className="text-sm mt-1">No pending notifications. Your sources are up to date.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitors" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Source Monitors</CardTitle>
                <CardDescription>
                  Configure which sources to monitor for updates
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddMonitor(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Monitor
              </Button>
            </CardHeader>
            <CardContent>
              {monitorsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <LoadingBox key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : monitors && monitors.length > 0 ? (
                <MonitorList monitors={monitors} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <p className="font-medium">No monitors configured</p>
                  <p className="text-sm mt-1 mb-4">Start tracking changes in your sources</p>
                  <Button onClick={() => setShowAddMonitor(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Monitor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Job History</CardTitle>
                <CardDescription>
                  Recent monitoring job executions
                </CardDescription>
              </div>
              {isRunning && (
                <Badge variant="secondary" className="animate-pulse">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Running
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {jobsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <LoadingBox key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : jobs && jobs.length > 0 ? (
                <JobHistory jobs={jobs} />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Clock className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No job history yet</p>
                  <p className="text-sm mt-1 mb-4">Run a check to start tracking</p>
                  <Button variant="outline" onClick={handleRunCheck} disabled={isRunning}>
                    <Zap className="h-4 w-4 mr-2" />
                    Run First Check
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Monitor Dialog */}
      <AddMonitorDialog 
        open={showAddMonitor} 
        onOpenChange={setShowAddMonitor} 
      />
    </div>
  );
}
