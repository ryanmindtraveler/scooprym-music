import { SongCoverImage } from '@/components/songs/song-cover-image';
import type { LoreTopic, LoreTopicPreview } from '@/lib/internet-lore/topics';
import styles from '@/styles/internet-lore-exhibition.module.css';
import colors from '@/styles/internet-lore-hub-color.module.css';
import archiveStyles from '@/styles/internet-lore.module.css';
import Link from 'next/link';

/** 六个历史专题索引；不以当前作品替代旧专题配图或歌单。 */
export function InternetLoreView({
  topics,
  previews = {},
}: {
  topics: LoreTopic[];
  previews?: Record<string, LoreTopicPreview>;
}) {
  return (
    <div className={`${archiveStyles.archiveContainer} ${colors.page}`}>
      {/* 将标题、说明与分类入口组织成同一个阅读区域。 */}
      <header className={styles.hubHeader}>
        <div className={`${styles.hubHeaderInner} ${colors.hero}`}>
          <div className={styles.hubHeaderContent}>
            <div className={`${styles.hubBadge} ${colors.badge}`}>✨ THE ORIGINAL ARCHIVE</div>
            <h1 className={`${styles.hubTitle} ${colors.title}`}>
              Internet <span className={colors.highlight}>Lore</span>
            </h1>
            <p className={styles.hubSubtitle}>
              The stories, memes and everyday chaos that inspired our original parody songs.
            </p>
            <div className={styles.hubPillsRow}>
              <span className={`${styles.hubFeaturePill} ${colors.pill}`}>🎵 6 Curated Collections</span>
              <span className={`${styles.hubFeaturePill} ${colors.pill}`}>📰 54 Cultural Themes</span>
              <span className={`${styles.hubFeaturePill} ${colors.pill}`}>⚡ Original Parody Tracks</span>
            </div>
          </div>
        </div>
      </header>

      {/* 专题配图固定来自旧栏目，歌曲封面不充当分类入口。 */}
      <section className={styles.topicsSection} aria-label="Internet Lore Topics">
        <div className={styles.topicsGrid}>
          {topics.map((topic, index) => {
            const preview = previews[topic.slug];

            return (
              <article key={topic.slug} className={styles.topicArticle}>
                <Link
                  href={`/internet-lore/${topic.slug}`}
                  className={`${styles.topicCard} ${colors.card}`}
                  data-topic={topic.slug}
                  aria-label={`Explore ${topic.title}`}
                >
                  <div className={styles.topicMediaWrapper}>
                    <span className={`${styles.topicIndexBadge} ${colors.indexBadge}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className={styles.coverRatioBox}>
                      <SongCoverImage
                        src={`/images/features/${topic.slug}.webp`}
                        alt={`${topic.title} topic artwork`}
                        sizes="(min-width: 1400px) 416px, (min-width: 1080px) 31vw, (min-width: 640px) 46vw, 92vw"
                        className={styles.topicCoverImage}
                        priority={index === 0}
                      />
                    </div>
                  </div>

                  <div className={styles.topicTitleRow}>
                    <h2 className={`${styles.topicTitle} ${colors.cardTitle}`}>{topic.title}</h2>
                    <span className={`${styles.topicArrow} ${colors.arrow}`} aria-hidden="true">
                      →
                    </span>
                  </div>

                  <p className={`${styles.topicDesc} ${colors.description}`}>{topic.description}</p>
                  <div className={`${styles.topicMeta} ${colors.meta}`}>
                    {typeof preview?.themeCount === 'number' && (
                      <span className={`${styles.topicCount} ${colors.count}`}>
                        {preview.themeCount} original themes
                      </span>
                    )}
                    {typeof preview?.songCount === 'number' && (
                      <span
                        className={
                          preview.songCount > 0
                            ? `${styles.topicAvailable} ${colors.available}`
                            : `${styles.topicPending} ${colors.pending}`
                        }
                      >
                        {preview.songCount > 0
                          ? `${preview.songCount} ${preview.songCount === 1 ? 'song' : 'songs'} to play`
                          : 'Recordings not restored yet'}
                      </span>
                    )}
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* 保留原作说明与 Gallery 导航。 */}
      <footer className={styles.hubFooter}>
        <div className={styles.hubFooterInner}>
          <div className={styles.quickCatalogLinks}>
            <span className={styles.catalogPrompt}>Looking for more tracks?</span>
            <Link href="/songs" className={styles.footerInlineLink}>
              Browse all songs
            </Link>
            <span aria-hidden="true" className={styles.linkDot}>
              ·
            </span>
            <Link href="/#today" className={styles.footerInlineLink}>
              Today&apos;s drops
            </Link>
          </div>

          <p className={styles.quietDisclaimer}>
            Our songs are original AI-assisted parody tracks inspired by public stories. They are not recordings of the
            people or performances described.
          </p>
        </div>
      </footer>
    </div>
  );
}
