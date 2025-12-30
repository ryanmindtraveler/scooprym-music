'use client';

import { cn } from '@/lib/utils';
import {
  Activity,
  Bell,
  Circle,
  Disc,
  Drum,
  Hand,
  Hexagon,
  type LucideIcon,
  Megaphone,
  MousePointerClick,
  Music,
  Speaker,
  Star,
  Triangle,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// === AUDIO SYNTHESIS ENGINE (V7 Expanded) ===
class DrumSynth {
  ctx: AudioContext | null = null;
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  // --- KIT 1: BASICS ---
  playKick() {
    this.playOsc(150, 0.5);
  }
  playSnare() {
    this.playNoise(800, 'highpass', 0.2);
  }
  playHat() {
    this.playNoise(4000, 'highpass', 0.05);
  }
  playClap() {
    this.playNoise(1000, 'bandpass', 0.15);
  }

  // --- KIT 2: MELODIC ---
  playPiano() {
    this.playTone(329.63, 'triangle', 1.0);
  }
  playGuitar() {
    this.playTone(196.0, 'sawtooth', 0.8);
  }
  play808() {
    this.playOsc(60, 0.8);
  }
  playAirHorn() {
    this.playTone(440, 'sawtooth', 0.4);
  }

  // --- KIT 3: EXTENDED ---
  playTom() {
    this.playOsc(100, 0.3);
  }
  playCowbell() {
    this.playTone(800, 'square', 0.1);
  }
  playRide() {
    this.playTone(5000, 'square', 0.3);
  }
  playCrash() {
    this.playNoise(1000, 'lowpass', 1.0);
  }
  playPop() {
    this.playTone(800, 'sine', 0.1);
  }

  // Helpers
  playOsc(freq: number, dur: number) {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(0.01, t + dur);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }
  playNoise(freq: number, type: BiquadFilterType, dur: number) {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const buf = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const flt = this.ctx.createBiquadFilter();
    flt.type = type;
    flt.frequency.value = freq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
    src.connect(flt);
    flt.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t);
    src.stop(t + dur);
  }
  playTone(freq: number, type: OscillatorType, dur: number) {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }
}

const synth = new DrumSynth();

