'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
    Play,
    Check,
    SkipForward,
    Clock,
    BookOpen,
    Target,
    AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { StudyTimer } from './StudyTimer';
import { CompletionDialog } from './CompletionDialog';
import type { StudySession, SessionType, SessionStatus } from '@/lib/types/study-plan';

interface SessionCardProps {
    session: StudySession;
    topicName?: string;
    onStart: () => void;
    onComplete: (rating: number, notes: string) => void;
    onSkip: (reason: string) => void;
    isStarting?: boolean;
    isCompleting?: boolean;
    isSkipping?: boolean;
}

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

const getStatusColor = (status: SessionStatus): string => {
    const colors: Record<string, string> = {
        scheduled: 'bg-purple-100 text-purple-800 border-purple-200',
        in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
        completed: 'bg-green-100 text-green-800 border-green-200',
        skipped: 'bg-orange-100 text-orange-800 border-orange-200',
        rescheduled: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
};

const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
};

export function SessionCard({
    session,
    topicName,
    onStart,
    onComplete,
    onSkip,
    isStarting,
    isCompleting,
    isSkipping,
}: SessionCardProps) {
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);
    const [skipReason, setSkipReason] = useState('');

    const isInProgress = session.status === 'in_progress';
    const isScheduled = session.status === 'scheduled';
    const isCompleted = session.status === 'completed';
    const isSkipped = session.status === 'skipped';

    const handleTimerComplete = () => {
        setShowCompletionDialog(true);
    };

    const handleCompleteWithRating = (rating: number, notes: string) => {
        onComplete(rating, notes);
        setShowCompletionDialog(false);
    };

    return (
        <>
            <Card
                className={cn(
                    'transition-all duration-200',
                    isInProgress && 'ring-2 ring-blue-500 shadow-lg',
                    isCompleted && 'opacity-75',
                    isSkipped && 'opacity-50'
                )}
            >
                <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                        {/* Left side: Icon and Info */}
                        <div className="flex-1 space-y-2">
                            {/* Topic name (prominent) */}
                            {topicName && (
                                <h4 className="font-semibold text-base">{topicName}</h4>
                            )}

                            {/* Session type and time */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1 capitalize">
                                    {getSessionTypeIcon(session.session_type)}
                                    {session.session_type}
                                </span>
                                <span>•</span>
                                <span>{format(parseISO(session.scheduled_date), 'h:mm a')}</span>
                                <span>•</span>
                                <span>{formatDuration(session.scheduled_duration_minutes)}</span>
                            </div>

                            {/* Status badge */}
                            <Badge variant="outline" className={cn('text-xs', getStatusColor(session.status))}>
                                {session.status.replace('_', ' ')}
                            </Badge>

                            {/* Rating if completed */}
                            {isCompleted && session.rating && (
                                <div className="flex items-center gap-1 text-sm">
                                    {'⭐'.repeat(session.rating)}
                                </div>
                            )}

                            {/* Notes if available */}
                            {session.notes && !isSkipped && (
                                <p className="text-xs text-muted-foreground italic">
                                    &ldquo;{session.notes}&rdquo;
                                </p>
                            )}
                        </div>

                        {/* Right side: Timer or Actions */}
                        <div className="flex flex-col items-center gap-2">
                            {isInProgress ? (
                                <>
                                    <StudyTimer
                                        durationMinutes={session.scheduled_duration_minutes}
                                        isRunning={true}
                                        onComplete={handleTimerComplete}
                                        className="scale-90"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setShowCompletionDialog(true)}
                                        disabled={isCompleting}
                                        className="text-xs"
                                    >
                                        <Check className="h-3 w-3 mr-1" />
                                        {isCompleting ? 'Completing...' : 'Complete Now'}
                                    </Button>
                                </>
                            ) : isScheduled ? (
                                <div className="flex flex-col gap-2">
                                    <Button
                                        size="sm"
                                        onClick={onStart}
                                        disabled={isStarting}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <Play className="h-4 w-4 mr-1" />
                                        {isStarting ? 'Starting...' : 'Start'}
                                    </Button>

                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" size="sm" disabled={isSkipping}>
                                                <SkipForward className="h-4 w-4 mr-1" />
                                                Skip
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2">
                                                    <AlertCircle className="h-5 w-5 text-orange-500" />
                                                    Skip this session?
                                                </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {topicName ? (
                                                        <>Skipping the {session.session_type} session for <strong>{topicName}</strong>.</>
                                                    ) : (
                                                        <>You're about to skip this {session.session_type} session.</>
                                                    )}
                                                    <br /><br />
                                                    You can always create a new session later if needed.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={() => onSkip('Skipped by user')}
                                                    className="bg-orange-500 hover:bg-orange-600"
                                                >
                                                    Skip Session
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ) : isCompleted ? (
                                <div className="flex items-center text-green-600">
                                    <Check className="h-6 w-6" />
                                </div>
                            ) : isSkipped ? (
                                <div className="flex items-center text-orange-500">
                                    <SkipForward className="h-6 w-6" />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Completion Dialog */}
            <CompletionDialog
                open={showCompletionDialog}
                onOpenChange={setShowCompletionDialog}
                sessionType={session.session_type}
                topicName={topicName}
                onComplete={handleCompleteWithRating}
                isLoading={isCompleting}
            />
        </>
    );
}
