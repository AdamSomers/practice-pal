import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getChart,
  getSession,
  getStudio,
  startSession,
  checkoffItem,
  uncheckItem,
  completeSession,
  claimSessionReward,
} from '../lib/api';
import type { SessionReward, Studio } from '../lib/types';
import type { ChartItem, PracticeChart, PracticeSession, SessionCheckoff } from '../lib/types';
import { initAudio } from '../lib/sounds';
import TimerBar from '../components/session/TimerBar';
import CheckboxGrid, { getTotalCheckboxes } from '../components/session/CheckboxGrid';
import ProgressIndicator from '../components/session/ProgressIndicator';
import SessionComplete from '../components/session/SessionComplete';
import RewardReveal from '../components/rewards/RewardReveal';
import Metronome from '../components/session/Metronome';

interface CheckState {
  [itemId: string]: Map<number, string>; // repNumber -> checkoffId
}

export default function SessionPlayerPage() {
  const { id: chartId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [chart, setChart] = useState<(PracticeChart & { items: ChartItem[] }) | null>(null);
  const [studio, setStudio] = useState<Studio | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [checkState, setCheckState] = useState<CheckState>({});
  const [loading, setLoading] = useState(true);
  const hasTimerTarget = (chart?.minimumPracticeMinutes ?? 0) > 0;
  const [timerMet, setTimerMet] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showMetronome, setShowMetronome] = useState(false);
  const [reward, setReward] = useState<SessionReward | null>(null);
  const [phase, setPhase] = useState<'playing' | 'celebration' | 'reward'>('playing');
  const [confirmEnd, setConfirmEnd] = useState(false);
  const audioInitRef = useRef(false);

  // Load chart and start or resume session
  useEffect(() => {
    if (!chartId) return;
    (async () => {
      try {
        const chartData = await getChart(chartId);
        setChart(chartData);
        getStudio(chartData.studioId).then(setStudio).catch(() => {});

        // Try to resume an existing session from localStorage
        const sessionKey = `pp_active_session_${chartId}`;
        const savedSessionId = localStorage.getItem(sessionKey);
        let sessionData: PracticeSession | null = null;
        let existingCheckoffs: import('../lib/types').SessionCheckoff[] = [];

        if (savedSessionId) {
          try {
            const resumed = await getSession(savedSessionId);
            if (!resumed.completedAt) {
              sessionData = resumed;
              existingCheckoffs = resumed.checkoffs || [];
            } else {
              localStorage.removeItem(sessionKey);
            }
          } catch {
            localStorage.removeItem(sessionKey);
          }
        }

        if (!sessionData) {
          sessionData = await startSession(chartId);
          localStorage.setItem(sessionKey, sessionData.id);
        }

        setSession(sessionData);

        // Initialize check state, restoring any existing checkoffs
        const initial: CheckState = {};
        for (const item of chartData.items) {
          initial[item.id] = new Map();
        }
        for (const checkoff of existingCheckoffs) {
          if (initial[checkoff.chartItemId]) {
            initial[checkoff.chartItemId].set(checkoff.repetitionNumber, checkoff.id);
          }
        }
        setCheckState(initial);
      } catch (err) {
        console.error('Failed to start session:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [chartId]);

  // If no timer target, mark timer as met immediately
  useEffect(() => {
    if (chart && !hasTimerTarget) {
      setTimerMet(true);
    }
  }, [chart, hasTimerTarget]);

  // Init audio on first interaction
  const handleFirstInteraction = useCallback(() => {
    if (!audioInitRef.current) {
      audioInitRef.current = true;
      initAudio();
    }
  }, []);

  const handleCheck = useCallback(
    async (itemId: string, repNum: number) => {
      handleFirstInteraction();
      if (!session) return;

      // Optimistic update
      const tempId = `pending_${Date.now()}`;
      setCheckState((prev) => {
        const next = { ...prev };
        const map = new Map(next[itemId]);
        map.set(repNum, tempId);
        next[itemId] = map;
        return next;
      });

      try {
        const checkoff = await checkoffItem(session.id, {
          chartItemId: itemId,
          repetitionNumber: repNum,
        });
        // Replace temp ID with real ID
        setCheckState((prev) => {
          const next = { ...prev };
          const map = new Map(next[itemId]);
          if (map.get(repNum) === tempId) {
            map.set(repNum, checkoff.id);
          }
          next[itemId] = map;
          return next;
        });
      } catch (err) {
        console.error('Failed to check item:', err);
        // Rollback
        setCheckState((prev) => {
          const next = { ...prev };
          const map = new Map(next[itemId]);
          if (map.get(repNum) === tempId) {
            map.delete(repNum);
          }
          next[itemId] = map;
          return next;
        });
      }
    },
    [session, handleFirstInteraction]
  );

  const handleUncheck = useCallback(
    async (itemId: string, repNum: number) => {
      if (!session) return;
      const checkoffId = checkState[itemId]?.get(repNum);
      if (!checkoffId) return;

      // Optimistic update
      setCheckState((prev) => {
        const next = { ...prev };
        const map = new Map(next[itemId]);
        map.delete(repNum);
        next[itemId] = map;
        return next;
      });

      try {
        await uncheckItem(session.id, checkoffId);
      } catch (err) {
        console.error('Failed to uncheck item:', err);
        // Rollback
        setCheckState((prev) => {
          const next = { ...prev };
          const map = new Map(next[itemId]);
          map.set(repNum, checkoffId);
          next[itemId] = map;
          return next;
        });
      }
    },
    [session, checkState]
  );

  const handleComplete = useCallback(async () => {
    if (!session || !chart) return;
    try {
      await completeSession(session.id, elapsed);
      localStorage.removeItem(`pp_active_session_${chart.id}`);
      setIsComplete(true);
      setPhase('celebration');
      // Claim reward in background
      try {
        const r = await claimSessionReward(session.id);
        setReward(r);
      } catch {
        // Reward claim failed, still show celebration
      }
    } catch (err) {
      console.error('Failed to complete session:', err);
      setIsComplete(true);
      setPhase('celebration');
    }
  }, [session, elapsed, chart]);

  // Calculate progress (accounts for sections mode)
  const totalCheckboxes = chart
    ? chart.items.reduce((sum, item) => sum + getTotalCheckboxes(item.config, item.repetitions), 0)
    : 0;
  const checkedCount = Object.values(checkState).reduce(
    (sum, map) => sum + map.size,
    0
  );
  const percentage = totalCheckboxes > 0 ? (checkedCount / totalCheckboxes) * 100 : 0;

  // Check if all items are complete (accounts for sections mode)
  const allComplete =
    chart?.items.every((item) => {
      const expected = getTotalCheckboxes(item.config, item.repetitions);
      return (checkState[item.id]?.size ?? 0) === expected;
    }) ?? false;

  // Auto-complete when everything is done and timer met
  useEffect(() => {
    if (allComplete && timerMet && !isComplete) {
      handleComplete();
    }
  }, [allComplete, timerMet, isComplete, handleComplete]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!chart || !session) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Could not load practice session</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-primary-600 font-semibold"
        >
          Go back
        </button>
      </div>
    );
  }

  if (isComplete) {
    const itemsCompleted = chart.items.filter(
      (item) => (checkState[item.id]?.size ?? 0) === getTotalCheckboxes(item.config, item.repetitions)
    ).length;

    if (phase === 'reward' && reward) {
      return (
        <RewardReveal
          emoji={reward.emoji}
          category={reward.category}
          onCollect={() => navigate(`/studios/${chart.studioId}`)}
        />
      );
    }

    return (
      <SessionComplete
        durationSeconds={elapsed}
        itemsCompleted={itemsCompleted}
        totalItems={chart.items.length}
        onDone={() => {
          if (reward) {
            setPhase('reward');
          } else {
            navigate(`/studios/${chart.studioId}`);
          }
        }}
      />
    );
  }

  const targetSeconds = (chart.minimumPracticeMinutes || 0) * 60;
  const sortedItems = [...chart.items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4 pb-8" onClick={handleFirstInteraction}>
      {/* Back */}
      <button
        onClick={() => setConfirmEnd(true)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        End session
      </button>

      <h1 className="text-xl font-extrabold text-gray-800">{chart.title}</h1>

      {/* Timer */}
      {hasTimerTarget ? (
        <TimerBar
          targetSeconds={targetSeconds}
          isRunning={true}
          onTimeUpdate={setElapsed}
          onTargetReached={() => setTimerMet(true)}
          pausable={studio?.allowPausing ?? true}
        />
      ) : (
        <TimerBar
          targetSeconds={0}
          isRunning={true}
          onTimeUpdate={setElapsed}
          pausable={studio?.allowPausing ?? true}
        />
      )}

      {/* Encourage continued practice when all checked but timer not met */}
      {allComplete && !timerMet && hasTimerTarget && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center px-4 py-3 bg-primary-50 border border-primary-200 rounded-xl"
        >
          <p className="text-sm font-semibold text-primary-700">
            Great work! Keep practicing until the timer finishes.
          </p>
          <p className="text-xs text-primary-500 mt-0.5">
            Review tricky spots, play through again, or try a faster tempo.
          </p>
        </motion.div>
      )}

      {/* Practice items */}
      <div className="space-y-3">
        {sortedItems.map((item) => (
          <CheckboxGrid
            key={item.id}
            itemId={item.id}
            category={item.category}
            config={item.config}
            repetitions={item.repetitions}
            checked={new Set(checkState[item.id]?.keys() ?? [])}
            onCheck={(repNum) => handleCheck(item.id, repNum)}
            onUncheck={(repNum) => handleUncheck(item.id, repNum)}
          />
        ))}
      </div>

      {/* Progress */}
      <ProgressIndicator percentage={percentage} />

      {/* Done button - when timer is met */}
      {timerMet && !allComplete && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={handleComplete}
          className="w-full px-6 py-3.5 bg-teal-500 text-white rounded-xl font-bold shadow-md hover:bg-teal-600 transition-colors"
        >
          Finish Session
        </motion.button>
      )}

      {/* Metronome FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowMetronome(!showMetronome)}
        className={`fixed bottom-24 right-4 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full shadow-lg flex items-center justify-center z-30 transition-colors ${
          showMetronome
            ? 'bg-primary-700 text-white'
            : 'bg-primary-600 text-white'
        }`}
      >
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v6" />
          <path d="M6 20h12" />
          <path d="M8 20l2-14h4l2 14" />
          <circle cx="12" cy="8" r="1" fill="currentColor" />
          <line x1="12" y1="8" x2="16" y2="4" />
        </svg>
      </motion.button>

      {/* Metronome panel */}
      <Metronome isOpen={showMetronome} onClose={() => setShowMetronome(false)} />

      {/* End session confirmation */}
      <AnimatePresence>
        {confirmEnd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4"
            onClick={() => setConfirmEnd(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-1">End this session?</h3>
              <p className="text-sm text-gray-500 mb-5">
                Your progress is saved. You can come back to resume it later.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmEnd(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Keep practicing
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem(`pp_active_session_${chart.id}`);
                    navigate(`/studios/${chart.studioId}`);
                  }}
                  className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  End session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
