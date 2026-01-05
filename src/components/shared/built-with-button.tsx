import { ScoopRYMLogo } from '@/components/layout/logo-scooprym';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function BuiltWithButton() {
  return (
    <Link
      target="_blank"
      href="https://scooprym.com"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'border border-border px-4 rounded-md')}
    >
      <span>Powered by</span>
      <span>
        <ScoopRYMLogo className="size-5 rounded-full" />
      </span>
      <span className="font-semibold">ScoopRYM</span>
    </Link>
  );
}
