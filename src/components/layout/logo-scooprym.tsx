import { cn } from '@/lib/utils';
import Image from 'next/image';

export function ScoopRYMLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt="Logo of ScoopRYM"
      title="Logo of ScoopRYM"
      width={96}
      height={96}
      className={cn('size-8 rounded-md', className)}
    />
  );
}
