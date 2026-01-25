'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useKnowledgeGraph, useNodeDetails } from '@/lib/hooks/use-knowledge-graph'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Circle,
  ArrowRight,
  Search,
  Sparkles
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import type { GraphNode, GraphLink, NodeType } from '@/lib/types/knowledge-graph'

// Dynamically import ForceGraph2D to avoid SSR issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ForceGraph2D = dynamic<any>(
  () => import('react-force-graph-2d').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px]">
        <LoadingSpinner />
      </div>
    ),
  }
)

interface KnowledgeGraphViewerProps {
  notebookId: string
}

const nodeTypeColors: Record<NodeType, string> = {
  concept: '#60a5fa',    // blue-400 - brighter, cleaner
  person: '#a78bfa',     // violet-400
  event: '#fbbf24',      // amber-400
  place: '#34d399',      // emerald-400
  organization: '#f87171', // red-400
}

export function KnowledgeGraphViewer({ notebookId }: KnowledgeGraphViewerProps) {
  const { data: graphData, isLoading, error } = useKnowledgeGraph(notebookId)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set())
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set())
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null)
  const graphRef = useRef<any>(null)

  const { data: nodeDetails } = useNodeDetails(selectedNodeId)

  // Handle node click
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodeId(node.id)
  }, [])

  // Handle node hover
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setHoverNode(node)

    if (node) {
      const connectedNodes = new Set<string>()
      const connectedLinks = new Set<string>()

      connectedNodes.add(node.id)

      graphData?.links.forEach((link) => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id

        if (sourceId === node.id || targetId === node.id) {
          connectedNodes.add(sourceId)
          connectedNodes.add(targetId)
          connectedLinks.add(`${sourceId}-${targetId}`)
        }
      })

      setHighlightNodes(connectedNodes)
      setHighlightLinks(connectedLinks)
    } else {
      setHighlightNodes(new Set())
      setHighlightLinks(new Set())
    }
  }, [graphData])

  // Zoom controls
  const handleZoomIn = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() * 1.5, 300)
    }
  }

  const handleZoomOut = () => {
    if (graphRef.current) {
      graphRef.current.zoom(graphRef.current.zoom() / 1.5, 300)
    }
  }

  const handleFitView = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400)
    }
  }

  // Custom node rendering with better labels
  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    // Validate node positions are finite before rendering
    if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) {
      return
    }

    const label = node.label
    const fontSize = Math.max(12 / globalScale, 5)
    const baseNodeSize = 10  // Increased from 6 for better visibility
    // Scale node size based on importance and mentions
    const nodeSize = baseNodeSize + Math.sqrt(node.importance * 30 + node.mentions * 5)

    // Validate nodeSize is finite
    if (!Number.isFinite(nodeSize)) {
      return
    }

    const isHighlighted = highlightNodes.has(node.id)
    const baseColor = nodeTypeColors[node.type] || '#94a3b8'

    // Draw outer glow for important or highlighted nodes
    if (node.importance > 0.6 || isHighlighted) {
      const glowSize = isHighlighted ? 25 : 15
      const gradient = ctx.createRadialGradient(node.x!, node.y!, nodeSize, node.x!, node.y!, nodeSize + glowSize)
      gradient.addColorStop(0, `${baseColor}60`)
      gradient.addColorStop(1, `${baseColor}00`)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(node.x!, node.y!, nodeSize + glowSize, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Main node circle
    ctx.beginPath()
    ctx.arc(node.x!, node.y!, nodeSize, 0, 2 * Math.PI)

    // Create gradient for node
    const gradient = ctx.createRadialGradient(
      node.x! - nodeSize * 0.3, node.y! - nodeSize * 0.3, nodeSize * 0.1,
      node.x!, node.y!, nodeSize
    )
    gradient.addColorStop(0, `${baseColor}ff`)
    gradient.addColorStop(1, `${baseColor}cc`)
    ctx.fillStyle = gradient
    ctx.fill()

    // Stronger border for highlighted nodes
    ctx.strokeStyle = isHighlighted ? '#ffffff' : `${baseColor}99`
    ctx.lineWidth = (isHighlighted ? 3 : 1.5) / globalScale
    ctx.stroke()

    // Inner highlight for very important nodes
    if (node.importance > 0.8) {
      ctx.beginPath()
      ctx.arc(node.x!, node.y!, nodeSize * 0.4, 0, 2 * Math.PI)
      ctx.fillStyle = '#ffffff50'
      ctx.fill()
    }

    // Only show labels for:
    // - Hovered node
    // - Highlighted nodes (connected to hovered)
    // - Very important concepts (>80% importance)
    // - When significantly zoomed in
    const shouldShowLabel = isHighlighted ||
      hoverNode?.id === node.id ||
      node.importance > 0.8 ||
      globalScale > 2.5

    if (shouldShowLabel) {
      // Enhanced label with better readability
      ctx.font = `600 ${fontSize}px Inter, -apple-system, sans-serif`
      const textMetrics = ctx.measureText(label)
      const textWidth = textMetrics.width
      const textHeight = fontSize * 1.2
      const padding = 5
      const labelY = node.y! + nodeSize + fontSize + 4

      // Semi-transparent background with rounded corners effect
      ctx.fillStyle = isHighlighted ? 'rgba(0, 0, 0, 0.85)' : 'rgba(15, 23, 42, 0.75)'
      ctx.beginPath()
      ctx.roundRect(
        node.x! - textWidth / 2 - padding,
        labelY - textHeight / 2 - padding,
        textWidth + padding * 2,
        textHeight + padding * 2,
        3
      )
      ctx.fill()

      // Label text with subtle shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = 2
      ctx.shadowOffsetY = 1
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = isHighlighted ? '#ffffff' : '#f1f5f9'
      ctx.fillText(label, node.x!, labelY)
      ctx.shadowBlur = 0
      ctx.shadowOffsetY = 0
    }

    // Mentions badge for frequently mentioned nodes
    if (node.mentions > 2) {
      const badgeRadius = Math.min(nodeSize * 0.5, 10)
      const badgeX = node.x! + nodeSize * 0.6
      const badgeY = node.y! - nodeSize * 0.6

      // Badge circle
      ctx.beginPath()
      ctx.arc(badgeX, badgeY, badgeRadius, 0, 2 * Math.PI)
      ctx.fillStyle = '#ef4444'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2 / globalScale
      ctx.stroke()

      // Badge text
      ctx.font = `bold ${Math.max(badgeRadius * 1.2, 8)}px Inter, sans-serif`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(node.mentions), badgeX, badgeY)
    }
  }, [highlightNodes])

  // Custom link rendering with relationship labels
  const linkCanvasObject = useCallback((link: GraphLink, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const source = typeof link.source === 'string' ? null : link.source
    const target = typeof link.target === 'string' ? null : link.target

    if (!source || !target) return

    // Validate positions are finite before rendering
    if (!Number.isFinite(source.x) || !Number.isFinite(source.y) ||
      !Number.isFinite(target.x) || !Number.isFinite(target.y)) {
      return
    }

    const sourceId = source.id
    const targetId = target.id
    const isHighlighted = highlightLinks.has(`${sourceId}-${targetId}`) ||
      highlightLinks.has(`${targetId}-${sourceId}`)

    // Calculate angle and distance
    const dx = target.x! - source.x!
    const dy = target.y! - source.y!
    const angle = Math.atan2(dy, dx)
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Draw line with gradient
    const gradient = ctx.createLinearGradient(source.x!, source.y!, target.x!, target.y!)
    if (isHighlighted) {
      gradient.addColorStop(0, '#60a5fa')
      gradient.addColorStop(1, '#a78bfa')
      ctx.strokeStyle = gradient
      ctx.lineWidth = 2.5 / globalScale
    } else {
      gradient.addColorStop(0, '#475569')
      gradient.addColorStop(1, '#334155')
      ctx.strokeStyle = gradient
      ctx.lineWidth = 1 / globalScale
    }

    ctx.beginPath()
    ctx.moveTo(source.x!, source.y!)
    ctx.lineTo(target.x!, target.y!)
    ctx.stroke()

    // Draw animated particles for highlighted links
    if (isHighlighted) {
      const particleCount = 3
      const time = Date.now() / 1000
      for (let i = 0; i < particleCount; i++) {
        const progress = ((time * 0.3 + i / particleCount) % 1)
        const particleX = source.x! + dx * progress
        const particleY = source.y! + dy * progress

        ctx.beginPath()
        ctx.arc(particleX, particleY, 2.5 / globalScale, 0, 2 * Math.PI)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      }
    }

    // Draw arrow at midpoint
    const midX = (source.x! + target.x!) / 2
    const midY = (source.y! + target.y!) / 2
    const arrowLength = 12 / globalScale
    const arrowAngle = Math.PI / 6

    ctx.beginPath()
    ctx.moveTo(midX, midY)
    ctx.lineTo(
      midX - arrowLength * Math.cos(angle - arrowAngle),
      midY - arrowLength * Math.sin(angle - arrowAngle)
    )
    ctx.lineTo(
      midX - arrowLength * Math.cos(angle + arrowAngle),
      midY - arrowLength * Math.sin(angle + arrowAngle)
    )
    ctx.closePath()
    ctx.fillStyle = isHighlighted ? '#ffffff' : '#64748b'
    ctx.fill()

    // Draw relationship label when highlighted or zoomed in
    if (isHighlighted || globalScale > 1.5) {
      const fontSize = Math.max(10 / globalScale, 4)
      ctx.font = `500 ${fontSize}px Inter, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Format label
      const labelText = link.relationship.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      const textMetrics = ctx.measureText(labelText)
      const padding = 4

      // Position label slightly offset from midpoint to avoid arrow
      const offsetDistance = 15 / globalScale
      const labelX = midX + offsetDistance * Math.cos(angle + Math.PI / 2)
      const labelY = midY + offsetDistance * Math.sin(angle + Math.PI / 2)

      // Background with rounded corners
      ctx.fillStyle = isHighlighted ? 'rgba(0, 0, 0, 0.9)' : 'rgba(15, 23, 42, 0.8)'
      ctx.beginPath()
      ctx.roundRect(
        labelX - textMetrics.width / 2 - padding,
        labelY - fontSize / 2 - padding,
        textMetrics.width + padding * 2,
        fontSize + padding * 2,
        2
      )
      ctx.fill()

      // Border for highlighted
      if (isHighlighted) {
        ctx.strokeStyle = '#60a5fa'
        ctx.lineWidth = 1 / globalScale
        ctx.stroke()
      }

      // Text
      ctx.fillStyle = isHighlighted ? '#ffffff' : '#cbd5e1'
      ctx.fillText(labelText, labelX, labelY)
    }
  }, [highlightLinks])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">
          Failed to load knowledge graph
        </CardContent>
      </Card>
    )
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">No Knowledge Graph</h3>
          <p className="text-muted-foreground">
            Build a knowledge graph to visualize concepts and relationships
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats and Legend Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Graph Statistics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Graph Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-blue-500">{graphData.nodes.length}</div>
                <div className="text-xs text-muted-foreground">Total Nodes</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-500">{graphData.links.length}</div>
                <div className="text-xs text-muted-foreground">Connections</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-purple-500">
                  {Object.keys(nodeTypeColors).length}
                </div>
                <div className="text-xs text-muted-foreground">Node Types</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Node Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(nodeTypeColors).map(([type, color]) => {
                const count = graphData.nodes.filter(n => n.type === type).length
                return (
                  <div key={type} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full ring-2 ring-offset-2 ring-offset-background"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm capitalize">{type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph */}
      <Card className="relative overflow-hidden">
        <CardContent className="p-0 relative overflow-hidden">
          {/* Instructions Overlay */}
          <div className="absolute bottom-4 left-4 z-10 bg-background/90 backdrop-blur-sm border rounded-lg px-3 py-2 text-xs text-muted-foreground">
            <span className="hidden sm:inline">💡 Hover to explore • Click to detail • Drag to move • Scroll to zoom</span>
            <span className="sm:hidden">💡 Tap node for details</span>
          </div>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Zoom In</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Zoom Out</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary" size="icon" onClick={handleFitView}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">Fit to View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Hover Info */}
          {hoverNode && (
            <div className="absolute top-4 left-4 z-10 bg-background/95 backdrop-blur-md border-2 rounded-lg p-4 max-w-sm shadow-2xl">
              <div className="flex items-start gap-3 mb-2">
                <div
                  className="w-5 h-5 rounded-full ring-2 ring-white flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: nodeTypeColors[hoverNode.type] }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base mb-1 break-words">{hoverNode.label}</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="capitalize text-xs">
                      {hoverNode.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Importance: {Math.round(hoverNode.importance * 100)}%
                    </Badge>
                  </div>
                </div>
              </div>
              {hoverNode.description && (
                <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                  {hoverNode.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <Circle className="h-3 w-3 fill-current" />
                  {hoverNode.mentions} mention{hoverNode.mentions !== 1 ? 's' : ''}
                </span>
                <span className="text-xs opacity-60">Click to see connections</span>
              </div>
            </div>
          )}

          {/* Search and Controls Overlay */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 w-72 pointer-events-none">
            {/* Search */}
            <Card className="pointer-events-auto shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-slate-800">
              <CardContent className="p-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search concepts..."
                    className="pl-8 h-9 bg-slate-900/50 border-slate-700"
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase()
                      if (!term) {
                        setHighlightNodes(new Set())
                        return
                      }
                      const matches = new Set<string>()
                      graphData?.nodes.forEach(n => {
                        if (n.label.toLowerCase().includes(term)) {
                          matches.add(n.id)
                        }
                      })
                      setHighlightNodes(matches)
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Top Topics */}
            <Card className="pointer-events-auto shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 max-h-[300px] overflow-hidden flex flex-col border-slate-800">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  Top Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 overflow-y-auto custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  {graphData?.nodes
                    .sort((a, b) => b.importance - a.importance)
                    .slice(0, 10)
                    .map(node => (
                      <Badge
                        key={node.id}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20 transition-colors border-slate-700"
                        onClick={() => {
                          handleNodeClick(node)
                          if (graphRef.current) {
                            graphRef.current.centerAt(node.x, node.y, 1000)
                            graphRef.current.zoom(3, 2000)
                          }
                        }}
                      >
                        {node.label}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="pointer-events-auto shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-slate-800">
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Node Types</p>
                {Object.entries(nodeTypeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2 text-xs">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/10"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{type}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Force Graph */}
          <div className="h-[600px] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg overflow-hidden relative">
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeId="id"
              nodeLabel={(node: GraphNode) => `${node.label} (${node.type})`}
              nodeRelSize={6}
              nodeVal={(node: GraphNode) => node.importance * 20 + node.mentions * 3}
              nodeCanvasObject={nodeCanvasObject}
              nodeCanvasObjectMode={() => 'replace'}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              linkLabel={(link: GraphLink) => link.relationship}
              linkCanvasObject={linkCanvasObject}
              linkCanvasObjectMode={() => 'replace'}
              linkDirectionalParticles={0}
              linkDirectionalParticleWidth={0}
              backgroundColor="transparent"
              cooldownTicks={150}
              warmupTicks={100}
              d3AlphaDecay={0.015}
              d3VelocityDecay={0.25}
              d3Force={{
                charge: { strength: -300 },   // Increased repulsion for better spacing
                link: { distance: 150 },       // Increased distance between connected nodes
                center: { strength: 0.05 }     // Weakened center pull to allow spread
              }}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              width={undefined}
              height={600}
            />
          </div>
        </CardContent>
      </Card>

      {/* Node Details Dialog */}
      <Dialog open={!!selectedNodeId} onOpenChange={(open: boolean) => !open && setSelectedNodeId(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {nodeDetails?.node && (
                <>
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: nodeTypeColors[nodeDetails.node.type as NodeType] }}
                  />
                  {nodeDetails.node.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {nodeDetails?.node?.type && (
                <Badge variant="secondary" className="capitalize">
                  {nodeDetails.node.type}
                </Badge>
              )}
            </DialogDescription>
          </DialogHeader>

          {nodeDetails && (
            <div className="mt-4 space-y-6">
              {/* Description */}
              {nodeDetails.node.description && (
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {nodeDetails.node.description}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">{nodeDetails.node.mentions}</div>
                  <div className="text-sm text-muted-foreground">Mentions</div>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="text-2xl font-bold">
                    {Math.round(nodeDetails.node.importance * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Importance</div>
                </div>
              </div>

              <Separator />

              {/* Connections */}
              <div>
                <h4 className="font-medium mb-3">
                  Connections ({nodeDetails.connections.length})
                </h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {nodeDetails.edges.map((edge, i) => {
                    const isSource = edge.source_node === nodeDetails.node.id
                    const connectedNode = nodeDetails.connections.find(
                      c => c.id === (isSource ? edge.target_node : edge.source_node)
                    )

                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: nodeTypeColors[connectedNode?.type as NodeType] || '#666' }}
                        />
                        <span className="font-medium">
                          {connectedNode?.label || 'Unknown'}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {edge.relationship}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
