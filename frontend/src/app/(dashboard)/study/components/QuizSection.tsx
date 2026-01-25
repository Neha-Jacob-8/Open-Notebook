'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useGenerateQuiz, useQuizSessions } from '@/lib/hooks/use-quiz'
import { QuizDifficulty, QuizSession } from '@/lib/types/quiz'
import { QuizPlayer } from './QuizPlayer'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Play, Clock, CheckCircle, XCircle, Sparkles, History, AlertCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

export function QuizSection() {
  const [selectedNotebook, setSelectedNotebook] = useState<string>('')
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('mixed')
  const [numQuestions, setNumQuestions] = useState(10)
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null)

  const { data: notebooks, isLoading: notebooksLoading } = useNotebooks()
  const { data: quizSessions, isLoading: sessionsLoading } = useQuizSessions(selectedNotebook)
  const generateQuiz = useGenerateQuiz()
  const [error, setError] = useState<string | null>(null)

  const handleGenerateQuiz = async () => {
    if (!selectedNotebook) return
    setError(null)

    try {
      const result = await generateQuiz.mutateAsync({
        notebook_id: selectedNotebook,
        num_questions: numQuestions,
        difficulty,
      })

      setActiveQuizId(result.id)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to generate quiz'
      
      // User-friendly error messages
      if (errorMessage.includes('No content available') || errorMessage.includes('No sources available')) {
        setError('This notebook has no content yet. Please add sources or documents to your notebook first before generating a quiz.')
        toast.error('No content available', {
          description: 'Add sources to your notebook first'
        })
      } else {
        setError(errorMessage)
        toast.error('Quiz generation failed', {
          description: errorMessage
        })
      }
    }
  }

  const handleQuizComplete = () => {
    setActiveQuizId(null)
  }

  // If a quiz is active, show the quiz player
  if (activeQuizId) {
    return (
      <QuizPlayer 
        sessionId={activeQuizId} 
        onComplete={handleQuizComplete}
        onExit={() => setActiveQuizId(null)}
      />
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Generate Quiz Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate New Quiz
          </CardTitle>
          <CardDescription>
            Create an AI-generated quiz from your notebook content
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as QuizDifficulty)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="mixed">Mixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Questions</Label>
              <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 questions</SelectItem>
                  <SelectItem value="10">10 questions</SelectItem>
                  <SelectItem value="15">15 questions</SelectItem>
                  <SelectItem value="20">20 questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button 
            className="w-full" 
            onClick={handleGenerateQuiz}
            disabled={!selectedNotebook || generateQuiz.isPending}
          >
            {generateQuiz.isPending ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Quiz History Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Recent Quizzes
          </CardTitle>
          <CardDescription>
            {selectedNotebook 
              ? "Your previous quiz attempts" 
              : "Select a notebook to see quiz history"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedNotebook ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Select a notebook to view quiz history
            </p>
          ) : sessionsLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : quizSessions && quizSessions.length > 0 ? (
            <div className="space-y-3">
              {quizSessions.slice(0, 5).map((session) => (
                <QuizHistoryItem 
                  key={session.id} 
                  session={session}
                  onResume={() => setActiveQuizId(session.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No quizzes yet. Generate your first quiz!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QuizHistoryItem({ 
  session, 
  onResume 
}: { 
  session: QuizSession
  onResume: () => void 
}) {
  const isCompleted = session.status === 'completed'
  const scorePercent = session.score ?? 0
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            scorePercent >= 70 ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )
          ) : (
            <Clock className="h-4 w-4 text-yellow-500" />
          )}
          <span className="font-medium truncate">{session.title || 'Quiz'}</span>
          <Badge variant={
            session.difficulty === 'easy' ? 'secondary' :
            session.difficulty === 'hard' ? 'destructive' : 'outline'
          }>
            {session.difficulty}
          </Badge>
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          {isCompleted ? (
            <>
              <span>{session.correct_count}/{session.question_count} correct</span>
              <span>{scorePercent.toFixed(0)}%</span>
            </>
          ) : (
            <span>In progress</span>
          )}
          <span>•</span>
          <span>{formatDistanceToNow(new Date(session.created), { addSuffix: true })}</span>
        </div>
      </div>
      
      {!isCompleted && (
        <Button size="sm" variant="outline" onClick={onResume}>
          Resume
        </Button>
      )}
      
      {isCompleted && (
        <div className="w-16">
          <Progress value={scorePercent} className="h-2" />
        </div>
      )}
    </div>
  )
}
