import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Flame, BarChart3, History, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getProgress, getStudio } from '../lib/api';
import type { ProgressStats, Studio } from '../lib/types';

export default function ProgressPage() {
  const { id } = useParams<{ id: string }>();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [studioData, progressData] = await Promise.all([
          getStudio(id),
          getProgress(id).catch(() => null),
        ]);
        setStudio(studioData);
        setStats(progressData);
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
