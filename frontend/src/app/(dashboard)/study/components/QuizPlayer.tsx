'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useQuizSession, useSubmitAnswer, useCompleteQuiz } from '@/lib/hooks/use-quiz'
import { QuizQuestion } from '@/lib/types/quiz'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { cn } from '@/lib/utils'
import { 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Trophy, 
  X,
  Clock,
  Target,
  Lightbulb
} from 'lucide-react'

interface QuizPlayerProps {
  sessionId: string
  onComplete: () => void
  onExit: () => void
}

export function QuizPlayer({ sessionId, onComplete, onExit }: QuizPlayerProps) {
  const { data: session, isLoading, refetch } = useQuizSession(sessionId)
  const submitAnswer = useSubmitAnswer(sessionId)
  const completeQuiz = useCompleteQuiz()
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [startTime, setStartTime] = useState<number>(Date.now())

  // Reset start time when moving to a new question
  useEffect(() => {
    setStartTime(Date.now())
  }, [currentQuestionIndex])

  if (isLoading || !session) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  const questions = session.questions || []
  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const answeredCount = questions.filter((q: QuizQuestion) => q.user_answer !== null && q.user_answer !== undefined).length

  // If quiz is already completed, show results
  if (session.status === 'completed') {
    return <QuizResults session={session} onClose={onComplete} />
  }

  if (!currentQuestion) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No questions available</p>
          <Button className="mt-4" onClick={onExit}>Go Back</Button>
        </CardContent>
      </Card>
    )
  }

  const handleSelectAnswer = (index: number) => {
    if (showResult) return // Don't allow changing after submission
    setSelectedAnswer(index)
  }

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null) return

    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    
    await submitAnswer.mutateAsync({
      question_id: currentQuestion.id,
      answer: selectedAnswer,
      time_spent_seconds: timeSpent,
    })
    
    setShowResult(true)
    await refetch()
  }

  const handleNextQuestion = () => {
    setSelectedAnswer(null)
    setShowResult(false)
    
    if (isLastQuestion) {
      handleCompleteQuiz()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleCompleteQuiz = async () => {
    await completeQuiz.mutateAsync(sessionId)
    onComplete()
  }

  const progressPercent = ((answeredCount) / questions.length) * 100

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onExit}>
            <X className="h-4 w-4 mr-1" />
            Exit
          </Button>
          <Badge variant="outline">
            Question {currentQuestionIndex + 1} of {questions.length}
          </Badge>
          <Badge variant={
            currentQuestion.difficulty === 'easy' ? 'secondary' :
            currentQuestion.difficulty === 'hard' ? 'destructive' : 'outline'
          }>
            {currentQuestion.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Target className="h-4 w-4" />
          {session.correct_count}/{answeredCount} correct
        </div>
      </div>

      {/* Progress Bar */}
      <Progress value={progressPercent} className="h-2" />

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option: string, index: number) => {
              const isSelected = selectedAnswer === index
              const isCorrect = showResult && index === currentQuestion.correct_index
              const isWrong = showResult && isSelected && index !== currentQuestion.correct_index
              
              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    "flex items-center gap-3",
                    !showResult && isSelected && "border-primary bg-primary/5",
                    !showResult && !isSelected && "hover:border-primary/50 hover:bg-accent/50",
                    isCorrect && "border-green-500 bg-green-500/10",
                    isWrong && "border-red-500 bg-red-500/10",
                    showResult && !isCorrect && !isWrong && "opacity-50"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    !showResult && isSelected && "bg-primary text-primary-foreground",
                    !showResult && !isSelected && "bg-muted",
                    isCorrect && "bg-green-500 text-white",
                    isWrong && "bg-red-500 text-white"
                  )}>
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : isWrong ? (
                      <XCircle className="h-5 w-5" />
                    ) : (
                      String.fromCharCode(65 + index)
                    )}
                  </div>
                  <span className="flex-1">{option}</span>
                </button>
              )
            })}
          </div>

          {/* Explanation (shown after answering) */}
          {showResult && currentQuestion.explanation && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-sm text-blue-700 dark:text-blue-300">
                    Explanation
                  </p>
                  <p className="text-sm mt-1">{currentQuestion.explanation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            {!showResult ? (
              <Button 
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null || submitAnswer.isPending}
              >
                {submitAnswer.isPending ? (
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                ) : null}
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>
                {isLastQuestion ? (
                  <>
                    <Trophy className="mr-2 h-4 w-4" />
                    Finish Quiz
                  </>
                ) : (
                  <>
                    Next Question
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuizResults({ 
  session, 
  onClose 
}: { 
  session: { 
    score?: number
    correct_count: number
    question_count: number
    questions?: QuizQuestion[]
  }
  onClose: () => void 
}) {
  const score = session.score ?? 0
  const isPassing = score >= 70
  const isPerfect = score === 100

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className={cn(
          "w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4",
          isPerfect ? "bg-yellow-500/20" : isPassing ? "bg-green-500/20" : "bg-red-500/20"
        )}>
          {isPerfect ? (
            <Trophy className="h-10 w-10 text-yellow-500" />
          ) : isPassing ? (
            <CheckCircle className="h-10 w-10 text-green-500" />
          ) : (
            <XCircle className="h-10 w-10 text-red-500" />
          )}
        </div>
        <CardTitle className="text-2xl">
          {isPerfect ? "Perfect Score! 🎉" : isPassing ? "Well Done! 👏" : "Keep Practicing! 💪"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Score Display */}
        <div className="text-center">
          <div className="text-5xl font-bold">{score.toFixed(0)}%</div>
          <p className="text-muted-foreground mt-1">
            {session.correct_count} out of {session.question_count} correct
          </p>
        </div>

        {/* Score Bar */}
        <div className="space-y-2">
          <Progress value={score} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>Pass: 70%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Question Review */}
        {session.questions && session.questions.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Question Summary</h4>
            <div className="flex flex-wrap gap-2">
              {session.questions.map((q, i) => (
                <div
                  key={q.id}
                  className={cn(
                    "w-8 h-8 rounded flex items-center justify-center text-sm font-medium",
                    q.is_correct 
                      ? "bg-green-500/20 text-green-700 dark:text-green-300" 
                      : "bg-red-500/20 text-red-700 dark:text-red-300"
                  )}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-center pt-4">
          <Button onClick={onClose}>
            Back to Study Center
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
