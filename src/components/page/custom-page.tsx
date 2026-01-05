import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/formatter';
import type { PagesType } from '@/lib/source';
import { CalendarIcon } from 'lucide-react';
import { getMDXComponents } from '../docs/mdx-components';
import { Card, CardContent } from '../ui/card';

interface CustomPageProps {
  page: PagesType;
}

export function CustomPage({ page }: CustomPageProps) {
  if (!page) notFound();
  const { title, description, date } = page.data as any;
  const formattedDate = formatDate(new Date(date));
  const MDX = (page.data as any).body;

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">{title}</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{description}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border/50">
              <CalendarIcon className="size-4" />
              <p className="text-sm font-medium">{formattedDate}</p>
            </div>
          </div>

          {/* Content */}
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardContent className="p-8 md:p-12">
              <div className="max-w-none prose prose-lg prose-neutral dark:prose-invert prose-headings:font-bold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-2xl">
                <MDX components={getMDXComponents()} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
