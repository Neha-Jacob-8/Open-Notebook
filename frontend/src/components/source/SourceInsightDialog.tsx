'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useInsight } from '@/lib/hooks/use-insights'
import { useModalManager } from '@/lib/hooks/use-modal-manager'

interface SourceInsightDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  insight?: {
    id: string
    insight_type?: string
    content?: string
    created?: string
    source_id?: string
  }
  onDelete?: (insightId: string) => Promise<void>
}

export function SourceInsightDialog({ open, onOpenChange, insight, onDelete }: SourceInsightDialogProps) {
  const { openModal } = useModalManager()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Ensure insight ID has 'source_insight:' prefix for API calls
  const insightIdWithPrefix = insight?.id
    ? (insight.id.includes(':') ? insight.id : `source_insight:${insight.id}`)
    : ''

  const { data: fetchedInsight, isLoading } = useInsight(insightIdWithPrefix, { enabled: open && !!insight?.id })

  // Use fetched data if available, otherwise fall back to passed-in insight
  const displayInsight = fetchedInsight ?? insight

  // Get source_id from fetched data (preferred) or passed-in insight
  const sourceId = fetchedInsight?.source_id ?? insight?.source_id

  const handleViewSource = () => {
    if (sourceId) {
      openModal('source', sourceId)
    }
  }

  const handleDelete = async () => {
    if (!insight?.id || !onDelete) return
    setIsDeleting(true)
    try {
      await onDelete(insight.id)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Reset delete confirmation when dialog closes
  useEffect(() => {
    if (!open) {
      setShowDeleteConfirm(false)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4 pr-8">
            <DialogTitle>Source Insight</DialogTitle>
            <div className="flex items-center gap-2">
              {displayInsight?.insight_type && (
                <Badge variant="outline" className="text-xs uppercase">
                  {displayInsight.insight_type}
                </Badge>
              )}
              {sourceId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewSource}
                  className="gap-1"
                >
                  <FileText className="h-3 w-3" />
                  View Source
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <p className="text-center text-muted-foreground">
              Are you sure you want to delete this insight?<br />
              <span className="text-sm">This action cannot be undone.</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 px-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <span className="text-sm text-muted-foreground">Loading insight…</span>
              </div>
            ) : displayInsight ? (
              <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="my-3 leading-7">{children}</p>,
                    ul: ({ children }) => <ul className="my-3 ml-6 list-disc space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="my-3 ml-6 list-decimal space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-7">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 border-l-4 border-border pl-4 italic text-muted-foreground">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '')
                      const isInline = !match
                      return isInline ? (
                        <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={`${className} block rounded bg-muted p-4 font-mono text-sm overflow-x-auto`} {...props}>
                          {children}
                        </code>
                      )
                    },
                    pre: ({ children }) => (
                      <pre className="my-4 overflow-x-auto rounded-lg bg-muted p-4">
                        {children}
                      </pre>
                    ),
                    table: ({ children }) => (
                      <div className="my-6 w-full overflow-x-auto">
                        <table className="w-full border-collapse border border-border">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                    tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                    tr: ({ children }) => <tr className="border-b border-border">{children}</tr>,
                    th: ({ children }) => (
                      <th className="border border-border px-4 py-3 text-left font-semibold">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border px-4 py-3">
                        {children}
                      </td>
                    ),
                    hr: () => <hr className="my-6 border-t border-border" />,
                    a: ({ children, href }) => (
                      <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {displayInsight.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No insight selected.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
