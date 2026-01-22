'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ListMusic, Mic2 } from 'lucide-react';

interface StageTabsProps {
  value: 'stage' | 'queue';
  onValueChange: (value: 'stage' | 'queue') => void;
  queueCount?: number;
}

export function StageTabs({ value, onValueChange, queueCount = 0 }: StageTabsProps) {
  return (
    <div className="relative flex items-center bg-slate-100/50 dark:bg-white/5 p-1 rounded-xl border border-white/10">
      <TabItem isActive={value === 'stage'} onClick={() => onValueChange('stage')} icon={Mic2} label="Stage" />
      <TabItem
        isActive={value === 'queue'}
        onClick={() => onValueChange('queue')}
        icon={ListMusic}
        label="Queue"
        badge={queueCount > 0 ? queueCount : undefined}
      />
    </div>
  );
}

function TabItem({
  isActive,
  onClick,
  icon: Icon,
  label,
  badge,
}: {
  isActive: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold transition-colors z-10',
        isActive
          ? 'text-indigo-600 dark:text-white'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      )}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabBg"
          className="absolute inset-0 bg-white dark:bg-zinc-800 shadow-sm rounded-lg border border-slate-200/50 dark:border-white/5 -z-10"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
        />
      )}
      <Icon className="size-4" />
      <span>{label}</span>
      {badge && (
        <span className="ml-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] bg-red-500 text-white rounded-full leading-none">
          {badge}
        </span>
      )}
    </button>
  );
}
