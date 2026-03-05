import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSessions, getStudio } from '../lib/api';
import type { PracticeSession, Studio } from '../lib/types';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s > 0 ? `${s}s` : ''}`;
}

function getCompletionStatus(session: PracticeSession): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  if (session.completedAt) {
    return {
      label: 'Completed',
      color: 'text-teal-500 bg-teal-50',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    };
  }
  return {
    label: 'In Progress',
    color: 'text-warm-500 bg-warm-50',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  };
}

export default function SessionHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const [studio, setStudio] = useState<Studio | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [studioData, sessionData] = await Promise.all([
          getStudio(id),
          getSessions(id).catch(() => []),
        ]);
        setStudio(studioData);
        setSessions(sessionData);
      } catch (err) {
        console.error('Failed to load sessions:', err);
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

  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        to={`/studios/${id}/progress`}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to progress
      </Link>

      <h1 className="text-2xl font-extrabold text-gray-800">Session History</h1>

      {sortedSessions.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7 text-primary-400" />
          </div>
          <p className="text-gray-500 font-medium">No sessions yet</p>
          <p className="text-sm text-gray-400">
            Start practicing to see your session history
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedSessions.map((session, i) => {
            const status = getCompletionStatus(session);
            const isExpanded = expandedId === session.id;
            const date = new Date(session.startedAt);

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : session.id)
                  }
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-gray-800 text-sm">
                        {date.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <span className="text-xs text-gray-400">
                        {date.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(session.durationSeconds)}
                      </span>
                      {session.chart && (
                        <span className="truncate">{session.chart.title}</span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${status.color}`}
                  >
                    {status.icon}
                    {status.label}
                  </span>

                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-2">
                        <DetailRow label="Chart" value={session.chart?.title || 'Unknown'} />
                        <DetailRow
                          label="Duration"
                          value={formatDuration(session.durationSeconds)}
                        />
                        <DetailRow
                          label="Target"
                          value={`${Math.floor(session.timerTargetSeconds / 60)} min`}
                        />
                        <DetailRow
                          label="Started"
                          value={date.toLocaleString()}
                        />
                        {session.completedAt && (
                          <DetailRow
                            label="Completed"
                            value={new Date(session.completedAt).toLocaleString()}
                          />
                        )}
                        {session.checkoffs && (
                          <DetailRow
                            label="Checkoffs"
                            value={`${session.checkoffs.length} items`}
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-400 font-medium">{label}</span>
      <span className="text-gray-700 font-semibold">{value}</span>
    </div>
  );
}
