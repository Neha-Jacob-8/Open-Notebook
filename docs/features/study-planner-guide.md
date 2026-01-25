# Study Planner User Guide

## Overview

The **Study Planner** is an AI-powered feature that creates personalized study schedules based on your notebook content. It analyzes your materials (PDFs, documents, notes) and generates:

- **Study Topics** - Key concepts extracted from your content
- **Study Sessions** - Scheduled learning, review, practice, and quiz sessions
- **Progress Tracking** - Monitor your progress and stay on track
- **Smart Scheduling** - Adapts to your available time and deadline

## 🎯 How It Works

### 1. Content Analysis
The AI reads through all sources in your selected notebook and identifies:
- Key topics and concepts
- Topic difficulty levels
- Dependencies between topics
- Estimated study time for each topic

### 2. Schedule Generation
Based on your inputs (deadline, available hours/day), the system:
- Prioritizes topics by importance and dependencies
- Creates learn, review, practice, and quiz sessions
- Distributes sessions across available days
- Ensures you can meet your deadline

### 3. Adaptive Learning
As you study:
- Track session completion
- Rate your understanding
- System adjusts future sessions based on performance
- Suggests reviews for difficult topics

## ✅ Prerequisites

Before creating a study plan, ensure:

1. **Create a Notebook** 
   - Go to "Notebooks" page
   - Click "New Notebook"
   - Add a name and description

2. **Add Content Sources**
   - Upload PDFs, documents, or add web pages
   - At least 1 source is required (preferably 2-5 for better results)
   - The more content, the better the AI can identify topics

3. **Quality Content Matters**
   - Use educational materials (textbooks, lectures, articles)
   - Avoid empty or image-only PDFs
   - Content should have clear topics/chapters

## 📝 Creating Your First Study Plan

### Step 1: Navigate to Study Planner
1. Click **Study Planner** in the sidebar
2. Click **"Create Plan"** button

### Step 2: Fill in Details
- **Notebook**: Select a notebook with sources
- **Plan Title**: Give it a meaningful name (e.g., "Chemistry Final Exam")
- **Deadline**: Set your target completion date
- **Hours per Day**: How much time you can dedicate (0.5-8 hours)
- **Include Reviews**: ✅ Recommended (adds spaced repetition)
- **Include Practice**: ✅ Recommended (adds practice sessions)

### Step 3: Generate Plan
1. Click **"Generate Plan"**
2. Wait for AI to analyze content (10-30 seconds)
3. Review generated topics and sessions

## 🎓 Using Your Study Plan

### Daily Study Sessions

**Today's Sessions** appear at the top showing:
- Session type (Learn, Review, Practice, Quiz)
- Scheduled time and duration
- Topic name
- Quick start button

**To start a session:**
1. Click the ▶️ Play button
2. Study the material
3. Click ✓ Complete when done
4. Rate your understanding (optional)

### Weekly Schedule View

The calendar shows:
- All sessions for the week
- Completed vs. scheduled sessions
- Total hours planned per day
- Progress indicators

**Navigate weeks:**
- Use ← Previous / Next → buttons
- Current week highlighted in blue

### Topics Tab

View all topics with:
- **Difficulty level** (Easy, Medium, Hard)
- **Estimated hours** to complete
- **Priority** ranking (1-10)
- **Mastery level** (your progress %)
- **Status** (Not Started, In Progress, Completed, Skipped)

**Update topic status** manually if needed.

### All Sessions Tab

See complete list of sessions:
- Grouped by date
- All session types
- Status indicators
- Manual start/complete buttons

## 📊 Progress Tracking

### Overview Cards
- **Progress**: Overall completion percentage
- **Study Time**: Completed hours vs. total needed
- **Deadline**: Days remaining
- **Status**: On Track / Behind schedule

### On Track Indicator
The system calculates if you're on track by:
- Comparing completed hours to expected hours
- Checking remaining time vs. remaining work
- Showing "hours/day needed" to stay on track

### Behind Schedule?
If you fall behind, the system shows:
- How many hours/day you need to catch up
- Suggests adjusting deadline or reducing scope
- Highlights overdue sessions

## 💡 Tips for Success

### Before Creating a Plan

1. **Add Quality Content**
   - Use well-structured educational materials
   - Multiple sources provide better topic coverage
   - Ensure PDFs have extractable text (not scanned images)

2. **Set Realistic Goals**
   - Don't overcommit on hours per day
   - Leave buffer time before deadline
   - Consider your other commitments

3. **Use Focus Areas** (optional)
   - Specify what to focus on in the description
   - Example: "Focus on organic chemistry and thermodynamics"

### During Your Study

1. **Follow the Schedule**
   - Stick to planned sessions
   - Complete reviews (they improve retention)
   - Don't skip practice sessions

2. **Rate Your Sessions**
   - Honest ratings help the AI adapt
   - Low ratings trigger more review sessions
   - High ratings may reduce redundant reviews

3. **Adjust as Needed**
   - Update topic status manually if you already know it
   - Skip sessions you don't need
   - Request plan adjustments if schedule doesn't work

### After Completion

1. **Review Analytics**
   - Check your completion percentage
   - Review total study time
   - Analyze difficult topics

2. **Use for Future Plans**
   - Your mastery data informs future plans
   - The AI learns your learning patterns
   - Difficult topics get more focus next time

## ⚠️ Troubleshooting

### "No Topics Generated"

