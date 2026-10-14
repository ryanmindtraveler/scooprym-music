import { InternetLoreArchive } from '@/components/internet-lore/internet-lore-archive';
import { LoreStories } from '@/components/internet-lore/lore-stories';
import { SongCoverImage } from '@/components/songs/song-cover-image';
import { getLoreTopicArchiveCases } from '@/lib/internet-lore/archive-cases';
import type { LoreEntryWithSong } from '@/lib/internet-lore/content';
import { getLoreTopicArchiveSongs } from '@/lib/internet-lore/song-catalog';
import type { LoreTopic } from '@/lib/internet-lore/topics';
import { internetLoreTopics } from '@/lib/internet-lore/topics';
import styles from '@/styles/internet-lore-exhibition.module.css';
import archiveStyles from '@/styles/internet-lore.module.css';
import type { Song } from '@/types/song';
import Link from 'next/link';

const topicNavigationLabels: Record<string, string> = {
  'absurd-social-phenomena': 'Absurd life',
  'entertainment-topics': 'Entertainment',
  'gossip-roast': 'Gossip & drama',
  'news-parody': 'News parody',
  'meme-culture': 'Memes',
  'comedy-drill': 'Everyday comedy',
};

/** 专题正文、已核实案例与公开作品，沿用共享播放器。 */
export function InternetLoreTopicView({
  topic,
  entries,
  songs,
}: {
  topic: LoreTopic;
  entries: LoreEntryWithSong[];
  songs: Song[];
}) {
  // 导航仅引用固定六专题，不改变作品归属或播放队列。
  const otherTopics = internetLoreTopics.filter((t) => t.slug !== topic.slug);

  const hasEntries = entries.length > 0;

  return (
    <div className={archiveStyles.archiveContainer}>
      {/* 将专题插图纳入标题区，避免它占据歌曲列表的独立空白行。 */}
      <header className={styles.topicHeader}>
        <div className={styles.topicHeaderInner}>
          <nav className={styles.breadcrumbNav} aria-label="Breadcrumb">
            <Link href="/internet-lore" className={styles.breadcrumbLink}>
              <span aria-hidden="true">←</span>
              <span>Internet Lore</span>
            </Link>
          </nav>

          <div className={styles.topicHero}>
            <div className={styles.topicHeroCopy}>
              <div className={styles.topicBadge}>COLLECTION ARCHIVE</div>
              <h1 className={styles.topicHeaderTitle}>{topic.title}</h1>
              <p className={styles.topicHeaderSubtitle}>{topic.description}</p>
            </div>
            <div className={styles.topicHeroArtwork}>
              <SongCoverImage
                src={`/images/features/${topic.slug}.webp`}
                alt={`${topic.title} topic artwork`}
                sizes="(min-width: 1400px) 352px, (min-width: 768px) 30vw, 160px"
                className={styles.topicCoverImage}
                priority
              />
            </div>
          </div>
          <nav className={styles.topicNavigation} aria-label="Internet Lore collections">
            {internetLoreTopics.map((item) => (
              <Link
                key={item.slug}
                href={`/internet-lore/${item.slug}`}
                aria-label={item.title}
                aria-current={item.slug === topic.slug ? 'page' : undefined}
                className={styles.topicNavigationLink}
              >
                {topicNavigationLabels[item.slug] ?? item.title}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <InternetLoreArchive
        topic={topic}
        cases={getLoreTopicArchiveCases(topic)}
        archive={getLoreTopicArchiveSongs(topic)}
        songs={songs}
      />

      {/* 背景保留在可展开的正文里，让首次阅读优先看到故事和歌曲。 */}
      <section className={styles.articleBodySection} aria-label="Topic Background">
        <details className={styles.backgroundDisclosure}>
          <summary className={styles.backgroundToggle}>
            <span>About this collection</span>
            <span className={styles.disclosureIndicator} aria-hidden="true">
              +
            </span>
          </summary>
          <div className={styles.articleBodyContainer}>
            <div className={styles.proseBlock}>
              {topic.introduction.map((paragraph) => (
                <p key={paragraph} className={styles.proseParagraph}>
                  {paragraph}
                </p>
              ))}
            </div>

            {topic.angles && topic.angles.length > 0 && (
              <aside className={styles.anglesBlock} aria-label="Parody Angles">
                <h2 className={styles.anglesSectionTitle}>The Parody Angles</h2>
                <div className={styles.anglesList}>
                  {topic.angles.map((angle) => (
                    <div key={angle.title} className={styles.angleRow}>
                      <h3 className={styles.angleTitle}>{angle.title}</h3>
                      <p className={styles.angleText}>{angle.text}</p>
                    </div>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </details>
      </section>

      {/* 具体事件深度案例 (调用已有通用案例渲染组件) */}
      {hasEntries && (
        <section className={styles.storiesContainer} aria-label="Topic Case Dossiers">
          <LoreStories entries={entries} queue={songs} />
        </section>
      )}

      {/* 其他五大专题轻量单行导航 (避免重复大卡片) */}
      <section className={styles.relatedSection} aria-label="Other Internet Lore Topics">
        <div className={styles.relatedContainer}>
          <div className={styles.relatedRow}>
            <span className={styles.relatedPrompt}>Also in Internet Lore:</span>
            <ul className={styles.relatedLinkList}>
              {otherTopics.map((otherTopic) => (
                <li key={otherTopic.slug}>
                  <Link href={`/internet-lore/${otherTopic.slug}`} className={styles.relatedInlineLink}>
                    <span>{otherTopic.title}</span>
                    <span aria-hidden="true" className={styles.relatedLinkArrow}>
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 底部收尾：精简曲库指引与原创戏仿声明 */}
      <footer className={styles.hubFooter}>
        <div className={styles.hubFooterInner}>
          <div className={styles.quickCatalogLinks}>
            <span className={styles.catalogPrompt}>Ready for more tracks?</span>
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
