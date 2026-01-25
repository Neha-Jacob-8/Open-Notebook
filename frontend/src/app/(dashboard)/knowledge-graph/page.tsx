'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { KnowledgeGraphViewer } from './components/KnowledgeGraphViewer'
import { KnowledgeGraphInsightsPanel } from './components/KnowledgeGraphInsightsPanel'
import { GraphControls } from './components/GraphControls'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { useKnowledgeGraph } from '@/lib/hooks/use-knowledge-graph'
import { Network } from 'lucide-react'

export default function KnowledgeGraphPage() {
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null)
  const { data: notebooks } = useNotebooks()
  const { data: graphData } = useKnowledgeGraph(selectedNotebookId)

  // Calculate graph stats with more detailed information
  const graphStats = {
    nodeCount: graphData?.nodes.length || 0,
    edgeCount: graphData?.links.length || 0,
    topConcepts: graphData?.nodes
      .sort((a, b) => b.mentions - a.mentions)
      .slice(0, 10)
      .map(n => ({ 
        label: n.label, 
        mentions: n.mentions,
        type: n.type,
        importance: n.importance 
      })) || [],
    nodeTypes: graphData?.nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {},
    relationshipTypes: graphData?.links.reduce((acc, link) => {
      const rel = link.relationship || 'unknown'
      acc[rel] = (acc[rel] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {},
    allNodes: graphData?.nodes.map(n => ({
      label: n.label,
      type: n.type,
      mentions: n.mentions
    })) || []
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Knowledge Graph</h1>
            <p className="text-muted-foreground mt-1">
              Visualize, explore, and ask questions about concept relationships
            </p>
          </div>

          {/* Notebook Selector and Controls */}
          <GraphControls
            notebooks={notebooks || []}
            selectedNotebookId={selectedNotebookId}
            onSelectNotebook={setSelectedNotebookId}
          />

          {/* Graph View with Insights Panel */}
          {selectedNotebookId ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Graph Visualization */}
              <div className="lg:col-span-2">
                <KnowledgeGraphViewer notebookId={selectedNotebookId} />
              </div>

              {/* Insights Panel */}
              <div className="lg:col-span-1">
                <KnowledgeGraphInsightsPanel 
                  notebookId={selectedNotebookId}
                  graphStats={graphStats}
                />
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-12 text-center bg-muted/30">
              <Network className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg mb-2">Select a Notebook</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Choose a notebook above to view or build its knowledge graph.
                The graph will show concepts and relationships extracted from your sources.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
