'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResearchPanel } from './components/ResearchPanel'
import { ResearchHistory } from './components/ResearchHistory'
import { useResearchHistory } from '@/lib/hooks/use-research'
import { Search, History, FlaskConical } from 'lucide-react'

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState('research')
  const { data: history } = useResearchHistory()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Research Lab</h1>
          <p className="text-muted-foreground mt-1">
            Multi-agent research pipeline for deep analysis
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            <span>{history?.length || 0} Research Tasks</span>
          </div>
        </div>
      </div>

      {/* Agent Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              🎯 Router Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Analyzes your query and determines the best research approach
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              📚 Scholar Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Deep dives into sources for detailed evidence and quotes
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              ✓ Fact-Check Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Verifies claims and identifies contradictions
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              📝 Report Agent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Synthesizes findings into a comprehensive report
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="research" className="gap-2">
            <Search className="h-4 w-4" />
            New Research
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="research" className="space-y-6">
          <ResearchPanel />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ResearchHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