export function BeatPad() {
  const [activePad, setActivePad] = useState<string | null>(null);
  const [visuals, setVisuals] = useState<
    { id: number; type: string; x: number; y: number; text?: string; rotation?: number }[]
  >([]);
  const [waveIndex, setWaveIndex] = useState(-1);
  const [idleHint, setIdleHint] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- ATTRACTOR ANIMATION LOOP ---
  useEffect(() => {
    // Wave Animation: Highlights keys sequentially 0->12 every 4 seconds
    const interval = setInterval(() => {
      setIdleHint(true);
      let i = 0;
      const wave = setInterval(() => {
        setWaveIndex(i);
        i++;
        if (i > 12) {
          clearInterval(wave);
          setWaveIndex(-1);
          setTimeout(() => setIdleHint(false), 1000);
        }
      }, 80); // Speed of scanning
    }, 4000); // Frequency of scan

    return () => clearInterval(interval);
  }, []);

  const handlePlay = (type: string, rect?: DOMRect) => {
    switch (type) {
      case 'KICK':
        synth.playKick();
        break;
      case 'SNARE':
        synth.playSnare();
        break;
      case 'HAT':
        synth.playHat();
        break;
      case 'CLAP':
        synth.playClap();
        break;
      case 'PIANO':
        synth.playPiano();
        break;
      case 'GUITAR':
        synth.playGuitar();
        break;
      case '808':
        synth.play808();
        break;
      case 'HORN':
        synth.playAirHorn();
        break;
      case 'TOM':
        synth.playTom();
        break;
      case 'BELL':
        synth.playCowbell();
        break;
      case 'RIDE':
        synth.playRide();
        break;
      case 'CRASH':
        synth.playCrash();
        break;
      case 'POP':
        synth.playPop();
        break;
    }

    // Text Map for Floating Feedback (Gamified Stats)
    const textMap: Record<string, string[]> = {
      KICK: ['Power +1', 'Energy +1', 'Impact +10'],
      SNARE: ['Snap +1', 'Style +1', 'Crisp +1'],
      HAT: ['Speed +1', 'Flow +1', 'Rhythm +1'],
      CLAP: ['Hype +1', 'Respect +1', 'Clout +1'],
      PIANO: ['Soul +10', 'Vibe +100', 'Art +1'],
      GUITAR: ['Rock +1', 'Cool +10', 'Edge +1'],
      '808': ['Bass +999', 'Shake +100', 'Heavy +1'],
      HORN: ['Funny +1', 'Lol +1', 'Meme +100'],
      TOM: ['Drama +1', 'Build +1', 'Roll +1'],
      BELL: ['Money +1', 'Rich +1', 'Profit +100'],
      RIDE: ['Groove +1', 'Smooth +1', 'Jazz +1'],
      CRASH: ['Chaos +10', 'Loud +1', 'Wild +1'],
      POP: ['Happy +1', 'Joy +1', 'Cute +1'],
    };
    const texts = textMap[type] || ['HIT'];
    const text = texts[Math.floor(Math.random() * texts.length)];

    setActivePad(type);

    // Visuals
    const id = Date.now();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const rotation = Math.random() * 30 - 15; // Random rotation -15 to +15 deg
    setVisuals((prev) => [...prev.slice(-15), { id, type, x, y, text, rotation }]);
    setTimeout(() => setVisuals((prev) => prev.filter((v) => v.id !== id)), 1000);
    setTimeout(() => setActivePad(null), 100);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.repeat) return;
      const keyMap: Record<string, string> = {
        '1': 'KICK',
        '2': 'SNARE',
        '3': 'HAT',
        '4': 'CLAP',
        '5': 'PIANO',
        '6': 'GUITAR',
        '7': '808',
        '8': 'HORN',
        q: 'TOM',
        w: 'BELL',
        e: 'RIDE',
        r: 'CRASH',
        t: 'POP',
      };
      if (keyMap[e.key.toLowerCase()]) handlePlay(keyMap[e.key.toLowerCase()]);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative flex flex-col items-center gap-4 w-full select-none">
      {/* Global Visualizer Layer (Portaled to Body) */}
      {mounted &&
        createPortal(
          <div
            className={cn(
              'fixed inset-0 pointer-events-none z-9999 flex items-center justify-center overflow-hidden',
              activePad === 'KICK' && 'animate-shake' // Removed bg changes to avoid full screen flash interfering
            )}
          >
            {visuals.map((v) => (
              <div key={v.id}>
                {/* Shape Visual */}
                <div
                  className={cn(
                    'absolute transform -translate-x-1/2 -translate-y-1/2',
                    (v.type === 'SNARE' || v.type === 'CLAP') && 'h-1 w-full bg-white blur-sm animate-flash',
                    (v.type === 'HAT' || v.type === 'RIDE') &&
                      'size-20 bg-yellow-400/50 rounded-full blur-xl animate-ping',
                    (v.type === 'KICK' || v.type === 'TOM') &&
                      'size-96 border-20 border-white/10 rounded-full animate-ping-slow',
                    (v.type === '808' || v.type === 'HORN') &&
                      'size-60 bg-purple-500/20 rounded-full blur-2xl animate-pulse',
                    // W (Bell): Sharp Diamond Ping
                    v.type === 'BELL' && 'size-16 bg-lime-400/80 rotate-45 blur-md animate-ping',
                    // T (Pop): Small Burst
                    v.type === 'POP' && 'size-12 bg-fuchsia-400 rounded-full blur-md animate-ping'
                  )}
                  style={{ left: v.x, top: v.y }}
                />
                {/* Floating Text */}
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-float-up text-4xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] stroke-black whitespace-nowrap z-50 pointer-events-none"
                  style={{
                    left: v.x,
                    top: v.y - 80,
                    textShadow: '3px 3px 0px #9333ea, -1px -1px 0 #000',
                    filter: 'drop-shadow(0px 0px 10px rgba(147, 51, 234, 0.5))',
                  }}
                >
                  {v.text}
                </div>
              </div>
            ))}
          </div>,
          document.body
        )}

      {/* Floating Hint Text (Appears when idle) */}
      <div
        className={cn(
          'absolute -top-10 transition-all duration-500 flex items-center gap-2',
          idleHint ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        <MousePointerClick className="size-4 text-purple-400 animate-bounce" />
        <span className="text-xs font-bold text-purple-400/80 bg-white/50 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
          Tap to Play!
        </span>
      </div>

      {/* === MAIN PAD GRID (Single Row) === */}
      <div className="flex flex-nowrap items-center justify-center sm:justify-center overflow-x-auto w-full max-w-full gap-2 p-3 pb-4 no-scrollbar">
        {/* GROUP 1: DRUMS (1-4) */}
        <VisualPad
          index={0}
          waveIndex={waveIndex}
          label="KICK"
          icon={Disc}
          hotkey="1"
          color="indigo"
          active={activePad === 'KICK'}
          onClick={handlePlay}
        />
        <VisualPad
          index={1}
          waveIndex={waveIndex}
          label="SNARE"
          icon={Hexagon}
          hotkey="2"
          color="cyan"
          active={activePad === 'SNARE'}
          onClick={handlePlay}
        />
        <VisualPad
          index={2}
          waveIndex={waveIndex}
          label="HAT"
          icon={Triangle}
          hotkey="3"
          color="pink"
          active={activePad === 'HAT'}
          onClick={handlePlay}
        />
        <VisualPad
          index={3}
          waveIndex={waveIndex}
          label="CLAP"
          icon={Hand}
          hotkey="4"
          color="violet"
          active={activePad === 'CLAP'}
          onClick={handlePlay}
        />

        <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1 shrink-0" />

        {/* GROUP 2: MELODIC (5-8) */}
        <VisualPad
          index={4}
          waveIndex={waveIndex}
          label="PIANO"
          icon={Music}
          hotkey="5"
          color="emerald"
          active={activePad === 'PIANO'}
          onClick={handlePlay}
        />
        <VisualPad
          index={5}
          waveIndex={waveIndex}
          label="GUITAR"
          icon={Zap}
          hotkey="6"
          color="orange"
          active={activePad === 'GUITAR'}
          onClick={handlePlay}
        />
        <VisualPad
          index={6}
          waveIndex={waveIndex}
          label="808"
          icon={Speaker}
          hotkey="7"
          color="rose"
          active={activePad === '808'}
          onClick={handlePlay}
        />
        <VisualPad
          index={7}
          waveIndex={waveIndex}
          label="HORN"
          icon={Megaphone}
          hotkey="8"
          color="yellow"
          active={activePad === 'HORN'}
          onClick={handlePlay}
        />

        <div className="w-px h-8 bg-black/10 dark:bg-white/10 mx-1 shrink-0" />

        {/* GROUP 3: PERCS (Q-T) */}
        <VisualPad
          index={8}
          waveIndex={waveIndex}
          label="TOM"
          icon={Drum}
          hotkey="Q"
          color="blue"
          active={activePad === 'TOM'}
          onClick={handlePlay}
        />
        <VisualPad
          index={9}
          waveIndex={waveIndex}
          label="BELL"
          icon={Bell}
          hotkey="W"
          color="lime"
          active={activePad === 'BELL'}
          onClick={handlePlay}
        />
        <VisualPad
          index={10}
          waveIndex={waveIndex}
          label="RIDE"
          icon={Circle}
          hotkey="E"
          color="amber"
          active={activePad === 'RIDE'}
          onClick={handlePlay}
        />
        <VisualPad
          index={11}
          waveIndex={waveIndex}
          label="CRASH"
          icon={Activity}
          hotkey="R"
          color="red"
          active={activePad === 'CRASH'}
          onClick={handlePlay}
        />
        <VisualPad
          index={12}
          waveIndex={waveIndex}
          label="POP"
          icon={Star}
          hotkey="T"
          color="fuchsia"
          active={activePad === 'POP'}
          onClick={handlePlay}
        />
      </div>

      <style jsx global>{`
            @keyframes shake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-4px, 2px); } 75% { transform: translate(4px, -2px); } }
            @keyframes float-up { 0% { opacity: 1; transform: translate(-50%, -50%) scale(0.5); } 50% { opacity: 1; transform: translate(-50%, -100%) scale(1.2); } 100% { opacity: 0; transform: translate(-50%, -150%) scale(1); } }
            .animate-shake { animation: shake 0.1s linear; }
            .animate-float-up { animation: float-up 0.8s ease-out forwards; }
            .animate-ping-slow { animation: ping 0.6s cubic-bezier(0, 0, 0.2, 1); }
            @keyframes flash { 0% { opacity: 1; } 100% { opacity: 0; } }
            .animate-flash { animation: flash 0.2s ease-out; }
            .no-scrollbar::-webkit-scrollbar { display: none; }
            .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
         `}</style>
    </div>
  );
}

