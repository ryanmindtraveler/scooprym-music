'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  type SongPublicationPlacement,
  getPublicationLoreTopic,
  lorePublicationTopics,
} from '@/lib/songs/publication-channel';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

/** 仅保存栏目，公开状态由行内发布开关独立控制。失败保留编辑内容。 */
export function SongPublicationSettings({
  songId,
  songTitle,
  placement,
  onSave,
  isPending,
}: {
  songId: string;
  songTitle: string;
  placement: SongPublicationPlacement;
  onSave: (placement: SongPublicationPlacement) => Promise<void>;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(placement);
  const collection = getPublicationLoreTopic(placement.loreTopicSlug);
  const valid = draft.publicationChannel === 'gallery' || !!getPublicationLoreTopic(draft.loreTopicSlug);
  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    if (next) setDraft(placement);
    setOpen(next);
  };
  const handleSave = async () => {
    if (!valid || isPending) return;
    try {
      await onSave(draft);
      setOpen(false);
    } catch {
      // 父组件显示具体失败原因，对话框保留选择以便重试。
    }
  };
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          aria-label={`Publication channel for ${songTitle}`}
          title={collection?.title}
        >
          {placement.publicationChannel === 'gallery' ? 'Gallery' : 'Internet Lore'}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-lg"
        onEscapeKeyDown={(event) => {
          if (isPending) event.preventDefault();
        }}
        onPointerDownOutside={(event) => {
          if (isPending) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Publication channel</DialogTitle>
          <DialogDescription>
            Choose where {songTitle} appears. Saving placement does not publish a hidden song. This song keeps the same
            detail URL.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup
          value={draft.publicationChannel}
          disabled={isPending}
          aria-label={`Publication channel for ${songTitle}`}
          onValueChange={(value) =>
            setDraft({
              publicationChannel: value === 'internet_lore' ? 'internet_lore' : 'gallery',
              loreTopicSlug: value === 'internet_lore' ? draft.loreTopicSlug : null,
            })
          }
          className="gap-3 py-2"
        >
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <RadioGroupItem value="gallery" id={`channel-gallery-${songId}`} className="mt-0.5" />
            <Label htmlFor={`channel-gallery-${songId}`} className="grid cursor-pointer gap-1 leading-relaxed">
              <span>Gallery</span>
              <span className="font-normal text-muted-foreground">
                Appears in Gallery, home recommendations and charts.
              </span>
            </Label>
          </div>
          <div className="flex items-start gap-3 rounded-lg border p-4">
            <RadioGroupItem value="internet_lore" id={`channel-lore-${songId}`} className="mt-0.5" />
            <Label htmlFor={`channel-lore-${songId}`} className="grid cursor-pointer gap-1 leading-relaxed">
              <span>Internet Lore</span>
              <span className="font-normal text-muted-foreground">
                Appears only in its collection; keeps its own song page.
              </span>
            </Label>
          </div>
        </RadioGroup>
        {draft.publicationChannel === 'internet_lore' && (
          <div className="grid gap-2">
            <Label htmlFor={`collection-${songId}`}>Collection</Label>
            <Select
              value={draft.loreTopicSlug || ''}
              disabled={isPending}
              onValueChange={(value) => setDraft({ ...draft, loreTopicSlug: value })}
            >
              <SelectTrigger id={`collection-${songId}`} aria-label={`Collection for ${songTitle}`}>
                <SelectValue placeholder="Choose a collection" />
              </SelectTrigger>
              <SelectContent>
                {lorePublicationTopics.map((topic) => (
                  <SelectItem key={topic.slug} value={topic.slug}>
                    {topic.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!valid || isPending} onClick={handleSave}>
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}Save placement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
