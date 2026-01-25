'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useKnowledgeGraphStatus,
  useBuildKnowledgeGraph,
  useDeleteKnowledgeGraph
} from '@/lib/hooks/use-knowledge-graph'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  RefreshCw,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Network
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { NotebookResponse } from '@/lib/types/api'
import type { BuildStatus } from '@/lib/types/knowledge-graph'

interface GraphControlsProps {
  notebooks: NotebookResponse[]
  selectedNotebookId: string | null
  onSelectNotebook: (id: string | null) => void
}

const statusConfig: Record<BuildStatus, { label: string; icon: React.ReactNode; color: string }> = {
  not_built: { label: 'Not Built', icon: <Network className="h-4 w-4" />, color: 'bg-gray-500' },
  pending: { label: 'Pending', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-500' },
  building: { label: 'Building', icon: <Loader2 className="h-4 w-4 animate-spin" />, color: 'bg-blue-500' },
  completed: { label: 'Completed', icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-500' },
  error: { label: 'Error', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-500' },
}

export function GraphControls({ notebooks, selectedNotebookId, onSelectNotebook }: GraphControlsProps) {
  const { data: status } = useKnowledgeGraphStatus(selectedNotebookId)
  const buildGraph = useBuildKnowledgeGraph()
  const deleteGraph = useDeleteKnowledgeGraph()

  const handleBuild = () => {
    if (selectedNotebookId) {
      buildGraph.mutate({ notebook_id: selectedNotebookId })
    }
  }

  const handleDelete = () => {
    if (selectedNotebookId) {
      deleteGraph.mutate(selectedNotebookId)
    }
  }

  const currentStatus = status?.build_status || 'not_built'
  const statusInfo = statusConfig[currentStatus]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Graph Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Notebook Selector */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Notebook</label>
            <Select
              value={selectedNotebookId || ''}
              onValueChange={(value) => onSelectNotebook(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a notebook" />
              </SelectTrigger>
              <SelectContent>
                {notebooks.map((notebook) => (
                  <SelectItem key={notebook.id} value={notebook.id!}>
                    {notebook.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          {selectedNotebookId && (
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Badge
                  variant="secondary"
                  className={`${statusInfo.color} text-white flex items-center gap-1 px-3 py-1`}
                >
                  {statusInfo.icon}
                  {statusInfo.label}
                </Badge>
              </div>

              {status && status.node_count > 0 && (
                <div className="text-sm text-muted-foreground">
                  <div>{status.node_count} nodes</div>
                  <div>{status.edge_count} edges</div>
                </div>
              )}

              {status?.last_built && (
                <div className="text-sm text-muted-foreground">
                  Last built: {formatDistanceToNow(new Date(status.last_built), { addSuffix: true })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {selectedNotebookId && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleBuild}
              disabled={buildGraph.isPending || currentStatus === 'building'}
            >
              {buildGraph.isPending || currentStatus === 'building' ? (
                <LoadingSpinner className="mr-2 h-4 w-4" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {currentStatus === 'not_built' ? 'Build Graph' : 'Rebuild Graph'}
            </Button>

            {status && status.node_count > 0 && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleteGraph.isPending}
              >
                {deleteGraph.isPending ? (
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete Graph
              </Button>
            )}
          </div>
        )}

        {/* Error Message */}
        {status?.error_message && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
            {status.error_message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
