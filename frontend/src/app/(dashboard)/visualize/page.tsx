'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MermaidRenderer } from '@/components/diagrams/MermaidRenderer'
import { Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useNotebooks } from '@/lib/hooks/use-notebooks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function VisualizePage() {
    const [query, setQuery] = useState('')
    const [context, setContext] = useState('')
    const [diagramCode, setDiagramCode] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedNotebookId, setSelectedNotebookId] = useState<string>('')

    const notebooksQuery = useNotebooks()
    const notebooks = notebooksQuery.data || []

    const handleGenerate = async () => {
        if (!query) {
            toast.error('Please enter a description for the diagram')
            return
        }

        setIsGenerating(true)
        try {
            // If a notebook is selected, we could fetch its context here
            // For now, we'll just use the provided context or query

            const response = await fetch('/api/diagrams/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    context: context || "No specific context provided, use general knowledge.",
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to generate diagram')
            }

            const data = await response.json()
            setDiagramCode(data.code)
            toast.success('Diagram generated successfully!')
        } catch (error) {
            console.error(error)
            toast.error('Failed to generate diagram')
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <AppShell>
            <div className="container mx-auto p-6 space-y-6 max-w-5xl overflow-y-auto h-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Visual Synthesis</h1>
                        <p className="text-muted-foreground mt-1">
                            Generate flowcharts, sequence diagrams, and mind maps from your study notes.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Input Section */}
                <Card className="lg:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Generate Diagram</CardTitle>
                        <CardDescription>Describe what you want to visualize</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notebook (Optional)</label>
                            <Select value={selectedNotebookId} onValueChange={setSelectedNotebookId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a notebook..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {notebooks && notebooks.length > 0 ? (
                                        notebooks.map((nb: any) => (
                                            <SelectItem key={nb.id} value={nb.id}>
                                                {nb.title || 'Untitled Notebook'}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-2 text-sm text-muted-foreground">
                                            No notebooks found
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                placeholder="e.g., Visualize the process of photosynthesis, showing light-dependent and light-independent reactions."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="min-h-[180px] text-base"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Additional Context</label>
                            <Textarea
                                placeholder="Paste specific notes or text here..."
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className="min-h-[180px] text-base"
                            />
                        </div>

                        <Button
                            className="w-full"
                            onClick={handleGenerate}
                            disabled={isGenerating || !query}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Diagram
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Output Section */}
                <Card className="lg:col-span-2 min-h-[800px] flex flex-col">
                    <CardHeader>
                        <CardTitle>Visualization</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        {diagramCode ? (
                            <MermaidRenderer code={diagramCode} className="flex-1 w-full h-full min-h-[700px]" />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg p-12 bg-slate-950/30 min-h-[700px]">
                                <Sparkles className="h-16 w-16 mb-4 opacity-20" />
                                <p className="text-lg">Enter a description to generate a diagram</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
        </AppShell>
    )
}
