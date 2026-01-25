'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  useResearchHistory, 
  useResearchResult, 
  useDeleteResearch 
} from '@/lib/hooks/use-research'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import { 
  History, 
  Eye, 
  Trash2, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import type { ResearchSummary, ResearchStatus, ResearchResult } from '@/lib/types/research'
import { formatDistanceToNow } from 'date-fns'

const statusColors: Record<ResearchStatus, string> = {
  pending: 'bg-gray-500',
  routing: 'bg-blue-500',
  researching: 'bg-purple-500',
  fact_checking: 'bg-green-500',
  synthesizing: 'bg-orange-500',
  reporting: 'bg-yellow-500',
  completed: 'bg-green-500',
  error: 'bg-red-500',
}

const statusIcons: Record<ResearchStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4" />,
  routing: <Loader2 className="h-4 w-4 animate-spin" />,
  researching: <Loader2 className="h-4 w-4 animate-spin" />,
  fact_checking: <Loader2 className="h-4 w-4 animate-spin" />,
  synthesizing: <Loader2 className="h-4 w-4 animate-spin" />,
  reporting: <Loader2 className="h-4 w-4 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4" />,
  error: <AlertCircle className="h-4 w-4" />,
}

export function ResearchHistory() {
  const { data: history, isLoading } = useResearchHistory()
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const deleteResearch = useDeleteResearch()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Research History</h3>
          <p className="text-muted-foreground">
            Start a research task to see it appear here
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Research History
          </CardTitle>
          <CardDescription>
            View and manage your past research tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((task) => (
              <ResearchHistoryItem
                key={task.task_id}
                task={task}
                onView={() => setSelectedTaskId(task.task_id)}
                onDelete={() => deleteResearch.mutate(task.task_id)}
                isDeleting={deleteResearch.isPending}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <ResearchViewDialog
        taskId={selectedTaskId}
        open={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  )
}

function ResearchHistoryItem({
  task,
  onView,
  onDelete,
  isDeleting,
}: {
  task: ResearchSummary
  onView: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge 
            variant="secondary" 
            className={`${statusColors[task.status]} text-white flex items-center gap-1`}
          >
            {statusIcons[task.status]}
            {task.status}
          </Badge>
          <Badge variant="outline">
            {task.research_type.replace('_', ' ')}
          </Badge>
        </div>
        <p className="font-medium truncate">{task.query}</p>
        <p className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
          {task.completed_at && (
            <> • Completed {formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}</>
          )}
        </p>
      </div>
      
      <div className="flex items-center gap-2 ml-4">
        {task.status === 'completed' && (
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" disabled={isDeleting}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Research?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this research task and its results.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

function ResearchViewDialog({
  taskId,
  open,
  onClose,
}: {
  taskId: string | null
  open: boolean
  onClose: () => void
}) {
  const { data: result, isLoading } = useResearchResult(taskId)
  const [activeTab, setActiveTab] = useState<'report' | 'details'>('report')

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Research Result</DialogTitle>
          <DialogDescription>
            {result?.query || 'Loading...'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={activeTab === 'report' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('report')}
              >
                Final Report
              </Button>
              <Button
                variant={activeTab === 'details' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveTab('details')}
              >
                All Details
              </Button>
            </div>

            {activeTab === 'report' ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{result.final_report}</ReactMarkdown>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium mb-2">Scholar Findings</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-4 rounded-lg">
                    <ReactMarkdown>{result.scholar_findings}</ReactMarkdown>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Fact Check Results</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-4 rounded-lg">
                    <ReactMarkdown>{result.fact_check_results}</ReactMarkdown>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Synthesis</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-4 rounded-lg">
                    <ReactMarkdown>{result.synthesis}</ReactMarkdown>
                  </div>
                </div>

                {result.citations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Citations</h4>
                    <div className="flex flex-wrap gap-2">
                      {result.citations.map((c, i) => (
                        <Badge key={i} variant="secondary">{c.title}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">No result found</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
