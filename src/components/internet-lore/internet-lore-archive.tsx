import { LoreSongCard } from '@/components/internet-lore/lore-song-card';
import type { HistoricalLoreCase } from '@/lib/internet-lore/archive-cases';
import type { HistoricalLoreSong } from '@/lib/internet-lore/song-catalog';
import type { LoreTopic } from '@/lib/internet-lore/topics';
import styles from '@/styles/internet-lore-exhibition.module.css';
import type { Song } from '@/types/song';
import Link from 'next/link';

/** 公开原歌展示封面并链接独立详情；未发布作品只保留历史主题。 */
export function InternetLoreArchive({
  topic,
  cases,
  archive,
  songs,
}: {
  topic: LoreTopic;
  cases: readonly HistoricalLoreCase[];
  archive: HistoricalLoreSong[];
  songs: Song[];
}) {
  const available = songs.filter(
    (song) => song.publicationChannel === 'internet_lore' && song.loreTopicSlug === topic.slug
  );
  const additionalSongs = available.filter((song) => !cases.some((entry) => entry.songId === song.id));
  const tracksById = new Map(archive.map((track) => [track.id, track]));
  const songsById = new Map(available.map((song) => [song.id, song]));
  return (
    <section className={styles.featuredSection} aria-label="Original Archive">
      <div className={styles.featuredContainer}>
        <div className={styles.archiveLead}>
          <div>
            <div className={styles.catalogHeading}>
              <h2 id="collection-index" className={styles.featuredSectionTitle}>
                From the original collection
              </h2>
              <span className={styles.catalogCount}>
                {cases.length} {cases.length === 1 ? 'theme' : 'themes'}
              </span>
            </div>
            <p className={styles.archiveAvailability}>
              {archive.length
                ? `${archive.length} original tracks are listed below. ${available.length ? `${available.length} available to play.` : 'The recordings remain archived and are not currently available to play.'}`
                : available.length
                  ? `${available.length} tracks available to play in this collection.`
                  : 'The original song links for this collection are currently unavailable.'}
            </p>
          </div>
        </div>
        {cases.length ? (
          <>
            <details className={styles.archiveIndexDisclosure}>
              <summary className={styles.archiveIndexToggle}>
                Jump to a theme
                <span className={styles.archiveIndexCount}>{cases.length} entries</span>
                <span className={styles.archiveIndexIndicator} aria-hidden="true">
                  ↓
                </span>
              </summary>
              <nav className={styles.archiveIndex} aria-label="Collection index">
                {cases.map((entry, index) => (
                  <Link key={entry.id} href={`#${entry.id}`} className={styles.archiveIndexLink}>
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                    {entry.title}
                  </Link>
                ))}
              </nav>
            </details>
            <div className={`${styles.archiveEntries} ${available.length ? '' : styles.themeEntries}`}>
              {cases.map((entry, index) => {
                const track = entry.songId ? tracksById.get(entry.songId) : undefined;
                const song = entry.songId ? songsById.get(entry.songId) : undefined;
                if (song) {
                  return (
                    <LoreSongCard
                      key={entry.id}
                      entryId={entry.id}
                      index={index + 1}
                      song={song}
                      queue={available}
                      storyTitle={entry.title}
                      premise={entry.premise}
                    />
                  );
                }
                return (
                  <article key={entry.id} id={entry.id} className={styles.archiveEntry} aria-label={entry.title}>
                    <span className={styles.archiveNumber} aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className={styles.archiveEntryBody}>
                      <h3 className={styles.archiveEntryTitle}>{entry.title}</h3>
                      <p className={styles.archivePremise}>{entry.premise}</p>
                      {track ? (
                        <div className={styles.archiveTrack}>
                          <span className={styles.archiveTrackLabel}>Original track</span>
                          <span className={styles.archiveTrackTitle}>{track.title}</span>
                          <span className={styles.archiveTrackStatus}>Archived · Currently unavailable</span>
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <p className={styles.archiveIntro}>No original archive entries are available for this collection.</p>
        )}
        {additionalSongs.length > 0 && (
          <div className={styles.archiveEntries} aria-label="More collection songs">
            {additionalSongs.map((song) => (
              <LoreSongCard key={song.id} song={song} queue={available} premise={song.newsSummary || undefined} />
            ))}
          </div>
        )}
        <p className={styles.archiveNote}>Original parody ideas and songs, not a verified news timeline.</p>
      </div>
    </section>
  );
}
