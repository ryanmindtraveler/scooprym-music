import { SongCoverImage } from '@/components/songs/song-cover-image';
import type { LoreTopic, LoreTopicPreview } from '@/lib/internet-lore/topics';
import styles from '@/styles/internet-lore-topics.module.css';
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
    <div className={archiveStyles.archiveContainer}>
      {/* 紧凑的一行两区刊物标头 */}
      <header className={styles.hubHeader}>
        <div className={styles.hubHeaderInner}>
          <div className={styles.hubTitleCol}>
            <h1 className={styles.hubTitle}>Internet Lore</h1>
          </div>
          <div className={styles.hubIntroCol}>
            <p className={styles.hubSubtitle}>
              Six original collections of internet culture, absurd setups and parody ideas from the ScoopRYM archive.
            </p>
          </div>
        </div>
      </header>

      {/* 六大专题平面内容单元 (3列 × 2行 紧凑排布) */}
      <section className={styles.topicsSection} aria-label="Internet Lore Topics">
        <div className={styles.topicsGrid}>
          {topics.map((topic) => {
            const preview = previews[topic.slug];
            const coverAlt = preview?.coverImageUrl
              ? `${preview.title} — original song artwork`
              : `${topic.title} topic artwork`;

            return (
              <article key={topic.slug} className={styles.topicArticle}>
                <Link
                  href={`/internet-lore/${topic.slug}`}
                  className={styles.topicCard}
                  aria-label={`Explore ${topic.title}`}
                >
                  {/* 公开原作封面或旧专题配图 */}
                  <div className={styles.topicMediaWrapper}>
                    <div className={styles.coverRatioBox}>
                      <SongCoverImage
                        src={preview?.coverImageUrl ?? `/images/features/${topic.slug}.webp`}
                        alt={coverAlt}
                        sizes="(min-width: 1240px) 381px, (min-width: 1080px) 31vw, (min-width: 768px) 48vw, 92vw"
                        className={styles.topicCoverImage}
                        priority={false}
                      />
                    </div>
                  </div>

                  {/* 正常文流小字说明 (绝不覆盖图片) */}
                  {preview?.coverImageUrl && <span className={styles.artworkCaption}>Original song artwork</span>}

                  {/* 标题与同排右侧细箭头 */}
                  <div className={styles.topicTitleRow}>
                    <h3 className={styles.topicTitle}>{topic.title}</h3>
                    <span className={styles.topicArrow} aria-hidden="true">
                      →
                    </span>
                  </div>

                  {/* 专题精练描述 (14-15px, 2-3行) */}
                  <p className={styles.topicDesc}>{topic.description}</p>
                  {typeof preview?.themeCount === 'number' ? (
                    <span className={styles.topicCount}>
                      {preview.themeCount} original themes
                      {!!preview.archiveCount && ` · ${preview.archiveCount} archived tracks`}
                    </span>
                  ) : typeof preview?.archiveCount === 'number' ? (
                    <span className={styles.topicCount}>
                      {preview.archiveCount > 0
                        ? `${preview.archiveCount} original tracks · ${preview.songCount ?? 0} available`
                        : 'Original collection unavailable'}
                    </span>
                  ) : typeof preview?.songCount === 'number' ? (
                    <span className={styles.topicCount}>
                      {preview.songCount} {preview.songCount === 1 ? 'song' : 'songs'}
                    </span>
                  ) : null}
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      {/* 底部区：轻量曲库导航与低声量原创戏仿声明 */}
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
