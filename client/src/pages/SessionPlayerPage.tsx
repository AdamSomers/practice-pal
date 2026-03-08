import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getChart,
  startSession,
  checkoffItem,
  uncheckItem,
  completeSession,
} from '../lib/api';
import type { ChartItem, PracticeChart, PracticeSession, SessionCheckoff } from '../lib/types';
import { initAudio } from '../lib/sounds';
import TimerBar from '../components/session/TimerBar';
import CheckboxGrid from '../components/session/CheckboxGrid';
import ProgressIndicator from '../components/session/ProgressIndicator';
import SessionComplete from '../components/session/SessionComplete';
import Metronome from '../components/session/Metronome';

interface CheckState {
  [itemId: string]: Map<number, string>; // repNumber -> checkoffId
}

export default function SessionPlayerPage() {
  const { id: chartId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [chart, setChart] = useState<(PracticeChart & { items: ChartItem[] }) | null>(null);
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [checkState, setCheckState] = useState<CheckState>({});
  const [loading, setLoading] = useState(true);
  const hasTimerTarget = (chart?.minimumPracticeMinutes ?? 0) > 0;
  const [timerMet, setTimerMet] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showMetronome, setShowMetronome] = useState(false);
  const audioInitRef = useRef(false);

  // Load chart and start session
  useEffect(() => {
    if (!chartId) return;
    (async () => {
      try {
        const chartData = await getChart(chartId);
        setChart(chartData);

        const sessionData = await startSession(chartId);
        setSession(sessionData);

        // Initialize check state
        const initial: CheckState = {};
        for (const item of chartData.items) {
          initial[item.id] = new Map();
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

      try {
        const checkoff = await checkoffItem(session.id, {
          chartItemId: itemId,
          repetitionNumber: repNum,
        });
        setCheckState((prev) => {
          const next = { ...prev };
          const map = new Map(next[itemId]);
          map.set(repNum, checkoff.id);
          next[itemId] = map;
          return next;
        });
      } catch (err) {
        console.error('Failed to check item:', err);
      }
    },
    [session, handleFirstInteraction]
  );

  const handleUncheck = useCallback(
    async (itemId: string, repNum: number) => {
      if (!session) return;
      const checkoffId = checkState[itemId]?.get(repNum);
      if (!checkoffId) return;

      try {
        await uncheckItem(session.id, checkoffId);
        setCheckState((prev) => {
          const next = { ...prev };
          const map = new Map(next[itemId]);
          map.delete(repNum);
          next[itemId] = map;
          return next;
        });
      } catch (err) {
        console.error('Failed to uncheck item:', err);
      }
    },
    [session, checkState]
  );

  const handleComplete = useCallback(async () => {
    if (!session) return;
    try {
      await completeSession(session.id, elapsed);
      setIsComplete(true);
    } catch (err) {
      console.error('Failed to complete session:', err);
      // Still show completion
      setIsComplete(true);
    }
  }, [session, elapsed]);

  // Calculate progress
  const totalCheckboxes = chart
    ? chart.items.reduce((sum, item) => sum + item.repetitions, 0)
    : 0;
  const checkedCount = Object.values(checkState).reduce(
    (sum, map) => sum + map.size,
    0
  );
  const percentage = totalCheckboxes > 0 ? (checkedCount / totalCheckboxes) * 100 : 0;

  // Check if all items are complete
  const allComplete =
    chart?.items.every(
      (item) => (checkState[item.id]?.size ?? 0) === item.repetitions
    ) ?? false;

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
      (item) => (checkState[item.id]?.size ?? 0) === item.repetitions
    ).length;
    return (
      <SessionComplete
        durationSeconds={elapsed}
        itemsCompleted={itemsCompleted}
        totalItems={chart.items.length}
        onDone={() => navigate(`/studios/${chart.studioId}`)}
      />
    );
  }

  const targetSeconds = (chart.minimumPracticeMinutes || 0) * 60;
  const sortedItems = [...chart.items].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-4 pb-8" onClick={handleFirstInteraction}>
      {/* Back */}
      <button
        onClick={() => navigate(`/studios/${chart.studioId}`)}
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
        />
      ) : (
        <TimerBar
          targetSeconds={0}
          isRunning={true}
          onTimeUpdate={setElapsed}
        />
      )}

      {/* Practice items */}
      <div className="space-y-3">
        {sortedItems.map((item) => {
          const otherItemsComplete = chart.items
            .filter((i) => i.id !== item.id)
            .every(
              (i) => (checkState[i.id]?.size ?? 0) === i.repetitions
            );

          return (
            <CheckboxGrid
              key={item.id}
              itemId={item.id}
              category={item.category}
              config={item.config}
              repetitions={item.repetitions}
              checked={new Set(checkState[item.id]?.keys() ?? [])}
              onCheck={(repNum) => handleCheck(item.id, repNum)}
              onUncheck={(repNum) => handleUncheck(item.id, repNum)}
              timerMet={timerMet}
              allOtherItemsComplete={otherItemsComplete}
            />
          );
        })}
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
    </div>
  );
}
