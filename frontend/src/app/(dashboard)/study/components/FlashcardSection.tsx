'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { 
  useFlashcards, 
  useFlashcardStats, 
  useGenerateFlashcards,
  useReviewFlashcard 
} from '@/lib/hooks/use-quiz'
import { Flashcard, FLASHCARD_RATINGS } from '@/lib/types/quiz'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'
import { 
  Plus, 
  Sparkles, 
  Play, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react'

export function FlashcardSection() {
  const [selectedNotebook, setSelectedNotebook] = useState<string>('')
  const [numCards, setNumCards] = useState(20)
  const [reviewMode, setReviewMode] = useState(false)

  const { data: notebooks } = useNotebooks()
  const { data: flashcards, isLoading: cardsLoading } = useFlashcards(selectedNotebook || undefined, reviewMode)
  const { data: stats } = useFlashcardStats(selectedNotebook || undefined)
  const generateFlashcards = useGenerateFlashcards()

  const handleGenerateFlashcards = async () => {
    if (!selectedNotebook) return

    await generateFlashcards.mutateAsync({
      notebook_id: selectedNotebook,
      num_cards: numCards,
    })
  }

  const handleStartReview = () => {
    setReviewMode(true)
  }

  // If in review mode and we have cards, show the review interface
  if (reviewMode && flashcards && flashcards.length > 0) {
    return (
      <FlashcardReview 
        flashcards={flashcards} 
        onExit={() => setReviewMode(false)} 
      />
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Generate Flashcards Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Flashcards
          </CardTitle>
          <CardDescription>
            Create AI-generated flashcards from your content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Notebook</Label>
            <Select value={selectedNotebook} onValueChange={setSelectedNotebook}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a notebook..." />
              </SelectTrigger>
              <SelectContent>
                {notebooks?.map((notebook) => (
                  <SelectItem key={notebook.id} value={notebook.id}>
                    {notebook.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Number of Cards</Label>
            <Select value={numCards.toString()} onValueChange={(v) => setNumCards(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 cards</SelectItem>
                <SelectItem value="20">20 cards</SelectItem>
                <SelectItem value="30">30 cards</SelectItem>
                <SelectItem value="50">50 cards</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            className="w-full" 
            onClick={handleGenerateFlashcards}
            disabled={!selectedNotebook || generateFlashcards.isPending}
          >
            {generateFlashcards.isPending ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Generate Flashcards
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Flashcard Stats & Review Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Your Flashcards
          </CardTitle>
          <CardDescription>
            Review due cards using spaced repetition
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.total}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Cards</div>
                </div>
                <div className="p-3 rounded-lg bg-orange-500/10 text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {stats.due}
                  </div>
                  <div className="text-xs text-muted-foreground">Due Today</div>
                </div>
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.new}
                  </div>
                  <div className="text-xs text-muted-foreground">New</div>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.review}
                  </div>
                  <div className="text-xs text-muted-foreground">In Review</div>
                </div>
              </div>

              {/* Review Button */}
              <Button 
                className="w-full" 
                onClick={handleStartReview}
                disabled={stats.due === 0}
                variant={stats.due > 0 ? "default" : "secondary"}
              >
                <Play className="mr-2 h-4 w-4" />
                {stats.due > 0 
                  ? `Review ${stats.due} Due Cards` 
                  : "No Cards Due"}
              </Button>
            </>
          ) : cardsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Layers className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No flashcards yet</p>
              <p className="text-sm">Generate some flashcards to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface FlashcardReviewProps {
  flashcards: Flashcard[]
  onExit: () => void
}

function FlashcardReview({ flashcards, onExit }: FlashcardReviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showBack, setShowBack] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)
  
  const reviewFlashcard = useReviewFlashcard()
  
  const currentCard = flashcards[currentIndex]
  const progress = (reviewedCount / flashcards.length) * 100

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Space or Enter to flip card
      if ((e.key === ' ' || e.key === 'Enter') && !showBack) {
        e.preventDefault()
        setShowBack(true)
      }
      
      // Number keys 1-4 for ratings (only when back is shown)
      if (showBack && ['1', '2', '3', '4'].includes(e.key)) {
        const rating = parseInt(e.key) as 1 | 2 | 3 | 4
        handleRating(rating)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showBack, currentCard])

  if (!currentCard || reviewedCount >= flashcards.length) {
    // Review complete
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
            <RotateCcw className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle>Review Complete! 🎉</CardTitle>
          <CardDescription>
            You reviewed {reviewedCount} cards
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={onExit}>
            Back to Flashcards
          </Button>
        </CardContent>
      </Card>
    )
  }

  const handleRating = async (rating: 1 | 2 | 3 | 4) => {
    try {
      console.log('Rating flashcard:', currentCard.id, 'with rating:', rating)
      await reviewFlashcard.mutateAsync({
        flashcardId: currentCard.id,
        data: { rating }
      })
      console.log('Review successful')
      
      // Move to next card first, then increment reviewed count
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(prev => prev + 1)
        setShowBack(false)
        setReviewedCount(prev => prev + 1)
      } else {
        // This was the last card, increment reviewed count to trigger completion
        setReviewedCount(prev => prev + 1)
      }
    } catch (error: any) {
      console.error('Error reviewing flashcard:', error)
      console.error('Error response:', error?.response?.data)
      console.error('Error message:', error?.message)
      alert(`Failed to review flashcard: ${error?.response?.data?.detail || error?.message || 'Unknown error'}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onExit}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Exit Review
        </Button>
        <Badge variant="outline">
          Card {currentIndex + 1} of {flashcards.length}
        </Badge>
        <div className="text-sm text-muted-foreground">
          {reviewedCount} reviewed
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Flashcard */}
      <Card 
        className={cn(
          "min-h-[300px] cursor-pointer transition-all duration-300",
          "hover:shadow-lg"
        )}
        onClick={() => setShowBack(!showBack)}
      >
        <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-8">
          {!showBack ? (
            <>
              <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                <Eye className="h-3 w-3" />
                Question
              </div>
              <p className="text-xl text-center leading-relaxed">{currentCard.front}</p>
              <p className="text-sm text-muted-foreground mt-8">
                Click to reveal answer
              </p>
            </>
          ) : (
            <>
              <div className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                Answer
              </div>
              <p className="text-xl text-center leading-relaxed">{currentCard.back}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Rating Buttons (shown after revealing) */}
      {showBack && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            How well did you know this? (Press 1-4)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {([1, 2, 3, 4] as const).map((rating) => {
              const ratingInfo = FLASHCARD_RATINGS[rating]
              return (
                <Button
                  key={rating}
                  variant="outline"
                  className={cn(
                    "flex flex-col h-auto py-3",
                    rating === 1 && "hover:bg-red-500/10 hover:border-red-500",
                    rating === 2 && "hover:bg-orange-500/10 hover:border-orange-500",
                    rating === 3 && "hover:bg-blue-500/10 hover:border-blue-500",
                    rating === 4 && "hover:bg-green-500/10 hover:border-green-500"
                  )}
                  onClick={() => handleRating(rating)}
                  disabled={reviewFlashcard.isPending}
                >
                  <span className="font-medium">{ratingInfo.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {rating === 1 && "< 1 min"}
                    {rating === 2 && "< 6 min"}
                    {rating === 3 && "< 10 min"}
                    {rating === 4 && "> 1 day"}
                  </span>
                  <span className="text-xs font-mono opacity-60 mt-1">
                    {rating}
                  </span>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {/* Navigation hint */}
      {!showBack && (
        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>Press <kbd className="px-2 py-1 rounded bg-muted">Space</kbd> to flip</span>
        </div>
      )}
    </div>
  )
}
