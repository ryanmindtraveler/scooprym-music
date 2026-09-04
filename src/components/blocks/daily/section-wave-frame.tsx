const wavePath =
  'M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z';

export type WaveTone = 'hero' | 'today' | 'biggest' | 'paper' | 'gallery' | 'submit';

const toneStops: Record<Exclude<WaveTone, 'paper'>, Array<[string, string]>> = {
  hero: [
    ['0%', '#bae6fd'],
    ['50%', '#f5f3ff'],
    ['100%', '#fbcfe8'],
  ],
  today: [
    ['0%', '#06b6d4'],
    ['50%', '#a78bfa'],
    ['100%', '#f472b6'],
  ],
  biggest: [
    ['0%', '#6366f1'],
    ['50%', '#ec4899'],
    ['100%', '#22d3ee'],
  ],
  gallery: [
    ['0%', '#ddd6fe'],
    ['50%', '#fbcfe8'],
    ['100%', '#bae6fd'],
  ],
  submit: [
    ['0%', '#ee7752'],
    ['33%', '#e73c7e'],
    ['66%', '#23a6d5'],
    ['100%', '#23d5ab'],
  ],
};

const toneGradientAxes: Record<Exclude<WaveTone, 'paper'>, { x1: string; x2: string; y1: string; y2: string }> = {
  hero: { x1: '0', y1: '0', x2: '1', y2: '0' },
  today: { x1: '0', y1: '0', x2: '1', y2: '0' },
  biggest: { x1: '0', y1: '0', x2: '1', y2: '0' },
  gallery: { x1: '0', y1: '0', x2: '1', y2: '0' },
  submit: { x1: '0', y1: '0', x2: '1', y2: '0' },
};

interface SectionWaveDividerProps {
  from: WaveTone;
  to: WaveTone;
}

/**
 * 首页模块之间唯一的波浪分隔器。
 * 自身高度为零，只将后一模块的颜色向上覆盖到前一模块，避免产生额外色带和留白。
 */
export function SectionWaveDivider({ from, to }: SectionWaveDividerProps) {
  const gradientId = `scooprym-wave-${from}-${to}`;
  const stops = to === 'paper' ? null : toneStops[to];
  const axes = to === 'paper' ? null : toneGradientAxes[to];

  return (
    <div aria-hidden="true" className="pointer-events-none relative z-30 h-0 w-full">
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 block h-12 w-[calc(100%+1.3px)] md:h-20"
        focusable="false"
      >
        {stops && (
          <defs>
            <linearGradient id={gradientId} {...axes}>
              {stops.map(([offset, color]) => (
                <stop key={offset} offset={offset} stopColor={color} />
              ))}
            </linearGradient>
          </defs>
        )}
        <path fill={to === 'paper' ? '#fffdf8' : `url(#${gradientId})`} d={wavePath} />
      </svg>
    </div>
  );
}
