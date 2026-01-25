'use client'

import { AppShell } from '@/components/layout/AppShell'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StudyStatsCard } from './components/StudyStatsCard'
import { QuizSection } from './components/QuizSection'
import { FlashcardSection } from './components/FlashcardSection'
import { useStudyStats } from '@/lib/hooks/use-quiz'
import { GraduationCap, Brain, Trophy, Flame } from 'lucide-react'

export default function StudyPage() {
  const { data: stats } = useStudyStats()

  return (
    <AppShell>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <GraduationCap className="h-8 w-8" />
                  Study Center
                </h1>
                <p className="text-muted-foreground mt-1">
                  Master your knowledge with quizzes and spaced repetition
                </p>
              </div>
            </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.current_streak || 0} days</div>
              <p className="text-xs text-muted-foreground">
                Longest: {stats?.longest_streak || 0} days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Level</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Level {stats?.level || 1}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.xp_to_next_level || 500} XP to next level
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_xp || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_quizzes_completed || 0} quizzes completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cards Reviewed</CardTitle>
              <GraduationCap className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total_flashcards_reviewed || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.total_correct_answers || 0} correct answers
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="quiz" className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quiz">📝 Quizzes</TabsTrigger>
            <TabsTrigger value="flashcards">🗂️ Flashcards</TabsTrigger>
            <TabsTrigger value="stats">📊 Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="quiz" className="mt-6">
            <QuizSection />
          </TabsContent>

          <TabsContent value="flashcards" className="mt-6">
            <FlashcardSection />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <StudyStatsCard />
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
