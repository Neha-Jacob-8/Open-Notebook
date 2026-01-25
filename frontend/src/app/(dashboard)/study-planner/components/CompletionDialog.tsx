'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface CompletionDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionType: string;
    topicName?: string;
    onComplete: (rating: number, notes: string) => void;
    isLoading?: boolean;
}

export function CompletionDialog({
    open,
    onOpenChange,
    sessionType,
    topicName,
    onComplete,
    isLoading,
}: CompletionDialogProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [notes, setNotes] = useState('');

    const handleComplete = () => {
        onComplete(rating || 3, notes);
        // Reset for next time
        setRating(0);
        setNotes('');
    };

    const displayRating = hoveredRating || rating;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        🎉 Session Complete!
                    </DialogTitle>
                    <DialogDescription>
                        {topicName ? (
                            <>You finished a <strong className="capitalize">{sessionType}</strong> session on <strong>{topicName}</strong>.</>
                        ) : (
                            <>You finished a <strong className="capitalize">{sessionType}</strong> session.</>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Star Rating */}
                    <div className="space-y-2">
                        <Label>How did it go?</Label>
                        <div className="flex items-center justify-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={cn(
                                            'h-8 w-8 transition-colors',
                                            star <= displayRating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-muted-foreground'
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            {displayRating === 1 && 'Struggled a lot 😓'}
                            {displayRating === 2 && 'Found it challenging 🤔'}
                            {displayRating === 3 && 'Did okay 👍'}
                            {displayRating === 4 && 'Went well! 😊'}
                            {displayRating === 5 && 'Crushed it! 🔥'}
                            {displayRating === 0 && 'Click to rate'}
                        </p>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Session Notes (optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="What did you learn? Any struggles or breakthroughs?"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleComplete}
                        disabled={isLoading}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isLoading ? 'Saving...' : 'Complete Session'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
