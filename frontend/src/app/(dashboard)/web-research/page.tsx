'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Search, 
  Loader2, 
  Globe, 
  BookOpen, 
  ExternalLink, 
  Plus,
  Sparkles,
  Lightbulb,
  FileQuestion,
  CheckCircle2,
  Copy
} from 'lucide-react'
import { toast } from 'sonner'
import { useNotebooks } from '@/lib/hooks/use-notebooks'

interface CuratedSource {
  title: string
  url: string
  snippet: string
  relevance_score: number
  summary: string
  key_points: string[]
  citation: string
  source_type: string
}

interface ResearchResult {
  topic: string
  overview: string
  sources: CuratedSource[]
  key_insights: string[]
  suggested_questions: string[]
  sources_added: number
  created_at: string
}

const SOURCE_TYPE_COLORS: Record<string, string> = {
  academic: 'bg-purple-500',
  educational: 'bg-blue-500',
  encyclopedia: 'bg-green-500',
  news: 'bg-orange-500',
  official: 'bg-indigo-500',
  blog: 'bg-gray-500',
}

export default function WebResearchPage() {
  const [topic, setTopic] = useState('')
  const [isResearching, setIsResearching] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [selectedNotebookId, setSelectedNotebookId] = useState<string>('')
  const [autoAddSources, setAutoAddSources] = useState(false)
  const [addingSources, setAddingSources] = useState<string[]>([])
  const [researchPhase, setResearchPhase] = useState<string>('')

  const notebooksQuery = useNotebooks()
  const notebooks = notebooksQuery.data || []

  const handleResearch = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic to research')
      return
    }

    setIsResearching(true)
    setResult(null)
    setResearchPhase('Searching the web...')

    try {
      // Use AbortController for 2 minute timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 120000)

      // Update phase messages
      const phaseInterval = setInterval(() => {
        setResearchPhase(prev => {
          if (prev === 'Searching the web...') return 'Fetching content from sources...'
          if (prev === 'Fetching content from sources...') return 'AI is analyzing sources...'
          if (prev === 'AI is analyzing sources...') return 'Curating best sources...'
          if (prev === 'Curating best sources...') return 'Generating insights...'
          return 'Almost done...'
        })
      }, 8000)

      const response = await fetch('/api/web-research/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          num_sources: 5,
          notebook_id: autoAddSources ? selectedNotebookId : null,
          auto_add_sources: autoAddSources && !!selectedNotebookId,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      clearInterval(phaseInterval)

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Research failed' }))
        throw new Error(error.detail || 'Research failed')
      }

      const data = await response.json()
      setResult(data)
      
      if (data.sources_added > 0) {
        toast.success(`Added ${data.sources_added} sources to your notebook!`)
      } else {
        toast.success('Research completed!')
      }
    } catch (error: any) {
      console.error(error)
      if (error.name === 'AbortError') {
        toast.error('Research timed out. Try a simpler topic.')
      } else {
        toast.error(error.message || 'Failed to complete research. Please try again.')
      }
    } finally {
      setIsResearching(false)
      setResearchPhase('')
    }
  }

  const handleAddSource = async (source: CuratedSource) => {
    if (!selectedNotebookId) {
      toast.error('Please select a notebook first')
      return
    }

    setAddingSources(prev => [...prev, source.url])

    try {
      const response = await fetch('/api/web-research/add-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notebook_id: selectedNotebookId,
          urls: [source.url],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add source')
      }

      toast.success(`Added "${source.title}" to notebook`)
    } catch (error) {
      console.error(error)
      toast.error('Failed to add source')
    } finally {
      setAddingSources(prev => prev.filter(url => url !== source.url))
    }
  }

  const handleCopyCitation = (citation: string) => {
    navigator.clipboard.writeText(citation)
    toast.success('Citation copied to clipboard')
  }

  return (
    <AppShell>
      <div className="container mx-auto p-6 space-y-6 max-w-5xl overflow-y-auto h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Globe className="h-8 w-8 text-primary" />
              Web Research
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered topic research that finds, curates, and summarizes the best sources
            </p>
          </div>
        </div>

        {/* Research Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Research a Topic
            </CardTitle>
            <CardDescription>
              Enter any topic and let AI find and curate the best educational sources
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="e.g., Photosynthesis, French Revolution, Machine Learning..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleResearch} 
                disabled={isResearching || !topic.trim()}
                className="min-w-[120px]"
              >
                {isResearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Researching
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Research
                  </>
                )}
              </Button>
            </div>

            {/* Show research phase */}
            {isResearching && researchPhase && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span>{researchPhase}</span>
              </div>
            )}

            {/* Options */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="auto-add"
                  checked={autoAddSources}
                  onCheckedChange={(checked) => setAutoAddSources(checked === true)}
                />
                <Label htmlFor="auto-add" className="text-sm cursor-pointer">
                  Auto-add sources to notebook
                </Label>
              </div>

              <Select value={selectedNotebookId} onValueChange={setSelectedNotebookId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select notebook" />
                </SelectTrigger>
                <SelectContent>
                  {notebooks.map((nb) => (
                    <SelectItem key={nb.id} value={nb.id}>
                      {nb.name || 'Untitled Notebook'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isResearching && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
              <h3 className="text-lg font-medium">Researching &quot;{topic}&quot;</h3>
              <p className="text-muted-foreground mt-2">
                Searching the web, evaluating sources, and generating insights...
              </p>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && !isResearching && (
          <div className="space-y-6">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Research Overview: {result.topic}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {result.overview.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Key Insights */}
            {result.key_insights.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-500" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.key_insights.map((insight, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Curated Sources ({result.sources.length})
                </CardTitle>
                <CardDescription>
                  AI-selected sources ranked by relevance and educational value
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.sources.map((source, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            className={`${SOURCE_TYPE_COLORS[source.source_type] || 'bg-gray-500'} text-white text-xs`}
                          >
                            {source.source_type}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(source.relevance_score * 100)}% relevant
                          </Badge>
                        </div>
                        <h4 className="font-medium truncate">{source.title}</h4>
                        <a 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 truncate"
                        >
                          {new URL(source.url).hostname}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCitation(source.citation)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddSource(source)}
                          disabled={!selectedNotebookId || addingSources.includes(source.url)}
                        >
                          {addingSources.includes(source.url) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">{source.summary}</p>
                    
                    {source.key_points.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {source.key_points.slice(0, 3).map((point, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">
                            {point.length > 50 ? point.slice(0, 50) + '...' : point}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Suggested Questions */}
            {result.suggested_questions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileQuestion className="h-5 w-5 text-blue-500" />
                    Suggested Follow-up Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.suggested_questions.map((question, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTopic(question)
                          toast.info('Click Research to explore this question')
                        }}
                        className="text-left h-auto py-2"
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
