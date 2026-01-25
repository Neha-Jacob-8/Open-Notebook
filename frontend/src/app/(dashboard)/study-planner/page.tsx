'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, addDays, startOfWeek, isSameDay } from 'date-fns';
import {
  Calendar,
  Clock,
  Target,
  BookOpen,
  Play,
  Check,
  Pause,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  TrendingUp,
  Loader2,
  Sparkles,
} from 'lucide-react';

import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

import {
  useActivePlans,
  useStudyPlan,
  useStudyPlanStats,
  useWeeklySchedule,
  useTodaySessions,
  useGenerateStudyPlan,
  useUpdateStudyPlan,
  useDeleteStudyPlan,
  useStartSession,
  useCompleteSession,
  useSkipSession,
  useUpdateTopic,
} from '@/lib/hooks/use-study-plans';
import { useNotebooks } from '@/lib/hooks/use-notebooks';
import type {
  StudyPlan,
  StudyTopic,
  StudySession,
  PlanStatus,
  TopicStatus,
  SessionStatus,
  SessionType,
  DailySchedule,
} from '@/lib/types/study-plan';
import { SessionCard } from './components/SessionCard';

// Helper functions
const getStatusColor = (status: PlanStatus | TopicStatus | SessionStatus): string => {
  const colors: Record<string, string> = {
    active: 'bg-blue-500',
    completed: 'bg-green-500',
    paused: 'bg-yellow-500',
    cancelled: 'bg-red-500',
    not_started: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    skipped: 'bg-orange-500',
    scheduled: 'bg-purple-500',
    rescheduled: 'bg-indigo-500',
  };
  return colors[status] || 'bg-gray-500';
};

