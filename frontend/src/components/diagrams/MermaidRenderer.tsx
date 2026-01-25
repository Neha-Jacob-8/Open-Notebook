'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Button } from '@/components/ui/button'
import { Copy, RefreshCw, ZoomIn, ZoomOut, Maximize2, Move } from 'lucide-react'
import { toast } from 'sonner'

interface MermaidRendererProps {
    code: string
    className?: string
}

export function MermaidRenderer({ code, className = '' }: MermaidRendererProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [svg, setSvg] = useState<string>('')
    const [error, setError] = useState<string | null>(null)
    const [scale, setScale] = useState(1)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    useEffect(() => {
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark',
            securityLevel: 'loose',
            fontFamily: 'Inter, sans-serif',
        })
    }, [])

    useEffect(() => {
        const renderDiagram = async () => {
            if (!code || !containerRef.current) return

            try {
                setError(null)
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
                const { svg } = await mermaid.render(id, code)
                setSvg(svg)
            } catch (err) {
                console.error('Mermaid rendering failed:', err)
                setError('Failed to render diagram. Syntax might be invalid.')
            }
        }

        renderDiagram()
    }, [code])

    const handleCopy = () => {
        navigator.clipboard.writeText(code)
        toast.success('Mermaid code copied to clipboard')
    }

    const handleZoomIn = () => setScale(s => Math.min(s + 0.2, 3))
    const handleZoomOut = () => setScale(s => Math.max(s - 0.2, 0.3))
    const handleResetView = () => {
        setScale(1)
        setPosition({ x: 0, y: 0 })
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) { // Left click only
            setIsDragging(true)
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setScale(s => Math.max(0.3, Math.min(3, s + delta)))
    }

    return (
        <div className={`relative border rounded-lg bg-slate-950/50 overflow-hidden ${className}`}>
            {/* Controls */}
            <div className="absolute top-2 right-2 flex gap-1 z-10">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleZoomIn}
                    title="Zoom In"
                >
                    <ZoomIn className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                >
                    <ZoomOut className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleResetView}
                    title="Reset View"
                >
                    <Maximize2 className="h-5 w-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 bg-background/80 backdrop-blur hover:bg-background"
                    onClick={handleCopy}
                    title="Copy Code"
                >
                    <Copy className="h-5 w-5" />
                </Button>
            </div>

            {/* Pan/Zoom Instructions */}
            <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 backdrop-blur px-3 py-2 rounded-md z-10 flex items-center gap-2">
                <Move className="h-3 w-3" />
                <span>Drag to pan • Scroll to zoom • Click Reset to center</span>
            </div>

            {/* Diagram Container */}
            <div
                ref={containerRef}
                className={`p-4 min-h-[300px] flex items-center justify-center transition-all duration-200 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ height: '100%', overflow: 'hidden' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                {error ? (
                    <div className="text-red-400 text-sm p-4 text-center">
                        <p className="mb-2 font-semibold">Rendering Error</p>
                        <p className="opacity-80">{error}</p>
                        <pre className="mt-4 p-2 bg-slate-900 rounded text-xs text-left overflow-auto max-w-full">
                            {code}
                        </pre>
                    </div>
                ) : (
                    <div
                        dangerouslySetInnerHTML={{ __html: svg }}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                            pointerEvents: 'none',
                            userSelect: 'none'
                        }}
                    />
                )}
            </div>
        </div>
    )
}
