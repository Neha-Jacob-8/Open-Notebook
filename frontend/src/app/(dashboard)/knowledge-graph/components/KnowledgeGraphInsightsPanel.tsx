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
  Network
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface KnowledgeGraphInsightsPanelProps {
  notebookId: string
  graphStats: {
    nodeCount: number
    edgeCount: number
    topConcepts?: Array<{ 
      label: string
      mentions: number
      type?: string
      importance?: number
    }>
    nodeTypes?: Record<string, number>
    relationshipTypes?: Record<string, number>
    allNodes?: Array<{
      label: string
      type: string
      mentions: number
    }>
  }
}

export function KnowledgeGraphInsightsPanel({ 
  notebookId, 
  graphStats 
}: KnowledgeGraphInsightsPanelProps) {
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

    // Build context from knowledge graph
    const graphContext = buildGraphContext()
    const contextualQuestion = `${graphContext}\n\nQuestion: ${question}`

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
    
    // Build context from knowledge graph
    const graphContext = buildGraphContext()
    const contextualQuestion = `${graphContext}\n\nQuestion: ${question}`
    
    await sendDirectAsk(contextualQuestion, selectedAnswerModel)
  }

  // Build context string from graph statistics
  const buildGraphContext = () => {
    const { nodeCount, edgeCount, topConcepts, nodeTypes, relationshipTypes, allNodes } = graphStats
    
    let context = `You are analyzing a Knowledge Graph with the following structure:\n\n`
    context += `## Graph Statistics:\n`
    context += `- Total Nodes: ${nodeCount}\n`
    context += `- Total Connections: ${edgeCount}\n\n`
    
    // Node types breakdown
    if (nodeTypes && Object.keys(nodeTypes).length > 0) {
      context += `## Node Types Distribution:\n`
      Object.entries(nodeTypes).forEach(([type, count]) => {
        context += `- ${type}: ${count} nodes\n`
      })
      context += `\n`
    }
    
    // Top concepts with details
    if (topConcepts && topConcepts.length > 0) {
      context += `## Top ${Math.min(10, topConcepts.length)} Most Important Concepts:\n`
      topConcepts.forEach((concept, index) => {
        context += `${index + 1}. **${concept.label}**`
        if (concept.type) context += ` [${concept.type}]`
        context += ` - ${concept.mentions} mentions`
        if (concept.importance) context += ` (importance: ${Math.round(concept.importance * 100)}%)`
        context += `\n`
      })
      context += `\n`
    }
    
    // Relationship types
    if (relationshipTypes && Object.keys(relationshipTypes).length > 0) {
      context += `## Relationship Types:\n`
      Object.entries(relationshipTypes)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([type, count]) => {
          context += `- ${type}: ${count} connections\n`
        })
      context += `\n`
    }
    
    // All concepts (for comprehensive understanding)
    if (allNodes && allNodes.length > 0 && allNodes.length <= 50) {
      context += `## All Concepts in Graph:\n`
      allNodes.forEach(node => {
        context += `- ${node.label} [${node.type}]\n`
      })
      context += `\n`
    }
    
    context += `Please answer the following question based on this knowledge graph structure and content.\n`
    
    return context
  }

  const suggestedQuestions = [
    "What are the main concepts in this knowledge graph?",
    "How are the key ideas connected?",
    "Summarize the relationships between the top concepts",
    "What patterns can you identify in the graph?",
    "Explain the most important nodes and their connections"
  ]

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            Knowledge Graph Insights
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Network className="h-3 w-3" />
            {graphStats.nodeCount} nodes
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Ask AI questions about your knowledge graph
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{graphStats.nodeCount}</div>
            <div className="text-xs text-muted-foreground">Nodes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{graphStats.edgeCount}</div>
            <div className="text-xs text-muted-foreground">Connections</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {graphStats.topConcepts?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Top Concepts</div>
          </div>
        </div>

        <Separator />

        {/* Ask AI Section */}
        <div className="space-y-4">
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
                placeholder="Ask a question about your knowledge graph..."
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
          </div>
      </CardContent>
    </Card>
  )
}
