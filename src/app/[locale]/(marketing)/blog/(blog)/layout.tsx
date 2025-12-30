import type { PropsWithChildren } from 'react';

export default function BlogLayout({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-background">{children}</div>;
}