const getSessionTypeIcon = (type: SessionType) => {
  switch (type) {
    case 'learn':
      return <BookOpen className="h-4 w-4" />;
    case 'review':
      return <Target className="h-4 w-4" />;
    case 'practice':
      return <Play className="h-4 w-4" />;
    case 'quiz':
      return <Check className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

export default function StudyPlanPage() {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: activePlans, isLoading: plansLoading } = useActivePlans();
  const { data: todaySessions } = useTodaySessions();

  // Auto-select first plan
  useEffect(() => {
    if (!selectedPlanId && activePlans && activePlans.length > 0) {
      setSelectedPlanId(activePlans[0].id);
    }
  }, [activePlans, selectedPlanId]);

  const currentWeekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset * 7);

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Study Planner</h1>
              <p className="text-muted-foreground">AI-powered study schedules</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </DialogTrigger>
              <CreatePlanDialog 
                onClose={() => setCreateDialogOpen(false)} 
                onPlanCreated={(planId) => {
                  setSelectedPlanId(planId);
                  setCreateDialogOpen(false);
                }}
              />
            </Dialog>
          </div>

          {/* Today's Sessions Summary */}
          {todaySessions && todaySessions.length > 0 && (
            <TodaySessionsCard sessions={todaySessions} />
          )}

          {/* Plan Selector and Content */}
          {plansLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : activePlans && activePlans.length > 0 ? (
            <>
              {/* Plan Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {activePlans.map((plan) => (
                  <Button
                    key={plan.id}
                    variant={selectedPlanId === plan.id ? 'default' : 'outline'}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className="whitespace-nowrap"
                  >
                    {plan.title}
                    <Badge variant="secondary" className="ml-2">
                      {Math.round(plan.progress_percentage)}%
                    </Badge>
                  </Button>
                ))}
              </div>

              {/* Plan Details */}
              {selectedPlanId && (
                <PlanDetails
                  planId={selectedPlanId}
                  weekStart={currentWeekStart}
                  weekOffset={weekOffset}
                  setWeekOffset={setWeekOffset}
                />
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Active Study Plans</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Create a study plan to get AI-generated study schedules based on your notebooks.
                </p>
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Study Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}

// Create Plan Dialog
function CreatePlanDialog({ onClose, onPlanCreated }: { onClose: () => void; onPlanCreated: (planId: string) => void }) {
  const [notebookId, setNotebookId] = useState('');
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [includeReviews, setIncludeReviews] = useState(true);
  const [includePractice, setIncludePractice] = useState(true);

  const { data: notebooks } = useNotebooks();
  const generatePlan = useGenerateStudyPlan();

  const handleSubmit = async () => {
    if (!notebookId || !title || !deadline) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const result = await generatePlan.mutateAsync({
        notebook_id: notebookId,
        title,
        deadline: new Date(deadline).toISOString(),
        available_hours_per_day: hoursPerDay,
        include_reviews: includeReviews,
        include_practice: includePractice,
      });
      toast.success('Study plan generated successfully!');
      // Select the newly created plan
      if (result?.plan?.id) {
        onPlanCreated(result.plan.id);
      } else {
        onClose();
      }
    } catch (error) {
      toast.error('Failed to generate study plan');
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Generate Study Plan</DialogTitle>
        <DialogDescription>
          Create an AI-powered study schedule based on your notebook content.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Notebook *</Label>
          <Select value={notebookId} onValueChange={setNotebookId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a notebook" />
            </SelectTrigger>
            <SelectContent>
              {notebooks?.map((nb) => (
                <SelectItem key={nb.id} value={nb.id}>
                  {nb.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Plan Title *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Final Exam Preparation"
          />
        </div>

        <div className="space-y-2">
          <Label>Deadline *</Label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
          />
        </div>

        <div className="space-y-2">
          <Label>Hours per Day: {hoursPerDay}</Label>
          <Input
            type="number"
            value={hoursPerDay}
            onChange={(e) => setHoursPerDay(parseFloat(e.target.value) || 2)}
            min={0.5}
            max={8}
            step={0.5}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="include-reviews"
            checked={includeReviews}
            onCheckedChange={(checked) => setIncludeReviews(!!checked)}
          />
          <Label htmlFor="include-reviews">Include Review Sessions</Label>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="include-practice"
            checked={includePractice}
            onCheckedChange={(checked) => setIncludePractice(!!checked)}
          />
          <Label htmlFor="include-practice">Include Practice Sessions</Label>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={generatePlan.isPending}>
          {generatePlan.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Generate Plan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// Today's Sessions Card
function TodaySessionsCard({ sessions }: { sessions: StudySession[] }) {
  const startSession = useStartSession();
  const completeSession = useCompleteSession();
  const skipSession = useSkipSession();

  const completedCount = sessions.filter((s) => s.status === 'completed').length;
  const inProgressCount = sessions.filter((s) => s.status === 'in_progress').length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.scheduled_duration_minutes, 0);
  const completedMinutes = sessions
    .filter((s) => s.status === 'completed')
    .reduce((sum, s) => sum + s.scheduled_duration_minutes, 0);

  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today's Study Sessions
          {inProgressCount > 0 && (
            <Badge variant="default" className="bg-blue-500 animate-pulse">
              {inProgressCount} in progress
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="flex items-center gap-4">
          <span>{completedCount}/{sessions.length} completed</span>
          <span>•</span>
          <span>{formatDuration(completedMinutes)} / {formatDuration(totalMinutes)} studied</span>
          <Progress
            value={(completedCount / sessions.length) * 100}
            className="w-24 h-2"
          />
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.slice(0, 5).map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              topicName={session.topic_name}
              onStart={() => {
                console.log('Starting session:', session.id, 'planId:', session.plan_id);
                startSession.mutate(
                  { sessionId: session.id, planId: session.plan_id },
                  { onSuccess: () => toast.success('Session started! Good luck! 📚') }
                );
              }}
              onComplete={(rating, notes) => {
                console.log('Completing session:', session.id, 'planId:', session.plan_id, 'rating:', rating, 'notes:', notes);
                completeSession.mutate(
                  { sessionId: session.id, planId: session.plan_id, rating, notes },
                  { 
                    onSuccess: (data) => {
                      console.log('Session completed successfully:', data);
                      toast.success('Great work! Session completed! 🎉');
                    },
                    onError: (error) => {
                      console.error('Error completing session:', error);
                      toast.error('Failed to complete session');
                    }
                  }
                );
              }}
              onSkip={(reason) => {
                skipSession.mutate(
                  { sessionId: session.id, planId: session.plan_id, reason },
                  { onSuccess: () => toast.info('Session skipped') }
                );
              }}
              isStarting={startSession.isPending}
              isCompleting={completeSession.isPending}
              isSkipping={skipSession.isPending}
            />
          ))}
          {sessions.length > 5 && (
            <p className="text-sm text-center text-muted-foreground">
              +{sessions.length - 5} more sessions today
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Plan Details Component
function PlanDetails({
  planId,
  weekStart,
  weekOffset,
  setWeekOffset,
}: {
  planId: string;
  weekStart: Date;
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
}) {
  const { data: plan, isLoading } = useStudyPlan(planId);
  const { data: stats } = useStudyPlanStats(planId);
  const { data: schedule } = useWeeklySchedule(planId, weekStart.toISOString());
  const deletePlan = useDeleteStudyPlan();

  if (isLoading || !plan) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Progress</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{Math.round(plan.progress_percentage)}%</div>
              <Progress value={plan.progress_percentage} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Study Time</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {stats ? `${stats.total_completed_hours.toFixed(1)}h` : '0h'}
              </div>
              <p className="text-sm text-muted-foreground">
                of {plan.total_study_hours.toFixed(1)}h total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Deadline</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {stats?.days_remaining ?? 0} days
              </div>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(plan.deadline), 'MMM d, yyyy')}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              {stats?.on_track ? (
                <TrendingUp className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className="text-sm text-muted-foreground">Status</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold capitalize">
                {stats?.on_track ? 'On Track' : 'Behind'}
              </div>
              <p className="text-sm text-muted-foreground">
                {stats ? `${stats.hours_per_day_needed.toFixed(1)}h/day needed` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="topics">Topics ({plan.topics.length})</TabsTrigger>
          <TabsTrigger value="sessions">All Sessions ({plan.sessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-4">
          <WeeklyScheduleView
            schedule={schedule}
            weekOffset={weekOffset}
            setWeekOffset={setWeekOffset}
            planId={planId}
          />
        </TabsContent>

        <TabsContent value="topics" className="mt-4">
          {plan.topics.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Topics Generated</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  This study plan has no topics. This usually means:
                </p>
                <ul className="text-sm text-muted-foreground mt-4 space-y-1 list-disc list-inside">
                  <li>The notebook had no sources when the plan was created</li>
                  <li>The AI couldn't extract topics from the content</li>
                  <li>There was an error during plan generation</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  <strong>Solution:</strong> Delete this plan, add PDFs or documents to your notebook, then create a new study plan.
                </p>
              </CardContent>
            </Card>
          ) : (
            <TopicsList topics={plan.topics} planId={planId} />
          )}
        </TabsContent>

        <TabsContent value="sessions" className="mt-4">
          {plan.sessions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No Study Sessions</h3>
                <p className="text-muted-foreground text-center max-w-md mt-2">
                  No study sessions have been scheduled yet. Sessions are created automatically when topics are generated.
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Delete this plan and create a new one with content-rich notebooks to generate a proper schedule.
                </p>
              </CardContent>
            </Card>
          ) : (
            <SessionsList sessions={plan.sessions} planId={planId} />
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Plan */}
      <div className="flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if (confirm('Are you sure you want to delete this plan?')) {
              deletePlan.mutate(planId);
            }
          }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Plan
        </Button>
      </div>
    </div>
  );
}

// Weekly Schedule View
function WeeklyScheduleView({
  schedule,
  weekOffset,
  setWeekOffset,
  planId,
}: {
  schedule: any;
  weekOffset: number;
  setWeekOffset: (offset: number) => void;
  planId: string;
}) {
  const startSession = useStartSession();
  const completeSession = useCompleteSession();

  if (!schedule) {
    return <div className="text-center p-8 text-muted-foreground">Loading schedule...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <div className="text-center">
          <p className="font-semibold">
            {format(parseISO(schedule.week_start), 'MMM d')} -{' '}
            {format(parseISO(schedule.week_end), 'MMM d, yyyy')}
          </p>
          <p className="text-sm text-muted-foreground">
            {schedule.total_completed_hours.toFixed(1)}h /{' '}
            {schedule.total_planned_hours.toFixed(1)}h completed
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset + 1)}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Daily Cards */}
      <div className="grid grid-cols-7 gap-2">
        {schedule.days.map((day: DailySchedule) => (
          <Card
            key={day.date}
            className={day.is_today ? 'border-blue-500 border-2' : ''}
          >
            <CardHeader className="p-3 pb-1">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  {format(parseISO(day.date), 'EEE')}
                </p>
                <p className={`font-bold ${day.is_today ? 'text-blue-500' : ''}`}>
                  {format(parseISO(day.date), 'd')}
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {day.sessions.length === 0 ? (
                <p className="text-xs text-center text-muted-foreground py-2">No sessions</p>
              ) : (
                day.sessions.slice(0, 3).map((session: StudySession) => (
                  <div
                    key={session.id}
                    className="p-1.5 rounded bg-muted text-xs cursor-pointer hover:bg-muted/80"
                    onClick={() => {
                      if (session.status === 'scheduled') {
                        startSession.mutate({ sessionId: session.id, planId });
                      } else if (session.status === 'in_progress') {
                        completeSession.mutate({ sessionId: session.id, planId });
                      }
                    }}
                  >
                    <div className="flex items-center gap-1">
                      {getSessionTypeIcon(session.session_type)}
                      <span className="capitalize truncate">{session.session_type}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] mt-1">
                      {formatDuration(session.scheduled_duration_minutes)}
                    </Badge>
                  </div>
                ))
              )}
              {day.sessions.length > 3 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{day.sessions.length - 3} more
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Topics List
function TopicsList({ topics, planId }: { topics: StudyTopic[]; planId: string }) {
  const updateTopic = useUpdateTopic();

  const handleStatusChange = (topicId: string, status: TopicStatus) => {
    updateTopic.mutate({ topicId, planId, data: { status } });
  };

  if (topics.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">
            No topics available. Try creating a new plan with a content-rich notebook.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {topics.map((topic) => (
        <Card key={topic.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{topic.name}</h4>
                  <Badge
                    variant={topic.difficulty === 'hard' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {topic.difficulty}
                  </Badge>
                </div>
                {topic.description && (
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    <Clock className="h-3 w-3 inline mr-1" />
                    {topic.estimated_hours}h
                  </span>
                  <span>Priority: {topic.priority}/10</span>
                  <span>Mastery: {Math.round(topic.mastery_level)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={topic.status}
                  onValueChange={(v) => handleStatusChange(topic.id, v as TopicStatus)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Progress value={topic.mastery_level} className="mt-3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Sessions List
function SessionsList({ sessions, planId }: { sessions: StudySession[]; planId: string }) {
  const startSession = useStartSession();
  const completeSession = useCompleteSession();
  const skipSession = useSkipSession();

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Clock className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-center">
            No study sessions scheduled. Sessions are generated automatically with topics.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const groupedSessions: Record<string, StudySession[]> = {};
  sessions.forEach((session) => {
    const dateKey = format(parseISO(session.scheduled_date), 'yyyy-MM-dd');
    if (!groupedSessions[dateKey]) {
      groupedSessions[dateKey] = [];
    }
    groupedSessions[dateKey].push(session);
  });

  return (
    <div className="space-y-6">
      {Object.entries(groupedSessions).map(([date, daySessions]) => {
        const isToday = format(new Date(), 'yyyy-MM-dd') === date;
        const completedCount = daySessions.filter(s => s.status === 'completed').length;

        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-3">
              <h4 className={`font-semibold ${isToday ? 'text-blue-600' : ''}`}>
                {isToday ? '📅 Today - ' : ''}{format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </h4>
              <Badge variant="outline">
                {completedCount}/{daySessions.length} complete
              </Badge>
            </div>
            <div className="space-y-3">
              {daySessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  topicName={session.topic_name}
                  onStart={() => {
                    startSession.mutate(
                      { sessionId: session.id, planId },
                      { onSuccess: () => toast.success('Session started! 📚') }
                    );
                  }}
                  onComplete={(rating, notes) => {
                    completeSession.mutate(
                      { sessionId: session.id, planId, rating, notes },
                      { onSuccess: () => toast.success('Session completed! 🎉') }
                    );
                  }}
                  onSkip={(reason) => {
                    skipSession.mutate(
                      { sessionId: session.id, planId, reason },
                      { onSuccess: () => toast.info('Session skipped') }
                    );
                  }}
                  isStarting={startSession.isPending}
                  isCompleting={completeSession.isPending}
                  isSkipping={skipSession.isPending}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
