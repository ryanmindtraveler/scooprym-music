// 为早期已发布歌曲补齐事件摘要。摘要依据原报道或已保存的原文；无新闻来源的原创歌曲只描述主题。
const { loadEnvConfig } = require('@next/env');
const postgres = require('postgres');

loadEnvConfig(process.cwd());

const summaries = [
  {
    id: '0238dcd1-6d25-4424-acc3-c7c4dc0a085b',
    summary:
      'A BBC investigation revisited Jasveen Sangha, nicknamed the “Ketamine Queen,” whose ketamine supply was linked to Matthew Perry’s 2023 overdose death. Friends described the life she led before the case.',
  },
  {
    id: '0321d2ed-c599-434b-966b-a3ddfd191e0a',
    summary:
      'A Yahoo story discussed speculation that Taylor Swift and Travis Kelce might marry at a luxury hotel. The song plays with the rumored plans; the couple had not confirmed a wedding venue.',
  },
  {
    id: '361ba154-ed23-44e9-b2a9-bb73a9b8ff67',
    summary:
      'After Andy Cohen’s remarks about Eric Adams during CNN’s New Year’s Eve broadcast, a report said the network was considering whether to bring Cohen back as a co-host. No decision was confirmed.',
  },
  {
    id: '4f9df063-e4b4-4100-97cd-377fcc3034c8',
    summary:
      'Tom Brady attended the NHL Winter Classic in Miami two days after he was seen spending New Year’s Eve with Alix Earle in St. Barts, drawing attention to his holiday outings.',
  },
  {
    id: '5b802e73-cf2d-4e6b-a25d-5af09d1643d0',
    summary:
      'Dax Shepard and Kristen Bell shared photos from their New Year’s celebration with daughters Lincoln and Delta, family and friends. Shepard joked that a daughter’s finger partly covered a photo of the couple.',
  },
  {
    id: '5ccdaff4-3a70-46cb-a4a8-4f52d96939e4',
    summary:
      'A raccoon broke into a Virginia liquor store, knocked over bottles and was found passed out in the bathroom. Animal control later released it unharmed.',
  },
  {
    id: '71a02ee2-afb2-4c38-82a8-667e594d4a5e',
    summary:
      'Gene Simmons suggested former KISS bandmate Ace Frehley’s death followed “bad decisions,” drawing criticism. Frehley’s death after a fall had been ruled an accident, and Simmons later apologized for his wording.',
  },
  {
    id: '7a044e76-92eb-4bdb-aaae-2d9f3691910d',
    summary:
      'This original song satirizes premium hourly fees at large companies, with brand names, specialist work and rising invoices driving the joke. Its saved input does not identify a specific news event.',
  },
  {
    id: '7cbbe13c-5cd1-42bf-9520-3f371096af11',
    summary:
      'Rapper G Herbo proposed to his longtime partner Taina Williams on New Year’s Eve at a Miami restaurant, surrounded by family and friends. She said yes.',
  },
  {
    id: '8155fdcb-1ef0-456e-9a9b-a7b4c7a52d68',
    summary:
      'Online speculation linked Sydney Sweeney to the next James Bond film, but TMZ reported that she was not in talks for a Bond Girl role at the time. The song plays with that casting rumor.',
  },
  {
    id: '874cf370-e018-4e0d-b7fd-c73e7347845a',
    summary:
      'Brooklyn Beckham and Nicola Peltz celebrated New Year’s Eve at a South Florida club while reports of tension with the Beckham family continued. They were seen dancing during 50 Cent’s performance.',
  },
  {
    id: '8b31dbe4-f50d-4fb3-adfb-6abdb81062b9',
    summary:
      'Donald Trump and Elon Musk were seen together at a dinner at Mar-a-Lago after a public falling-out the previous year, fueling talk that their relationship had improved.',
  },
  {
    id: '9b00f64a-c6e6-475d-b3c3-c1650dcae4c5',
    summary:
      'An article showcased a roughly $1.7 million luxury motorhome with its own garage, turning a road-trip vehicle into a lavish home on wheels.',
  },
  {
    id: 'd9e0eab7-21d0-485e-84c3-2a906c2c2df5',
    summary:
      'Timothée Chalamet thanked Kylie Jenner during his Best Actor acceptance speech at the Critics Choice Awards and publicly told her he loved her. Jenner appeared to mouth the words back.',
  },
  {
    id: 'f44581e9-015e-422a-a3eb-ea118b6abffb',
    summary:
      'Hailee Steinfeld, expecting her first child with Josh Allen, shared a photo of a sweater embroidered “Baby Beau,” prompting speculation about the baby’s name.',
  },
  {
    id: 'fccb884e-bbcd-4247-9503-e190efb346d0',
    summary:
      'Ellen DeGeneres and Portia de Rossi were seen in Montecito during a visit to the U.S. after moving to England. Photos of the outing drew comments about DeGeneres’s appearance.',
  },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('缺少 DATABASE_URL');
  }

  const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
  try {
    let updated = 0;
    let publishedSongs = 0;
    await sql.begin(async (tx) => {
      for (const { id, summary } of summaries) {
        const rows = await tx`
          SELECT st.id, st.news_summary,
            (SELECT count(*)::int FROM scooprym.song so
             WHERE so.story_id = st.id AND so.is_published = true) AS published_songs
          FROM scooprym.story st
          WHERE st.id = ${id}
          FOR UPDATE OF st
        `;
        if (rows.length !== 1 || rows[0].published_songs === 0) {
          throw new Error(`找不到对应已发布歌曲的新闻记录：${id}`);
        }
        publishedSongs += rows[0].published_songs;
        if (rows[0].news_summary?.trim()) {
          continue;
        }
        const changed = await tx`
          UPDATE scooprym.story
          SET news_summary = ${summary}, updated_at = now()
          WHERE id = ${id} AND (news_summary IS NULL OR btrim(news_summary) = '')
          RETURNING id
        `;
        if (changed.length !== 1) {
          throw new Error(`新闻摘要在更新期间发生变化：${id}`);
        }
        updated += 1;
      }
    });
    console.log(`覆盖 ${publishedSongs} 首已发布歌曲的 ${summaries.length} 条新闻；本次新增 ${updated} 条摘要。`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
