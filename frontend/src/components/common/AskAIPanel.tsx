'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAsk } from '@/lib/hooks/use-ask'
import { useModels } from '@/lib/hooks/use-models'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { 
  Sparkles, 
  Brain,
  Lightbulb,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface AskAIPanelProps {
  title?: string
  description?: string
  context?: string
  suggestedQuestions?: string[]
  className?: string
}

export function AskAIPanel({ 
  title = "Ask AI",
  description = "Ask questions and get AI-powered insights",
  context = "",
  suggestedQuestions = [
    "Summarize the main points",
    "What are the key takeaways?",
    "Explain this in simpler terms",
    "What questions should I ask about this?"
  ],
  className = ""
}: AskAIPanelProps) {
  const [question, setQuestion] = useState('')
  const [selectedStrategyModel, setSelectedStrategyModel] = useState<string>('')
  const [selectedAnswerModel, setSelectedAnswerModel] = useState<string>('')
  const [selectedFinalModel, setSelectedFinalModel] = useState<string>('')

  const askHook = useAsk()
  const askState = {
    isStreaming: askHook.isStreaming,
    strategy: askHook.strategy,
    answers: askHook.answers,
    finalAnswer: askHook.finalAnswer,
    error: askHook.error
  }
  const { sendAsk, sendDirectAsk } = askHook
  const { data: models, isLoading: modelsLoading } = useModels()

  const handleAsk = async () => {
    if (!question.trim()) return

    // Prepend context if provided
    const contextualQuestion = context 
      ? `${context}\n\nQuestion: ${question}`
      : question

    if (!selectedStrategyModel || !selectedAnswerModel || !selectedFinalModel) {
      // Use first available model as default
      const defaultModel = models?.[0]?.id
      await sendAsk(contextualQuestion, {
        strategy: selectedStrategyModel || defaultModel || 'gpt-4o',
        answer: selectedAnswerModel || defaultModel || 'gpt-4o',
        finalAnswer: selectedFinalModel || defaultModel || 'gpt-4o',
      })
    } else {
      await sendAsk(contextualQuestion, {
        strategy: selectedStrategyModel,
        answer: selectedAnswerModel,
        finalAnswer: selectedFinalModel,
      })
    }
  }

  const handleDirectAsk = async () => {
    if (!question.trim()) return
    
    // Prepend context if provided
    const contextualQuestion = context 
      ? `${context}\n\nQuestion: ${question}`
      : question
    
    await sendDirectAsk(contextualQuestion, selectedAnswerModel)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            {title}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">AI Model</label>
          <Select
            value={selectedAnswerModel}
            onValueChange={setSelectedAnswerModel}
            disabled={modelsLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select model for answers" />
            </SelectTrigger>
            <SelectContent>
              {models?.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Question Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Your Question</label>
          <Textarea
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[100px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                handleDirectAsk()
              }
            }}
          />
        </div>

        {/* Suggested Questions */}
        {suggestedQuestions.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Suggested Questions
            </label>
            <ScrollArea className="h-[120px]">
              <div className="space-y-2">
                {suggestedQuestions.map((q, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-left h-auto py-2 px-3"
                    onClick={() => setQuestion(q)}
                  >
                    <span className="text-xs line-clamp-2">{q}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <Separator />

        {/* Ask Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleDirectAsk}
            disabled={!question.trim() || askState.isStreaming}
            className="flex-1 gap-2"
          >
            {askState.isStreaming ? (
              <>
                <LoadingSpinner className="h-4 w-4" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Quick Ask
              </>
            )}
          </Button>
          <Button
            onClick={handleAsk}
            disabled={!question.trim() || askState.isStreaming}
            variant="secondary"
            className="flex-1 gap-2"
          >
            <Brain className="h-4 w-4" />
            Deep Analysis
          </Button>
        </div>

        {/* Answer Display */}
        {(askState.finalAnswer || askState.answers.length > 0 || askState.strategy) && (
          <Card className="border-purple-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                {/* Strategy */}
                {askState.strategy && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <h4 className="text-xs font-semibold mb-2 flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      Analysis Strategy
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {askState.strategy.reasoning}
                    </p>
                    {askState.strategy.searches.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {askState.strategy.searches.map((s: { term: string; instructions: string }, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {s.term}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Partial Answers */}
                {askState.answers.map((answer: string, i: number) => (
                  <div key={i} className="mb-3 p-3 bg-muted/30 rounded-lg">
                    <h4 className="text-xs font-semibold mb-2">Answer {i + 1}</h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{answer}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {/* Final Answer */}
                {askState.finalAnswer && (
                  <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg border border-purple-500/20">
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Final Answer
                    </h4>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{askState.finalAnswer}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {askState.isStreaming && !askState.finalAnswer && (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner className="h-6 w-6" />
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {askState.error && (
          <Card className="border-destructive">
            <CardContent className="pt-4">
              <p className="text-sm text-destructive">{askState.error}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
