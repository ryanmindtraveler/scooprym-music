import { LoreSongPlayer } from '@/components/internet-lore/lore-song-player';
import { SongCoverImage } from '@/components/songs/song-cover-image';
import type { LoreEntryWithSong } from '@/lib/internet-lore/content';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import styles from '@/styles/internet-lore.module.css';
import type { Song } from '@/types/song';
import Link from 'next/link';

/** 已核实案例嵌入对应专题。 */
export function LoreStories({ entries, queue: topicQueue }: { entries: LoreEntryWithSong[]; queue?: Song[] }) {
  const queue =
    topicQueue ?? entries.map((entry) => entry.song).filter((song): song is NonNullable<typeof song> => Boolean(song));
  return (
    <section className={styles.entriesSection} aria-label="Internet Lore Dossiers">
      <div className={styles.entriesContainer}>
        {entries.map((entry) => {
          const hasSong = Boolean(entry.song);

          return (
            <article key={entry.slug} id={entry.slug} className={styles.storyArticle}>
              <div className={styles.articleLayout}>
                {/* 左侧：深度新闻背景与事实来源 */}
                <div className={styles.storyContentPane}>
                  <div className={styles.metaRow}>
                    <span className={styles.categoryBadge}>{entry.category}</span>
                    <span className={styles.eraBadge}>{entry.era}</span>
                  </div>

                  <h2 className={styles.storyTitle}>{entry.title}</h2>

                  <p className={styles.storySummary}>{entry.summary}</p>

                  <div className={styles.paragraphsBlock}>
                    {entry.paragraphs.map((paragraph, idx) => (
                      <p key={idx} className={styles.storyParagraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {entry.sources && entry.sources.length > 0 && (
                    <footer className={styles.sourcesFooter}>
                      <h3 className={styles.sourcesHeading}>Reporting & sources</h3>
                      <ul className={styles.sourcesList}>
                        {entry.sources.map((source, srcIdx) => (
                          <li key={srcIdx} className={styles.sourceItem}>
                            <a
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.sourceLink}
                            >
                              <span className={styles.sourceTitle}>{source.title}</span>
                              <span className={styles.sourceIcon} aria-hidden="true">
                                ↗
                              </span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </footer>
                  )}
                </div>

                {/* 右侧：配套 ScoopRYM 唱片索引与播放器 */}
                <aside className={styles.songPane} aria-label="Soundtrack Dossier">
                  <div className={styles.soundtrackHeader}>
                    <span className={styles.soundtrackBadge}>The ScoopRYM version</span>
                  </div>

                  {hasSong && entry.song ? (
                    <div className={styles.recordCard}>
                      <div className={styles.coverWrapper}>
                        <SongCoverImage
                          src={entry.song.coverImageUrl}
                          alt={`${entry.song.title} cover art`}
                          sizes="(min-width: 992px) 340px, (min-width: 640px) 500px, 80vw"
                          className={styles.coverImage}
                          priority={false}
                        />
                      </div>

                      <div className={styles.playerWrapper}>
                        <LoreSongPlayer song={entry.song} queue={queue} className={styles.songPlayerControl} />
                      </div>

                      <div className={styles.songActionWrapper}>
                        <Link href={`/songs/${getSongCanonicalSlug(entry.song)}`} className={styles.songDetailLink}>
                          <span>Read lyrics & song story</span>
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.unavailableCard}>
                      <div className={styles.unavailableIcon} aria-hidden="true">
                        ♪
                      </div>
                      <p className={styles.unavailableNotice}>
                        This track is currently unavailable. Explore more songs.
                      </p>
                      <Link href="/songs" className={styles.unavailableLink}>
                        <span>Explore more songs</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  )}
                </aside>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
