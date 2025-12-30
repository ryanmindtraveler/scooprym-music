import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Link as LinkIcon, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function CreateMusicPage() {
  const t = useTranslations();

  const breadcrumbs = [
    {
      label: t('Dashboard.dashboard.title'),
    },
    {
      label: 'Create',
      isCurrentPage: true,
    },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />

      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-6 p-4 md:p-6">
            <div>
              <h1 className="text-3xl font-extrabold">
                Create <span className="text-primary">Music</span>
              </h1>
              <p className="mt-2 text-muted-foreground">From news to music, let AI help you create</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Left: Input */}
              <Card className="rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 pb-4">
                  <FileText className="size-5" />
                  <h3 className="text-lg font-semibold">News Input</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <LinkIcon className="size-4" />
                    <span className="font-medium">News Link</span>
                  </div>
                  <Input placeholder="https://example.com/news" className="h-11 rounded-xl" />
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="size-4" />
                    <span className="font-medium">Describe News Content</span>
                  </div>
                  <Textarea
                    rows={12}
                    placeholder="Describe the news story or trending topic in detail..."
                    className="min-h-[220px] rounded-xl"
                  />
                </div>

                <div className="pt-4">
                  <Button className="w-full justify-center rounded-xl py-6 text-base">
                    <Sparkles className="mr-2 size-4" /> Generate Lyrics
                  </Button>
                </div>
              </Card>

              {/* Right: Lyrics Display */}
              <Card className="rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 pb-4">
                  <FileText className="size-5" />
                  <h3 className="text-lg font-semibold">Lyrics Display</h3>
                </div>

                <div className="flex h-[420px] flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <FileText className="size-10" />
                  <p>Enter news content on the left, lyrics will be displayed here after generation</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