// === PAD COMPONENT (V9: Idle Animations) ===
function VisualPad({
  label,
  icon: Icon,
  hotkey,
  color,
  active,
  onClick,
  index,
  waveIndex,
}: {
  label: string;
  icon: LucideIcon;
  hotkey: string;
  color: string;
  active: boolean;
  onClick: (t: string, r?: DOMRect) => void;
  index: number;
  waveIndex: number;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const isIdleActive = index === waveIndex;

  // New Vibrant Color Mapping
  const getVibrantStyles = (c: string) => {
    const map: Record<string, string> = {
      indigo:
        'bg-indigo-100 text-indigo-600 border-indigo-200 active:bg-indigo-500 active:text-white hover:bg-indigo-200 active:border-indigo-600 active:ring-indigo-400',
      cyan: 'bg-cyan-100 text-cyan-600 border-cyan-200 active:bg-cyan-500 active:text-white hover:bg-cyan-200 active:border-cyan-600 active:ring-cyan-400',
      pink: 'bg-pink-100 text-pink-600 border-pink-200 active:bg-pink-500 active:text-white hover:bg-pink-200 active:border-pink-600 active:ring-pink-400',
      violet:
        'bg-violet-100 text-violet-600 border-violet-200 active:bg-violet-500 active:text-white hover:bg-violet-200 active:border-violet-600 active:ring-violet-400',
      emerald:
        'bg-emerald-100 text-emerald-600 border-emerald-200 active:bg-emerald-500 active:text-white hover:bg-emerald-200 active:border-emerald-600 active:ring-emerald-400',
      orange:
        'bg-orange-100 text-orange-600 border-orange-200 active:bg-orange-500 active:text-white hover:bg-orange-200 active:border-orange-600 active:ring-orange-400',
      rose: 'bg-rose-100 text-rose-600 border-rose-200 active:bg-rose-500 active:text-white hover:bg-rose-200 active:border-rose-600 active:ring-rose-400',
      yellow:
        'bg-yellow-100 text-yellow-600 border-yellow-200 active:bg-yellow-500 active:text-white hover:bg-yellow-200 active:border-yellow-600 active:ring-yellow-400',
      blue: 'bg-blue-100 text-blue-600 border-blue-200 active:bg-blue-500 active:text-white hover:bg-blue-200 active:border-blue-600 active:ring-blue-400',
      lime: 'bg-lime-100 text-lime-600 border-lime-200 active:bg-lime-500 active:text-white hover:bg-lime-200 active:border-lime-600 active:ring-lime-400',
      amber:
        'bg-amber-100 text-amber-600 border-amber-200 active:bg-amber-500 active:text-white hover:bg-amber-200 active:border-amber-600 active:ring-amber-400',
      red: 'bg-red-100 text-red-600 border-red-200 active:bg-red-500 active:text-white hover:bg-red-200 active:border-red-600 active:ring-red-400',
      fuchsia:
        'bg-fuchsia-100 text-fuchsia-600 border-fuchsia-200 active:bg-fuchsia-500 active:text-white hover:bg-fuchsia-200 active:border-fuchsia-600 active:ring-fuchsia-400',
    };
    return map[c] || map.indigo;
  };

  // Specific idle/wave style extraction (lighter version of active)
  const getWaveStyle = (c: string) => {
    // Just re-use the hover style concept but forced
    const map: Record<string, string> = {
      indigo: 'bg-indigo-300 scale-110 border-indigo-400 shadow-indigo-200',
      cyan: 'bg-cyan-300 scale-110 border-cyan-400 shadow-cyan-200',
      // ... minimal mapping for brevity, falling back to simpler logic if needed
    };
    // Simple dynamic fallback
    return `scale-110 bg-${color}-200 border-${color}-400 shadow-lg`;
  };

  const styles = getVibrantStyles(color);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => onClick(label, ref.current?.getBoundingClientRect())}
      className={cn(
        'group relative shrink-0 size-11 sm:size-12 rounded-2xl border-b-4 flex flex-col items-center justify-center transition-all duration-100 ease-out outline-none select-none',
        // Base Vibrant Style (applied dynamically)
        styles,
        // Active State (Click) - Strong Push Down
        active
          ? 'scale-90 translate-y-1 border-b-0 ring-4 ring-offset-1 shadow-inner'
          : 'scale-100 hover:-translate-y-1 hover:border-b-[5px] shadow-sm',

        // Idle Wave Animation
        !active && isIdleActive && 'scale-110 -translate-y-2 border-b-[6px] shadow-md brightness-110 z-10'
      )}
    >
      {/* Tiny Icon */}
      <Icon
        className={cn(
          'size-3.5 mb-0.5 transition-colors',
          active ? 'opacity-100 text-white' : 'opacity-60 group-hover:opacity-100'
        )}
        strokeWidth={2.5}
      />

      {/* BIG VISIBLE LETTER */}
      <span
        className={cn(
          'text-base font-black leading-none tracking-tight transition-colors',
          active ? 'text-white' : 'opacity-80 group-hover:opacity-100'
        )}
      >
        {hotkey}
      </span>

      {/* Label (Micro) */}
      <span
        className={cn(
          'text-[6px] font-bold uppercase mt-0.5 transition-colors',
          active ? 'text-white/80' : 'opacity-40 group-hover:opacity-70'
        )}
      >
        {label}
      </span>
    </button>
  );
}
