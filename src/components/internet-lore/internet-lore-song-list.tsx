import { LoreSongPlayer } from '@/components/internet-lore/lore-song-player';
import { SongCoverImage } from '@/components/songs/song-cover-image';
import type { HistoricalLoreSong } from '@/lib/internet-lore/song-catalog';
import { getNewsCardSummary } from '@/lib/songs/song-editorial';
import { getSongCanonicalSlug } from '@/lib/songs/song-seo';
import styles from '@/styles/internet-lore-topics.module.css';
import type { Song } from '@/types/song';
import Link from 'next/link';

/** 按原歌单展示；下架作品只显示历史名称，不提供音频、歌词或失效链接。 */
export function InternetLoreSongList({ songs, archive = [] }: { songs: Song[]; archive?: HistoricalLoreSong[] }) {
  const tracks = archive.length ? archive : songs;
  const available = archive.length ? songs.filter((song) => archive.some((track) => track.id === song.id)) : songs;
  return (
    <section id="songs" className={styles.featuredSection} aria-label="Topic Songs">
      <div className={styles.featuredContainer}>
        <div className={styles.catalogHeading}>
          <h2 className={styles.featuredSectionTitle}>Original songs in this collection</h2>
          <span className={styles.catalogCount}>
            {archive.length
              ? `${archive.length} original tracks · ${available.length} available`
              : `${songs.length} songs`}
          </span>
        </div>
        {tracks.length ? (
          <div className={styles.catalogGrid}>
            {tracks.map((track) => {
              const song = available.find((song) => song.id === track.id);
              return (
                <article key={track.id} className={styles.catalogSong} aria-label={track.title}>
                  <div className={styles.catalogCover}>
                    <SongCoverImage
                      src={song?.coverImageUrl}
                      alt={song ? `${song.title} cover art` : `${track.title} archived track`}
                      sizes="80px"
                      className={styles.topicCoverImage}
                    />
                  </div>
                  <div className={styles.featuredContentHolder}>
                    {song ? (
                      <>
                        <LoreSongPlayer song={song} queue={available} className={styles.catalogPlayer} />
                        <p className={styles.catalogSummary}>{getNewsCardSummary(song)}</p>
                        <Link
                          href={`/songs/${getSongCanonicalSlug(song)}`}
                          className={styles.songStoryLink}
                          aria-label={`Lyrics & story: ${song.title}`}
                        >
                          Lyrics & story <span aria-hidden="true">→</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <h3 className={styles.angleTitle}>{track.title}</h3>
                        <p className={styles.catalogSummary}>Archived · Currently unavailable</p>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyFeaturedBox}>
            <p className={styles.emptyFeaturedText}>
              The original tracks for this collection are currently unavailable.
            </p>
            <Link href="/songs" className={styles.emptyCatalogLink}>
              Browse all published songs →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
