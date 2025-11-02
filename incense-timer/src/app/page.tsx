"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, Pause, Play, RefreshCw, Quote } from "lucide-react";

const STORAGE_KEY = "kodou-timer-history-v1";
const DEFAULT_DURATION = 25 * 60; // 25 minutes in seconds

interface SessionRecord {
  id: string;
  startedAt: number;
  endedAt: number;
  duration: number;
}

interface QuoteEntry {
  text: string;
  author: string;
}

const QUOTES: QuoteEntry[] = [
  {
    text: "Wherever you are, be all there.",
    author: "Jim Elliot"
  },
  {
    text: "The fragrance of flowers spreads only in the direction of the wind. But the goodness of a person spreads in all directions.",
    author: "Chanakya"
  },
  {
    text: "Each moment is all we need, not more.",
    author: "Mother Teresa"
  },
  {
    text: "One incense stick can change the air of a room. One focused session can transform a day.",
    author: "Unknown"
  },
  {
    text: "Silence isn’t empty, it’s full of answers.",
    author: "Zen Proverb"
  },
  {
    text: "Simplicity is the keynote of all true elegance.",
    author: "Coco Chanel"
  }
];

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function buildSessionRecord(durationInSeconds: number): SessionRecord {
  const endedAt = Date.now();
  return {
    id: `${endedAt}`,
    startedAt: endedAt - durationInSeconds * 1000,
    endedAt,
    duration: durationInSeconds
  };
}

function loadHistory(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: SessionRecord[] = JSON.parse(raw);
    return parsed
      .filter((entry) => typeof entry.endedAt === "number" && typeof entry.duration === "number")
      .sort((a, b) => b.endedAt - a.endedAt);
  } catch (error) {
    console.error("Failed to parse history", error);
    return [];
  }
}

function persistHistory(history: SessionRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function useBellChime() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const trigger = async () => {
    try {
      const context =
        audioContextRef.current ?? new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = context;

      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, context.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 2.4);

      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(523.25, context.currentTime + 1.8);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 2.5);
    } catch (error) {
      console.error("Failed to play chime", error);
    }
  };

  return trigger;
}

