'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudyTimerProps {
    durationMinutes: number;
    isRunning: boolean;
    onComplete: () => void;
    onPause?: () => void;
    onResume?: () => void;
    className?: string;
}

export function StudyTimer({
    durationMinutes,
    isRunning: initiallyRunning,
    onComplete,
    onPause,
    onResume,
    className,
}: StudyTimerProps) {
    const totalSeconds = durationMinutes * 60;
    const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds);
    const [isPaused, setIsPaused] = useState(!initiallyRunning);

    const progress = ((totalSeconds - secondsRemaining) / totalSeconds) * 100;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handlePauseResume = useCallback(() => {
        if (isPaused) {
            setIsPaused(false);
            onResume?.();
        } else {
            setIsPaused(true);
            onPause?.();
        }
    }, [isPaused, onPause, onResume]);

    const handleReset = useCallback(() => {
        setSecondsRemaining(totalSeconds);
        setIsPaused(true);
    }, [totalSeconds]);

    useEffect(() => {
        if (isPaused || secondsRemaining <= 0) return;

        const interval = setInterval(() => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isPaused, secondsRemaining, onComplete]);

    // Auto-start when initially running
    useEffect(() => {
        if (initiallyRunning) {
            setIsPaused(false);
        }
    }, [initiallyRunning]);

    const circumference = 2 * Math.PI * 45; // radius = 45
    const strokeDashoffset = circumference * (1 - progress / 100);

    return (
        <div className={cn('flex flex-col items-center gap-4', className)}>
            {/* Circular Progress Timer */}
            <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                        className="text-muted stroke-current"
                        strokeWidth="8"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                    />
                    {/* Progress circle */}
                    <circle
                        className={cn(
                            'stroke-current transition-all duration-1000',
                            progress >= 100 ? 'text-green-500' : 'text-blue-500',
                            isPaused && 'text-yellow-500'
                        )}
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset,
                        }}
                    />
                </svg>
                {/* Time display */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-mono font-bold">
                        {formatTime(secondsRemaining)}
                    </span>
                </div>
            </div>

            {/* Control buttons */}
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePauseResume}
                    className="h-10 w-10"
                >
                    {isPaused ? (
                        <Play className="h-4 w-4" />
                    ) : (
                        <Pause className="h-4 w-4" />
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    className="h-10 w-10"
                >
                    <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                    variant="default"
                    size="icon"
                    onClick={onComplete}
                    className="h-10 w-10 bg-green-500 hover:bg-green-600"
                >
                    <Check className="h-4 w-4" />
                </Button>
            </div>

            {/* Status */}
            <p className="text-sm text-muted-foreground">
                {isPaused ? '⏸️ Paused' : '📚 Studying...'}
            </p>
        </div>
    );
}
