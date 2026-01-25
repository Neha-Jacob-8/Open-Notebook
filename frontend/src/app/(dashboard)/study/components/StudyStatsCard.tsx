'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useStudyStats, useFlashcardStats } from '@/lib/hooks/use-quiz'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { 
  Trophy, 
  Flame, 
  Target, 
  Brain, 
  Award,
  TrendingUp,
  Calendar,
  Zap,
  GraduationCap
} from 'lucide-react'

export function StudyStatsCard() {
  const { data: stats, isLoading } = useStudyStats()
  const { data: flashcardStats } = useFlashcardStats()

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No study data yet. Start studying to see your progress!
        </CardContent>
      </Card>
    )
  }

  const xpProgress = ((stats.total_xp % 500) / 500) * 100
  const accuracyRate = stats.total_flashcards_reviewed > 0 
    ? (stats.total_correct_answers / stats.total_flashcards_reviewed) * 100 
    : 0

  return (
    <div className="space-y-6">
      {/* Summary Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.current_streak} days</div>
            <p className="text-xs text-muted-foreground mt-1">
              Longest: {stats.longest_streak} days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level & XP</CardTitle>
            <Trophy className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Level {stats.level}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total_xp} Total XP
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
            <Target className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{accuracyRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total_correct_answers} / {stats.total_flashcards_reviewed} correct
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <GraduationCap className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_quizzes_completed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Quizzes taken
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2">
      {/* XP & Level Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Experience Points
          </CardTitle>
          <CardDescription>Your learning progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold">Lv.{stats.level}</div>
              </div>
            </div>
            <div className="text-3xl font-bold">{stats.total_xp} XP</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress to Level {stats.level + 1}</span>
              <span>{500 - stats.xp_to_next_level} / 500 XP</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              How to earn XP
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Complete a quiz: +50 XP</li>
              <li>• Perfect quiz score: +100 XP</li>
              <li>• Daily review: +25 XP</li>
              <li>• Create flashcard: +10 XP</li>
              <li>• Streak bonus: +10 XP per day</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Streak Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Study Streak
          </CardTitle>
          <CardDescription>Keep your momentum going!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 rounded-lg bg-orange-500/10">
              <Flame className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <div className="text-3xl font-bold">{stats.current_streak}</div>
              <div className="text-sm text-muted-foreground">Current Streak</div>
            </div>
            <div className="text-center p-4 rounded-lg bg-purple-500/10">
              <Trophy className="h-8 w-8 mx-auto text-purple-500 mb-2" />
              <div className="text-3xl font-bold">{stats.longest_streak}</div>
              <div className="text-sm text-muted-foreground">Best Streak</div>
            </div>
          </div>

          <div className="p-4 rounded-lg border">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              This Week
            </h4>
            <div className="flex justify-between">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">{day}</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i < stats.current_streak 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-muted'
                  }`}>
                    {i < stats.current_streak ? '🔥' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Performance
          </CardTitle>
          <CardDescription>Your learning metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-purple-500" />
                <span>Quizzes Completed</span>
              </div>
              <span className="text-xl font-bold">{stats.total_quizzes_completed}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-green-500" />
                <span>Cards Reviewed</span>
              </div>
              <span className="text-xl font-bold">{stats.total_flashcards_reviewed}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <span>Accuracy Rate</span>
              </div>
              <span className="text-xl font-bold">{accuracyRate.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Achievements
          </CardTitle>
          <CardDescription>Badges you've earned</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.badges && stats.badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.badges.map((badge: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-sm py-1 px-3">
                  {badge}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-muted-foreground">No badges yet</p>
              <p className="text-sm text-muted-foreground">
                Complete quizzes and maintain streaks to earn badges!
              </p>
            </div>
          )}

          {/* Upcoming Badges Preview */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Upcoming Badges</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-muted/30 opacity-50">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-xs">First Quiz</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30 opacity-50">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-xs">7 Day Streak</div>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30 opacity-50">
                <div className="text-2xl mb-1">💯</div>
                <div className="text-xs">Perfect Score</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  )
}