**Problem**: Study plan has no topics
**Causes**:
- Notebook has no sources
- Sources are empty or unreadable
- AI couldn't extract meaningful topics

**Solution**:
1. Delete the empty plan
2. Add 2-5 quality sources to your notebook
3. Create a new study plan

### "No Study Sessions"

**Problem**: Plan has topics but no sessions
**Causes**:
- Topics were manually added without generation
- Database error during session creation
- Insufficient time between now and deadline

**Solution**:
1. Check that deadline is at least 2-3 days away
2. Ensure available hours per day > 0.5
3. Try deleting and regenerating the plan

### "Behind Schedule" Always Shows

**Problem**: Always showing as behind even when completing sessions
**Causes**:
- Sessions marked as skipped instead of completed
- System clock issues
- Very aggressive timeline

**Solution**:
1. Verify sessions are marked "Completed" not "Skipped"
2. Check deadline is realistic for content amount
3. Consider extending deadline or increasing daily hours

### Generic "Learn Session" Instead of Topic Names

**Problem**: Sessions show generic names instead of actual topics
**Causes**:
- The plan has 0 topics (generation failed)
- Topics weren't linked to sessions properly
- Database relationship issue

**Solution**:
1. Check the Topics tab to see if any topics exist
2. If no topics, delete plan and regenerate with content
3. If topics exist but not showing, this is a bug to report

## 🔧 Advanced Features

### Manual Topic Management

You can manually add topics:
1. Go to Topics tab
2. Click "Add Topic" (if available)
3. Fill in topic details
4. Sessions won't auto-generate for manual topics

### Plan Adjustments

Request AI adjustments:
- Reschedule sessions
- Add extra review sessions
- Extend deadline
- Increase/decrease daily hours
- Reduce scope (remove topics)

### Multiple Plans

You can have multiple active plans:
- Different notebooks
- Different subjects
- Overlapping deadlines
- System merges schedules

### Focus Areas

When creating a plan, you can specify focus areas:
- "Focus on chapters 1-5"
- "Emphasis on practical examples"
- "Skip theoretical proofs"
- AI prioritizes these areas

## 🎯 Best Practices

### For Exams
- Create plan 2-3 weeks before exam
- Include all relevant course materials
- Enable both reviews and practice
- Study 1-2 hours more per day than minimum

### For Learning New Skills
- Set longer deadlines (4-8 weeks)
- Include practice sessions heavily
- Start with foundational materials first
- Use shorter session durations (30-45 min)

### For Quick Reviews
- Create plan 3-7 days before
- Use only review and quiz sessions
- Focus on weak areas only
- Higher hours per day acceptable

### For Long-Term Learning
- Multiple small plans better than one large plan
- Complete one plan before starting next
- Review previous plans periodically
- Build progressive curriculum

## 📈 Future Enhancements

Features coming soon:
- **Integration with Quiz System** - Auto-generate quizzes from topics
- **Flashcard Generation** - Create flashcards for each topic
- **Collaborative Plans** - Share plans with study groups
- **Template Plans** - Pre-built plans for common subjects
- **Mobile Reminders** - Get notifications for upcoming sessions
- **Analytics Dashboard** - Detailed learning analytics
- **AI Tutor Integration** - Chat with AI about current topics
- **Adaptive Difficulty** - Auto-adjust based on performance

## ❓ FAQ

**Q: Can I edit the generated schedule?**
A: You can manually start/complete/skip sessions, but can't edit times yet. Use plan adjustments instead.

**Q: What happens if I miss a session?**
A: It remains scheduled for that day. You can complete it late or skip it. System shows you're behind.

**Q: Can I use this without AI?**
A: No, topic extraction requires AI. But you can manually mark topics as complete if you already know them.

**Q: Does it work with video content?**
A: Only if videos have transcripts. Upload transcript as a text file or PDF.

**Q: How accurate is the time estimation?**
A: Estimates based on content length and difficulty. Actual time varies by person. System learns from your ratings.

**Q: Can I pause a plan?**
A: Yes, update plan status to "Paused". Sessions won't appear in today's list.

**Q: What's the difference between Learn and Review sessions?**
A: Learn = first time studying. Review = revisiting after initial learning (spaced repetition).

**Q: Why are some sessions marked as Practice?**
A: Practice sessions focus on applying knowledge, usually after learning related topics.

**Q: Can I export my study plan?**
A: Not yet, but coming soon. You can screenshot the weekly schedule for now.

**Q: Is my study data private?**
A: Yes, everything is stored in your local database. Only AI API calls send content for analysis.

## 🆘 Getting Help

If you're still having issues:

1. **Check System Status**
   - API running on port 5055
   - Database connected
   - No errors in browser console (F12)

2. **Check Logs**
   - Backend logs show AI generation process
   - Look for "Generating plan for notebook" messages
   - Check for errors during topic extraction

3. **Report Issues**
   - Include: notebook ID, plan ID, error messages
   - Describe what you expected vs. what happened
   - Share relevant logs (remove sensitive data)

4. **Community Support**
   - Join Discord server for help
   - Check GitHub issues for similar problems
   - Share your use case for feedback

---

**Remember**: The Study Planner works best when you:
- ✅ Add quality, text-based sources to notebooks
- ✅ Set realistic deadlines and daily hours
- ✅ Actually follow the schedule (even when you don't want to!)
- ✅ Rate your sessions honestly for better adaptation
- ✅ Review regularly using the spaced repetition system

Happy studying! 📚🎓
