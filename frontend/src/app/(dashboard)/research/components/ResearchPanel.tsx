'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  useStartResearch, 
  useResearchStatus, 
  useResearchResult,
  useQuickResearch 
} from '@/lib/hooks/use-research'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Quote,
  Lightbulb,
  Zap
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { ResearchResult, ResearchStatus } from '@/lib/types/research'

const statusConfig: Record<ResearchStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Queued', color: 'bg-gray-500', icon: <div className="h-2 w-2 rounded-full bg-gray-500" /> },
  routing: { label: 'Analyzing Query', color: 'bg-blue-500', icon: <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" /> },
  researching: { label: 'Researching', color: 'bg-purple-500', icon: <div className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" /> },
  fact_checking: { label: 'Fact Checking', color: 'bg-green-500', icon: <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /> },
  synthesizing: { label: 'Synthesizing', color: 'bg-orange-500', icon: <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" /> },
  reporting: { label: 'Generating Report', color: 'bg-yellow-500', icon: <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" /> },
  completed: { label: 'Completed', color: 'bg-green-500', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  error: { label: 'Error', color: 'bg-red-500', icon: <AlertCircle className="h-4 w-4 text-red-500" /> },
}

export function ResearchPanel() {
  const [query, setQuery] = useState('')
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  
  const startResearch = useStartResearch()
  const quickResearch = useQuickResearch()
  const { data: status } = useResearchStatus(activeTaskId, !showResult)
  const { data: result, isLoading: isLoadingResult } = useResearchResult(
    status?.status === 'completed' ? activeTaskId : null
  )

  const handleStartResearch = async () => {
    if (!query.trim()) return
    
    try {
      const progress = await startResearch.mutateAsync({ query })
      setActiveTaskId(progress.task_id)
      setShowResult(false)
    } catch (error) {
      console.error('Failed to start research:', error)
    }
  }

  const handleQuickResearch = async () => {
    if (!query.trim()) return
    
    try {
      setShowResult(true)
      const res = await quickResearch.mutateAsync({ query })
      setActiveTaskId(res.task_id)
    } catch (error) {
      console.error('Failed to run quick research:', error)
      setShowResult(false)
    }
  }

  // Auto-show result when completed
  if (status?.status === 'completed' && !showResult) {
    setShowResult(true)
  }

  const isResearching = startResearch.isPending || 
    (status && !['completed', 'error'].includes(status.status))

  return (
    <div className="space-y-6">
      {/* Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Research Query
          </CardTitle>
          <CardDescription>
            Ask a complex research question. Our multi-agent system will analyze your sources, 
            verify facts, and synthesize findings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., What are the key arguments for and against renewable energy adoption, and what evidence supports each side?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px]"
            disabled={isResearching}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Tip: Complex questions with multiple aspects work best
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleQuickResearch}
                disabled={!query.trim() || isResearching || quickResearch.isPending}
              >
                {quickResearch.isPending ? (
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                Quick Research
              </Button>
              <Button
                onClick={handleStartResearch}
                disabled={!query.trim() || isResearching}
              >
                {isResearching ? (
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Deep Research
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {status && !showResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Research Progress
              </span>
              <Badge variant="secondary" className="flex items-center gap-2">
                {statusConfig[status.status]?.icon}
                {statusConfig[status.status]?.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={status.progress_percent} className="h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{status.current_step}</span>
              <span>{status.progress_percent}%</span>
            </div>
            
            {/* Agent Pipeline Visualization */}
            <div className="flex items-center justify-between py-4">
              {['routing', 'researching', 'fact_checking', 'synthesizing', 'reporting'].map((step, i) => {
                const isActive = status.status === step
                const isPast = ['routing', 'researching', 'fact_checking', 'synthesizing', 'reporting'].indexOf(status.status) > i
                const isCompleted = status.status === 'completed'
                
                return (
                  <div key={step} className="flex items-center">
                    <div className={`flex flex-col items-center ${i > 0 ? 'ml-4' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                        ${isCompleted || isPast ? 'bg-green-500 text-white' : 
                          isActive ? 'bg-blue-500 text-white animate-pulse' : 
                          'bg-muted text-muted-foreground'}`}>
                        {step === 'routing' && '🎯'}
                        {step === 'researching' && '📚'}
                        {step === 'fact_checking' && '✓'}
                        {step === 'synthesizing' && '🔗'}
                        {step === 'reporting' && '📝'}
                      </div>
                      <span className="text-xs mt-1 text-muted-foreground">
                        {step === 'routing' && 'Route'}
                        {step === 'researching' && 'Research'}
                        {step === 'fact_checking' && 'Verify'}
                        {step === 'synthesizing' && 'Synthesize'}
                        {step === 'reporting' && 'Report'}
                      </span>
                    </div>
                    {i < 4 && (
                      <div className={`h-0.5 w-8 ml-4 ${isPast || isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResult && (result || quickResearch.data) && (
        <ResearchResultDisplay result={result || quickResearch.data!} />
      )}
      
      {showResult && isLoadingResult && !quickResearch.data && (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <LoadingSpinner />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ResearchResultDisplay({ result }: { result: ResearchResult }) {
  const [activeSection, setActiveSection] = useState<'report' | 'scholar' | 'factcheck' | 'synthesis'>('report')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Research Complete
          </CardTitle>
          <Badge>{result.research_type.replace('_', ' ')}</Badge>
        </div>
        <CardDescription>{result.query}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant={activeSection === 'report' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveSection('report')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Final Report
          </Button>
          <Button 
            variant={activeSection === 'scholar' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveSection('scholar')}
          >
            <Quote className="h-4 w-4 mr-2" />
            Scholar Findings
          </Button>
          <Button 
            variant={activeSection === 'factcheck' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveSection('factcheck')}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Fact Check
          </Button>
          <Button 
            variant={activeSection === 'synthesis' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setActiveSection('synthesis')}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            Synthesis
          </Button>
        </div>

        <Separator />

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {activeSection === 'report' && (
            <ReactMarkdown>{result.final_report || 'No report available'}</ReactMarkdown>
          )}
          {activeSection === 'scholar' && (
            <ReactMarkdown>{result.scholar_findings || 'No findings available'}</ReactMarkdown>
          )}
          {activeSection === 'factcheck' && (
            <ReactMarkdown>{result.fact_check_results || 'No fact-check performed'}</ReactMarkdown>
          )}
          {activeSection === 'synthesis' && (
            <ReactMarkdown>{result.synthesis || 'No synthesis available'}</ReactMarkdown>
          )}
        </div>

        {/* Citations */}
        {result.citations && result.citations.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Sources Referenced</h4>
              <div className="flex flex-wrap gap-2">
                {result.citations.map((citation, i) => (
                  <Badge key={i} variant="secondary">
                    {citation.title || `Source ${i + 1}`}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
