import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, X } from 'lucide-react';

interface MetronomeProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TEMPOS = [60, 72, 80, 92, 100, 108, 120, 132, 144];

export default function Metronome({ isOpen, onClose }: MetronomeProps) {
  const [bpm, setBpm] = useState(100);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0);
  const timerIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const bpmRef = useRef(bpm);
  const [pendulumAngle, setPendulumAngle] = useState(0);
  const tapTimesRef = useRef<number[]>([]);

  bpmRef.current = bpm;

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playClick = useCallback(
    (time: number) => {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, time);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + 0.05);
    },
    [getAudioContext]
  );

  const scheduler = useCallback(() => {
    const ctx = getAudioContext();
    const scheduleAheadTime = 0.1;
    const lookahead = 25; // ms

    while (
      nextNoteTimeRef.current <
      ctx.currentTime + scheduleAheadTime
    ) {
      playClick(nextNoteTimeRef.current);
      const secondsPerBeat = 60.0 / bpmRef.current;
      nextNoteTimeRef.current += secondsPerBeat;
    }

    if (isPlayingRef.current) {
      timerIdRef.current = window.setTimeout(scheduler, lookahead);
    }
  }, [getAudioContext, playClick]);

  const startMetronome = useCallback(() => {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    isPlayingRef.current = true;
    nextNoteTimeRef.current = ctx.currentTime;
    setIsPlaying(true);
    scheduler();
  }, [getAudioContext, scheduler]);

  const stopMetronome = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (timerIdRef.current !== null) {
      clearTimeout(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  // Pendulum animation
  useEffect(() => {
    if (!isPlaying) {
      setPendulumAngle(0);
      return;
    }
    const interval = (60 / bpm) * 1000;
    let direction = 1;
    const tick = () => {
      setPendulumAngle((prev) => {
        direction = prev >= 25 ? -1 : prev <= -25 ? 1 : direction;
        return prev + direction * 2;
      });
    };
    const id = setInterval(tick, interval / 25);
    return () => clearInterval(id);
  }, [isPlaying, bpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMetronome();
    };
  }, [stopMetronome]);

  const handleTapTempo = () => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    // Keep only last 5 taps
    if (tapTimesRef.current.length > 5) {
      tapTimesRef.current = tapTimesRef.current.slice(-5);
    }
    if (tapTimesRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      const avgInterval =
        intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      if (newBpm >= 30 && newBpm <= 300) {
        setBpm(newBpm);
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-20 right-4 lg:bottom-8 lg:right-8 bg-white rounded-2xl shadow-xl border border-gray-200 p-5 w-72 z-40"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-gray-800">Metronome</h3>
            <button
              onClick={() => {
                stopMetronome();
                onClose();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pendulum */}
          <div className="flex justify-center mb-3 h-12">
            <div
              className="w-1 h-12 bg-primary-400 rounded-full origin-top transition-transform"
              style={{
                transform: `rotate(${pendulumAngle}deg)`,
                transitionDuration: isPlaying
                  ? `${60 / bpm / 25}s`
                  : '0.3s',
              }}
            >
              <div className="w-4 h-4 rounded-full bg-primary-600 -ml-[7px] mt-9" />
            </div>
          </div>

          {/* BPM display and controls */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <button
              onClick={() => setBpm((b) => Math.max(30, b - 1))}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-3xl font-extrabold text-gray-800 tabular-nums">
                {bpm}
              </span>
              <p className="text-[10px] font-semibold text-gray-400 uppercase">
                BPM
              </p>
            </div>
            <button
              onClick={() => setBpm((b) => Math.min(300, b + 1))}
              className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* BPM slider */}
          <input
            type="range"
            min={30}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
            className="w-full mb-3 accent-primary-600"
          />

          {/* Preset tempos */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESET_TEMPOS.map((tempo) => (
              <button
                key={tempo}
                onClick={() => setBpm(tempo)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  bpm === tempo
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tempo}
              </button>
            ))}
          </div>

          {/* Tap tempo */}
          <button
            onClick={handleTapTempo}
            className="w-full px-4 py-2 bg-primary-50 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-100 transition-colors mb-3"
          >
            Tap Tempo
          </button>

          {/* Start/Stop */}
          <button
            onClick={isPlaying ? stopMetronome : startMetronome}
            className={`w-full px-4 py-3 rounded-xl font-bold transition-colors ${
              isPlaying
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isPlaying ? 'Stop' : 'Start'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
