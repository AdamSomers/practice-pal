import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Flame, BarChart3, History, Award, Plus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getProgress, getStudio, getSessionRewards, getGoals, createGoal, completeGoal, deleteGoal } from '../lib/api';
import type { ProgressStats, Studio, SessionReward, Goal } from '../lib/types';
import RewardGrid from '../components/rewards/RewardGrid';
import GoalCard from '../components/goals/GoalCard';
import GoalForm from '../components/goals/GoalForm';
import GoalRewardReveal from '../components/goals/GoalRewardReveal';

export default function ProgressPage() {
  const { id } = useParams<{ id: string }>();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [rewards, setRewards] = useState<SessionReward[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [showCompletedGoals, setShowCompletedGoals] = useState(false);
  const [celebratingGoal, setCelebratingGoal] = useState<Goal | null>(null);

  const canEdit = studio?.role === 'owner' || studio?.role === 'editor';

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [studioData, progressData, rewardsData, goalsData] = await Promise.all([
          getStudio(id),
          getProgress(id).catch(() => null),
          getSessionRewards(id).catch(() => []),
          getGoals(id).catch(() => []),
        ]);
        setStudio(studioData);
        setStats(progressData);
        setRewards(rewardsData);
        setGoals(goalsData);
      } catch (err) {
        console.error('Failed to load progress:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Default data if stats not available
  const progressData = stats || {
    totalPracticeMinutes: 0,
    sessionCount: 0,
    currentStreak: 0,
    weeklyData: [
      { day: 'Mon', minutes: 0 },
      { day: 'Tue', minutes: 0 },
      { day: 'Wed', minutes: 0 },
      { day: 'Thu', minutes: 0 },
      { day: 'Fri', minutes: 0 },
      { day: 'Sat', minutes: 0 },
      { day: 'Sun', minutes: 0 },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to={`/studios/${id}`}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {studio?.name || 'studio'}
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-800">Progress</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mx-auto mb-2">
            <Clock className="w-5 h-5 text-primary-600" />
          </div>
          <p className="text-2xl font-extrabold text-gray-800">
            {progressData.totalPracticeMinutes}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase">
            Total Minutes
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-400/10 flex items-center justify-center mx-auto mb-2">
            <BarChart3 className="w-5 h-5 text-teal-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-800">
            {progressData.sessionCount}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase">
            Sessions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center mx-auto mb-2">
            <Flame className="w-5 h-5 text-warm-500" />
          </div>
          <p className="text-2xl font-extrabold text-gray-800">
            {progressData.currentStreak}
          </p>
          <p className="text-[10px] font-semibold text-gray-400 uppercase">
            Day Streak
          </p>
        </motion.div>
      </div>

      {/* Weekly chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-5"
      >
        <h2 className="text-lg font-bold text-gray-800 mb-4">This Week</h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={progressData.weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f4" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                }}
                labelStyle={{ fontWeight: 'bold', color: '#374151' }}
                formatter={(value: number) => [`${value} min`, 'Practice']}
              />
              <Bar
                dataKey="minutes"
                fill="#8b5cf6"
                radius={[6, 6, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* My Rewards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-5"
      >
        <h2 className="text-lg font-bold text-gray-800 mb-3">My Rewards</h2>
        <RewardGrid rewards={rewards} />
      </motion.div>

      {/* Goals */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Goals</h2>
          {canEdit && (
            <button
              onClick={() => setShowGoalForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm font-semibold hover:bg-primary-200 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Goal
            </button>
          )}
        </div>

        {(() => {
          const activeGoals = goals.filter(g => !g.completedAt);
          const completedGoals = goals.filter(g => g.completedAt);

          return (
            <>
              {activeGoals.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-3">
                  {canEdit ? 'Set a goal to motivate practice!' : 'No active goals yet.'}
                </p>
              )}
              <div className="space-y-2">
                {activeGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    canEdit={canEdit}
                    onComplete={async (goalId) => {
                      try {
                        const updated = await completeGoal(goalId);
                        setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
                        setCelebratingGoal(updated);
                      } catch (err) {
                        console.error('Failed to complete goal:', err);
                      }
                    }}
                    onDelete={async (goalId) => {
                      try {
                        await deleteGoal(goalId);
                        setGoals(prev => prev.filter(g => g.id !== goalId));
                      } catch (err) {
                        console.error('Failed to delete goal:', err);
                      }
                    }}
                  />
                ))}
              </div>

              {completedGoals.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowCompletedGoals(!showCompletedGoals)}
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${showCompletedGoals ? 'rotate-180' : ''}`} />
                    {completedGoals.length} completed
                  </button>
                  <AnimatePresence>
                    {showCompletedGoals && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-2 mt-2"
                      >
                        {completedGoals.map(goal => (
                          <GoalCard
                            key={goal.id}
                            goal={goal}
                            canEdit={false}
                            onComplete={() => {}}
                            onDelete={() => {}}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          );
        })()}
      </motion.div>

      {/* Goal form modal */}
      <AnimatePresence>
        {showGoalForm && id && (
          <GoalForm
            studioId={id}
            onSubmit={async (data) => {
              try {
                const goal = await createGoal({ ...data, studioId: id });
                setGoals(prev => [goal, ...prev]);
                setShowGoalForm(false);
              } catch (err) {
                console.error('Failed to create goal:', err);
              }
            }}
            onClose={() => setShowGoalForm(false)}
          />
        )}
      </AnimatePresence>

      {/* Goal reward celebration */}
      <AnimatePresence>
        {celebratingGoal && (
          <GoalRewardReveal
            goal={celebratingGoal}
            onDismiss={() => setCelebratingGoal(null)}
          />
        )}
      </AnimatePresence>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          to={`/studios/${id}/sessions`}
          className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <History className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Session History</p>
            <p className="text-xs text-gray-400">View all sessions</p>
          </div>
        </Link>
        <Link
          to={`/studios/${id}`}
          className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center">
            <Award className="w-5 h-5 text-warm-500" />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">Mastery Log</p>
            <p className="text-xs text-gray-400">View mastered items</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
