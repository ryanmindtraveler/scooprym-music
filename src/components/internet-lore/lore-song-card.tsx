import { LoreSongPlayer } from '@/components/internet-lore/lore-song-player';
import { SongCoverImage } from '@/components/songs/song-cover-image';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import styles from '@/styles/internet-lore-song-card.module.css';
import type { Song } from '@/types/song';

/** 专题内的原歌卡片：封面和歌名打开完整详情，播放按钮独立操作。 */
export function LoreSongCard({
  song,
  queue,
  entryId,
  index,
  storyTitle,
  premise,
}: {
  song: Song;
  queue: Song[];
  entryId?: string;
  index?: number;
  storyTitle?: string;
  premise?: string;
}) {
  const detailHref = `/songs/${getSongCanonicalSlug(song)}`;

  return (
    <article id={entryId} className={styles.card} aria-label={song.title}>
      {/* 普通链接进入独立详情页，避免被全站歌曲弹窗路由拦截。 */}
      <a href={detailHref} className={styles.cover} aria-label={`View ${song.title} details`}>
        <SongCoverImage
          src={song.coverImageUrl}
          alt={`${song.title} cover art`}
          sizes="(max-width: 599px) 96px, 136px"
          className={styles.coverImage}
        />
      </a>
      <div className={styles.identity}>
        <p className={styles.kicker}>Original song{index ? ` · ${String(index).padStart(2, '0')}` : ''}</p>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>
            <a href={detailHref}>{song.title}</a>
          </h3>
          <div className={styles.actions}>
            <LoreSongPlayer song={song} queue={queue} iconOnly className={styles.playButton} />
            <a href={detailHref} className={styles.detailLink} aria-label={`Song details: ${song.title}`}>
              <span className={styles.detailLabel}>Song details</span> <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
        {storyTitle && <p className={styles.storyTitle}>{storyTitle}</p>}
      </div>
      {premise && <p className={styles.summary}>{premise}</p>}
    </article>
  );
}
