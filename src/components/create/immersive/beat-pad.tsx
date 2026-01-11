'use client';

import { cn } from '@/lib/utils';
import { usePlayerStore } from '@/store';
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
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const padRefs = useRef<Record<string, DOMRect>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- REMOVED: AUTO-PLAY ANIMATION (User requested: no animation during playback) ---

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

  const handlePlay = (type: string, rect?: DOMRect, isAuto = false) => {
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

    // Text Map for Floating Feedback (Gamified Stats) - Suppressed if isAuto
    let text = '';
    if (!isAuto) {
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
      text = texts[Math.floor(Math.random() * texts.length)];
    }

    setActivePad(type);

    // Visuals
    const id = Date.now();
    // Improved Position Detection: If no rect, try to find the button's rect in our store
    const targetRect = rect || padRefs.current[type];
    const x = targetRect ? targetRect.left + targetRect.width / 2 : window.innerWidth / 2;
    const y = targetRect ? targetRect.top + targetRect.height / 2 : window.innerHeight / 2;

    const rotation = Math.random() * 30 - 15; // Random rotation -15 to +15 deg
    setVisuals((prev) => [...prev.slice(-15), { id, type, x, y, text, rotation }]);
    setTimeout(() => setVisuals((prev) => prev.filter((v) => v.id !== id)), 1000);
    setTimeout(() => setActivePad(null), 120); // Slightly longer active state for visibility
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
          <div className="fixed inset-0 pointer-events-none z-9999 overflow-hidden">
            <div
              className={cn(
                'absolute inset-0 flex items-center justify-center'
                // Removed global shake to prevent scrollbar flicker
              )}
            >
              {visuals.map((v) => (
                <div key={v.id}>
                  {/* Shape Visual */}
                  <div
                    className={cn(
                      'absolute transform -translate-x-1/2 -translate-y-1/2',
                      (v.type === 'SNARE' || v.type === 'CLAP') && 'h-1 w-full bg-white blur-sm animate-flash',
                      (v.type === 'HAT' || v.type || 'RIDE') &&
                        'size-20 bg-yellow-400/50 rounded-full blur-xl animate-ping',
                      (v.type === 'KICK' || v.type === 'TOM') &&
                        'size-80 border-30 border-white/20 rounded-full animate-ping-slow animate-shake', // Thicker, brighter pulses
                      (v.type === '808' || v.type === 'HORN') &&
                        'size-60 bg-purple-500/30 rounded-full blur-2xl animate-pulse',
                      // W (Bell): Sharp Diamond Ping
                      v.type === 'BELL' && 'size-20 bg-lime-400/80 rotate-45 blur-md animate-ping',
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
            </div>
          </div>,
          document.body
        )}

      {/* Floating Hint Text / Status Badge */}
      <div
        className={cn(
          'absolute -top-12 transition-all duration-500 flex flex-col items-center gap-1',
          idleHint || isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        )}
      >
        {isPlaying ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/40 backdrop-blur-md">
            <div className="size-2 bg-indigo-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
              Audio Preview Active
            </span>
          </div>
        ) : (
          <>
            <MousePointerClick className="size-4 text-purple-400 animate-bounce" />
            <span className="text-xs font-bold text-purple-400/80 bg-white/50 backdrop-blur-md px-3 py-1 rounded-full shadow-sm">
              Tap to Play!
            </span>
          </>
        )}
      </div>

      {/* Glow Effect when Playing */}
      {isPlaying && (
        <div className="absolute inset-x-0 -bottom-4 h-24 bg-indigo-500/10 blur-[60px] pointer-events-none rounded-full" />
      )}

      {/* === MAIN PAD GRID (Single Row) === */}
      <div className="flex flex-nowrap items-center justify-center sm:justify-center overflow-x-auto md:overflow-hidden w-full max-w-full gap-2 p-4 pb-8 min-h-[120px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
          onMount={(l, r) => {
            padRefs.current[l] = r;
          }}
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
  onMount,
}: {
  label: string;
  icon: LucideIcon;
  hotkey: string;
  color: string;
  active: boolean;
  onClick: (t: string, r?: DOMRect) => void;
  index: number;
  waveIndex: number;
  onMount?: (label: string, rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const isIdleActive = index === waveIndex;

  useEffect(() => {
    if (ref.current && onMount) {
      onMount(label, ref.current.getBoundingClientRect());
    }
  }, [label, onMount]);

  // New Vibrant Color Mapping
  const getVibrantStyles = (c: string) => {
    // Defines base colors and shadow colors instead of border colors
    const map: Record<string, string> = {
      indigo: 'bg-indigo-100 text-indigo-600 shadow-indigo-200 hover:bg-indigo-200',
      cyan: 'bg-cyan-100 text-cyan-600 shadow-cyan-200 hover:bg-cyan-200',
      pink: 'bg-pink-100 text-pink-600 shadow-pink-200 hover:bg-pink-200',
      violet: 'bg-violet-100 text-violet-600 shadow-violet-200 hover:bg-violet-200',
      emerald: 'bg-emerald-100 text-emerald-600 shadow-emerald-200 hover:bg-emerald-200',
      orange: 'bg-orange-100 text-orange-600 shadow-orange-200 hover:bg-orange-200',
      rose: 'bg-rose-100 text-rose-600 shadow-rose-200 hover:bg-rose-200',
      yellow: 'bg-yellow-100 text-yellow-600 shadow-yellow-200 hover:bg-yellow-200',
      blue: 'bg-blue-100 text-blue-600 shadow-blue-200 hover:bg-blue-200',
      lime: 'bg-lime-100 text-lime-600 shadow-lime-200 hover:bg-lime-200',
      amber: 'bg-amber-100 text-amber-600 shadow-amber-200 hover:bg-amber-200',
      red: 'bg-red-100 text-red-600 shadow-red-200 hover:bg-red-200',
      fuchsia: 'bg-fuchsia-100 text-fuchsia-600 shadow-fuchsia-200 hover:bg-fuchsia-200',
    };
    return map[c] || map.indigo;
  };

  const styles = getVibrantStyles(color);

  // Shadow Colors for specific active/3d states
  const borderColors: Record<string, string> = {
    indigo: 'rgb(129 140 248)', // indigo-400
    cyan: 'rgb(34 211 238)',
    pink: 'rgb(244 114 182)',
    violet: 'rgb(167 139 250)',
    emerald: 'rgb(52 211 153)',
    orange: 'rgb(251 146 60)',
    rose: 'rgb(251 113 133)',
    yellow: 'rgb(250 204 21)',
    blue: 'rgb(96 165 250)',
    lime: 'rgb(163 230 53)',
    amber: 'rgb(251 191 36)',
    red: 'rgb(248 113 113)',
    fuchsia: 'rgb(232 121 249)',
  };
  const shadowColor = borderColors[color] || 'rgb(161 161 170)'; // fallback

  return (
    <button
      ref={ref}
      type="button"
      onPointerDown={(e) => {
        // Trigger instantly on touch/click, preventing ghost clicks if needed by logic,
        // but here we just want fast response.
        onClick(label, ref.current?.getBoundingClientRect());
      }}
      style={{
        boxShadow: active
          ? 'none' // Pressed: No shadow
          : isIdleActive
            ? `0 6px 0 0 ${shadowColor}, 0 10px 15px -3px rgba(0, 0, 0, 0.1)` // Wave: Higher shadow
            : `0 4px 0 0 ${shadowColor}`, // Normal: 4px shadow (Matches previous border-b-4)
        transform: active
          ? 'translateY(4px) scale(0.95)' // Pressed: Move down 4px (to consume shadow space)
          : isIdleActive
            ? 'translateY(-2px) scale(1.1)' // Wave: Move up slightly
            : 'translateY(0) scale(1)', // Normal
      }}
      className={cn(
        'group relative shrink-0 size-11 sm:size-12 rounded-2xl flex flex-col items-center justify-center transition-all duration-100 ease-out outline-none select-none touch-manipulation',
        styles,
        // Active State Colors overrides
        active && `bg-${color}-500 text-white`,

        // Idle/Wave Brightness
        !active && isIdleActive && 'brightness-110 z-10'
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