export default function Home() {
  const [totalDuration, setTotalDuration] = useState(DEFAULT_DURATION);
  const [remaining, setRemaining] = useState(DEFAULT_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const chime = useBellChime();

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    persistHistory(history);
  }, [history]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsRunning(false);
          setHistory((prevHistory) => {
            const nextHistory = [buildSessionRecord(totalDuration), ...prevHistory].slice(0, 20);
            persistHistory(nextHistory);
            return nextHistory;
          });
          chime();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isRunning, totalDuration, chime]);

  const progress = useMemo(() => 1 - remaining / totalDuration, [remaining, totalDuration]);

  const todaysQuote = useMemo(() => {
    const dayIndex = new Date().toISOString().slice(0, 10);
    const hash = dayIndex.split("-").reduce((acc, part) => acc + parseInt(part, 10), 0);
    return QUOTES[hash % QUOTES.length];
  }, []);

  const handleStart = () => {
    if (remaining <= 0) {
      setRemaining(totalDuration);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setRemaining(totalDuration);
  };

  const handleDurationChange = (value: number) => {
    setTotalDuration(value);
    setRemaining(value);
    setIsRunning(false);
  };

  const totalMinutes = Math.max(5, Math.round(totalDuration / 60));

  return (
    <main className="min-h-screen px-4 pb-16 pt-12 sm:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-12">
        <header className="flex flex-col gap-4 text-center sm:text-left">
          <span className="text-xs uppercase tracking-[0.4em] text-incense-ash/70">Kōdō Focus</span>
          <h1 className="text-4xl font-light tracking-tight text-incense-smoke sm:text-5xl">
            Incense Session Timer
          </h1>
          <p className="text-sm text-incense-ash/80 sm:text-base">
            Light a virtual incense stick, let the smoke rise, and devote yourself fully to the present task.
          </p>
        </header>

        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="smoke-glow rounded-3xl border border-white/5 bg-white/5 backdrop-blur-lg">
            <div className="flex flex-col gap-6 p-6 sm:p-10">
              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-incense-ash/80">Current Stick</p>
                  <h2 className="text-2xl font-light text-incense-smoke sm:text-3xl">
                    {formatTime(remaining)} remaining
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 text-incense-smoke transition hover:border-incense-ember/60 hover:bg-incense-ember/20"
                    onClick={isRunning ? handlePause : handleStart}
                  >
                    {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/5 bg-white/5 text-incense-ash/80 transition hover:border-incense-ember/30 hover:bg-incense-ember/10"
                    onClick={handleReset}
                  >
                    <RefreshCw className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="tracking-[0.35em] text-incense-ash/70">Ignite</span>
                <span className="tracking-[0.35em] text-incense-ash/70">Ash</span>
              </div>

              <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-[#1e1814] via-[#171310] to-[#0f0d0b] shadow-incense">
                <div className="absolute inset-0 flex flex-col items-center">
                  <div className="relative flex h-full w-1 origin-bottom overflow-hidden rounded-full bg-incense-ember/80">
                    <motion.div
                      key={totalDuration}
                      className="absolute bottom-0 w-full bg-gradient-to-t from-[#b2855f] via-[#e6cbb0] to-transparent"
                      animate={{ height: `${(1 - progress) * 100}%` }}
                      transition={{ duration: 0.6, ease: "easeInOut" }}
                    />
                    <div className="absolute bottom-0 h-1.5 w-5 -translate-x-2 rounded-full bg-[#d3aa82]/80" />
                  </div>
                  <AnimatePresence>
                    {isRunning && remaining > 0 && (
                      <motion.div
                        className="absolute bottom-8 flex flex-col items-center gap-2"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.span
                          className="h-16 w-16 rounded-full bg-incense-ember/10"
                          animate={{ scale: [1, 1.08, 1] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-3">
                  {[...Array(3)].map((_, idx) => (
                    <motion.div
                      key={idx}
                      className="h-12 w-12 rounded-full border border-white/5 bg-white/5"
                      animate={{ opacity: [0.1, 0.4, 0.1], y: [0, -14, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 6 + idx,
                        delay: idx * 1.8,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="duration" className="text-xs uppercase tracking-[0.35em] text-incense-ash/70">
                  Stick length (minutes)
                </label>
                <input
                  id="duration"
                  type="range"
                  min={5}
                  max={60}
                  step={5}
                  value={totalMinutes}
                  onChange={(event) => handleDurationChange(Number(event.target.value) * 60)}
                  className="accent-incense-ember"
                />
                <p className="text-xs text-incense-ash/70">
                  {totalMinutes} minute {totalMinutes === 1 ? "stick" : "stick"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <section className="rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-lg sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-incense-ember/15 text-incense-ember">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-incense-smoke">Ash Garden</h3>
                  <p className="text-xs text-incense-ash/70">Recent sessions gathered as quiet piles.</p>
                </div>
              </div>

              <div className="flex max-h-72 flex-col gap-4 overflow-y-auto pr-2 scrollbar-thin">
                {history.length === 0 ? (
                  <p className="text-sm text-incense-ash/60">No incense burned yet. Begin your first session.</p>
                ) : (
                  history.map((session, index) => {
                    const minutes = Math.round(session.duration / 60);
                    const relativeHeight = Math.min(100, (session.duration / (60 * 60)) * 120 + 20);
                    const sessionDate = new Date(session.endedAt);

                    return (
                      <div
                        key={session.id}
                        className="relative flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4"
                      >
                        <div className="relative flex h-20 w-16 items-end justify-center">
                          <div
                            className="w-12 rounded-t-3xl bg-gradient-to-t from-[#65503d] via-[#a6896b] to-[#f2e5d4]"
                            style={{ height: `${relativeHeight}%`, maxHeight: "100%" }}
                          />
                          <motion.div
                            className="absolute -bottom-2 h-5 w-14 rounded-full bg-incense-ash/70 opacity-60"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 0.6, scale: 1 }}
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <p className="text-sm font-medium text-incense-smoke">
                            {minutes} minute {minutes === 1 ? "session" : "session"}
                          </p>
                          <p className="text-xs text-incense-ash/60">
                            Burned on {sessionDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            {" at "}
                            {sessionDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.35em] text-incense-ash/60">
                          #{index + 1}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/5 bg-white/5 p-6 backdrop-blur-lg sm:p-8">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-incense-ember/15 text-incense-ember">
                  <Quote className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-incense-smoke">Daily Reflection</h3>
                  <p className="text-xs text-incense-ash/70">A short verse for morning focus.</p>
                </div>
              </div>

              <blockquote className="rounded-2xl border border-white/5 bg-black/30 p-6 text-sm text-incense-smoke">
                <p className="italic">
                  “{todaysQuote.text}”
                </p>
                <footer className="mt-3 text-xs uppercase tracking-[0.35em] text-incense-ash/60">
                  {todaysQuote.author}
                </footer>
              </blockquote>

              <details className="mt-6 overflow-hidden rounded-xl border border-white/5 bg-black/20">
                <summary className="cursor-pointer list-none px-4 py-3 text-xs uppercase tracking-[0.35em] text-incense-ash/70">
                  Archive
                </summary>
                <div className="flex max-h-40 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-2 text-xs text-incense-ash/80 scrollbar-thin">
                  {QUOTES.map((quote, idx) => (
                    <div key={`${quote.author}-${idx}`} className="rounded-lg bg-white/5 p-3">
                      <p className="italic">“{quote.text}”</p>
                      <p className="mt-2 text-[10px] uppercase tracking-[0.35em] text-incense-ash/60">
                        {quote.author}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
