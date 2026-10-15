import { cn } from '@/lib/utils';
import Image from 'next/image';

export function ScoopRYMLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo-808e80e8250d.webp"
      alt="Logo of ScoopRYM"
      title="Logo of ScoopRYM"
      width={32}
      height={32}
      sizes="32px"
      unoptimized
      priority
      loading="eager"
      className={cn('size-8 rounded-md', className)}
    />
  );
}
