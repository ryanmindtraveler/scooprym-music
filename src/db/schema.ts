
import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgSchema, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const scooprymSchema = pgSchema('scooprym');

// 一条热点只允许一个自动生产任务，稳定ID贯穿歌词和音频，重复点击不新建付费任务。
export const radarCreationJob = scooprymSchema.table('radar_creation_job', {
  candidateId: text('candidate_id').primaryKey(),
  userId: text('user_id').notNull(),
  runId: text('run_id').notNull().unique(),
  songId: text('song_id').notNull().unique(),
  sourceUrl: text('source_url').notNull(),
  sourceTitle: text('source_title').notNull(),
  direction: text('direction').notNull(),
  status: text('status').notNull().default('queued'),
  sequence: integer('sequence').notNull().default(0),
  leaseId: text('lease_id'),
  leaseUntil: timestamp('lease_until', { withTimezone: true }),
  lyricResult: jsonb('lyric_result').$type<{ title: string; lyrics: string; summary: string; sourceText?: string }>(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// 独立保存每日选题快照，候选新闻后续编辑或删除不影响历史归档。
export const hotSheetEdition = scooprymSchema.table('hot_sheet_edition', {
  day: text('day').primaryKey(),
  status: text('status').notNull(),
  attemptId: text('attempt_id').notNull(),
  stories: jsonb('stories').$type<Array<{
    id: string;
    sourceTitle: string;
    sourceUrl: string;
    category: string;
    sourceDomain: string;
    publishedAt: string | null;
  }>>().notNull().default([]),
  discovered: integer('discovered').notNull().default(0),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  error: text('error'),
});

export const user = scooprymSchema.table('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  customerId: text('customer_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  role: text('role').default('user'),
  banned: boolean('banned'),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
});

export const session = scooprymSchema.table(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    impersonatedBy: text('impersonated_by'),
  },
  (table) => ({
    sessionTokenIdx: index('session_token_idx').on(table.token),
    sessionUserIdIdx: index('session_user_id_idx').on(table.userId),
  })
);

export const account = scooprymSchema.table(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => ({
    accountUserIdIdx: index('account_user_id_idx').on(table.userId),
    accountAccountIdIdx: index('account_account_id_idx').on(table.accountId),
    accountProviderIdIdx: index('account_provider_id_idx').on(table.providerId),
  })
);

export const verification = scooprymSchema.table('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

export const payment = scooprymSchema.table(
  'payment',
  {
    id: text('id').primaryKey(),
    priceId: text('price_id').notNull(),
    amount: integer('amount').notNull().default(0),
    type: text('type').notNull(),
    scene: text('scene'),
    interval: text('interval'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    customerId: text('customer_id').notNull(),
    subscriptionId: text('subscription_id'),
    sessionId: text('session_id'),
    invoiceId: text('invoice_id').unique(),
    status: text('status').notNull(),
    paid: boolean('paid').notNull().default(false),
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end'),
    trialStart: timestamp('trial_start'),
    trialEnd: timestamp('trial_end'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    paymentTypeIdx: index('payment_type_idx').on(table.type),
    paymentSceneIdx: index('payment_scene_idx').on(table.scene),
    paymentPriceIdIdx: index('payment_price_id_idx').on(table.priceId),
    paymentUserIdIdx: index('payment_user_id_idx').on(table.userId),
    paymentCustomerIdIdx: index('payment_customer_id_idx').on(table.customerId),
    paymentStatusIdx: index('payment_status_idx').on(table.status),
    paymentPaidIdx: index('payment_paid_idx').on(table.paid),
    paymentSubscriptionIdIdx: index('payment_subscription_id_idx').on(table.subscriptionId),
    paymentSessionIdIdx: index('payment_session_id_idx').on(table.sessionId),
    paymentInvoiceIdIdx: index('payment_invoice_id_idx').on(table.invoiceId),
  })
);

export const userCredit = scooprymSchema.table(
  'user_credit',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    currentCredits: integer('current_credits').notNull().default(0),
    lastRefreshAt: timestamp('last_refresh_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    userCreditUserIdIdx: index('user_credit_user_id_idx').on(table.userId),
  })
);

export const creditTransaction = scooprymSchema.table(
  'credit_transaction',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    description: text('description'),
    amount: integer('amount').notNull(),
    remainingAmount: integer('remaining_amount'),
    paymentId: text('payment_id'),
    expirationDate: timestamp('expiration_date'),
    expirationDateProcessedAt: timestamp('expiration_date_processed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    creditTransactionUserIdIdx: index('credit_transaction_user_id_idx').on(table.userId),
    creditTransactionTypeIdx: index('credit_transaction_type_idx').on(table.type),
  })
);

export const story = scooprymSchema.table(
  'story',
  {
    id: text('id').primaryKey(),
    sourceUrl: text('source_url'),
    sourceText: text('source_text'),
    newsSummary: text('news_summary'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    storySourceUrlUnique: uniqueIndex('story_source_url_unique').on(table.sourceUrl),
    storyCreatedAtIdx: index('story_created_at_idx').on(table.createdAt),
  })
);

/**
 * 后台新闻雷达抓取到的候选内容。
 * 候选内容与正式 story 分离，管理员完成筛选前不会进入音乐生产流程。
 */
/** 扫描记录同时保存渠道健康情况，部分失败和全失败也必须可追踪。 */
export const storyRadarScan = scooprymSchema.table('story_radar_scan', {
  id: text('id').primaryKey(),
  status: text('status').notNull().default('running'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  discovered: integer('discovered').notNull().default(0),
  inserted: integer('inserted').notNull().default(0),
  updated: integer('updated').notNull().default(0),
  sources: jsonb('sources').$type<import('@/lib/story-radar/types').RadarSourceReport[]>().notNull().default([]),
  error: text('error'),
}, (table) => ({
  scanStartedIdx: index('story_radar_scan_started_idx').on(table.startedAt),
  singleRunningScan: uniqueIndex('story_radar_scan_running_unique').on(table.status).where(sql`${table.status} = 'running'`),
}));

export const storyCandidate = scooprymSchema.table(
  'story_candidate',
  {
    id: text('id').primaryKey(),
    provider: text('provider').notNull().default('rss'),
    sourceUrl: text('source_url').notNull(),
    sourceTitle: text('source_title').notNull(),
    sourceDomain: text('source_domain').notNull(),
    sourceImageUrl: text('source_image_url'),
    category: text('category').notNull(),
    matchedTerms: text('matched_terms'),
    aiScreening: jsonb('ai_screening').$type<import('@/lib/story-radar/screening-state').ScreeningState>(),
    trendSignals: jsonb('trend_signals').$type<import('@/lib/story-radar/types').GoogleTrendSignal[]>(),
    relevanceScore: integer('relevance_score').notNull().default(0),
    status: text('status').notNull().default('new'),
    storyId: text('story_id').references(() => story.id, { onDelete: 'set null' }),
    adoptedAt: timestamp('adopted_at'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    storyCandidateSourceUrlUnique: uniqueIndex('story_candidate_source_url_unique').on(table.sourceUrl),
    storyCandidateStatusPublishedIdx: index('story_candidate_status_published_idx').on(
      table.status,
      table.publishedAt
    ),
    storyCandidateCategoryIdx: index('story_candidate_category_idx').on(table.category),
    storyCandidateStoryIdIdx: index('story_candidate_story_id_idx').on(table.storyId),
    storyCandidateCategoryCheck: check(
      'story_candidate_category_check',
      sql`${table.category} in ('celebrity_drama', 'internet_chaos', 'absurd_headlines')`
    ),
    storyCandidateStatusCheck: check(
      'story_candidate_status_check',
      sql`${table.status} in ('new', 'shortlisted', 'adopted', 'dismissed')`
    ),
  })
);

/** 已清理候选的来源链接，防止无发表日期的旧报道在后续扫描中重新入库。 */
export const storyCandidateTombstone = scooprymSchema.table('story_candidate_tombstone', {
  sourceUrl: text('source_url').primaryKey(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * 用户对新闻雷达候选话题的投票记录。
 * 每位用户每天最多选择三个候选话题；同一天修改选择时，会整体替换当天的投票集合。
 * 历史记录用于三日加权统计。
 */
export const storyCandidateVote = scooprymSchema.table(
  'story_candidate_vote',
  {
    id: text('id').primaryKey(),
    candidateId: text('candidate_id')
      .notNull()
      .references(() => storyCandidate.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    voteDay: text('vote_day').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    storyCandidateVoteCandidateCreatedIdx: index('story_candidate_vote_candidate_created_idx').on(
      table.candidateId,
      table.createdAt
    ),
    storyCandidateVoteUserCreatedIdx: index('story_candidate_vote_user_created_idx').on(
      table.userId,
      table.createdAt
    ),
    storyCandidateVoteDayCandidateIdx: index('story_candidate_vote_day_candidate_idx').on(
      table.voteDay,
      table.candidateId
    ),
    storyCandidateVoteUserDayCandidateUnique: uniqueIndex('story_candidate_vote_user_day_candidate_unique').on(
      table.userId,
      table.voteDay,
      table.candidateId
    ),
  })
);

/**
 * 读者提交给编辑部的公开新闻线索。
 * 相同来源链接只保留一个审核条目，并通过 submissionCount 汇总重复投稿热度。
 */
export const storySubmission = scooprymSchema.table(
  'story_submission',
  {
    id: text('id').primaryKey(),
    sourceUrl: text('source_url'),
    sourceDomain: text('source_domain'),
    note: text('note'),
    sourceTitle: text('source_title'),
    sourceDescription: text('source_description'),
    sourceImageUrl: text('source_image_url'),
    sourcePublishedAt: timestamp('source_published_at'),
    submittedBy: text('submitted_by').references(() => user.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('pending'),
    submissionCount: integer('submission_count').notNull().default(1),
    candidateId: text('candidate_id').references(() => storyCandidate.id, { onDelete: 'set null' }),
    reviewedBy: text('reviewed_by').references(() => user.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    rejectionReason: text('rejection_reason'),
    lastSubmittedAt: timestamp('last_submitted_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    storySubmissionSourceUrlUnique: uniqueIndex('story_submission_source_url_unique').on(table.sourceUrl),
    storySubmissionStatusSubmittedIdx: index('story_submission_status_submitted_idx').on(
      table.status,
      table.lastSubmittedAt
    ),
    storySubmissionSubmitterIdx: index('story_submission_submitter_idx').on(table.submittedBy),
    storySubmissionCandidateIdx: index('story_submission_candidate_idx').on(table.candidateId),
    storySubmissionStatusCheck: check(
      'story_submission_status_check',
      sql`${table.status} in ('pending', 'adopted', 'rejected')`
    ),
    storySubmissionUrlLengthCheck: check(
      'story_submission_url_length_check',
      sql`${table.sourceUrl} is null or char_length(${table.sourceUrl}) between 12 and 2048`
    ),
    storySubmissionNoteLengthCheck: check(
      'story_submission_note_length_check',
      sql`${table.note} is null or char_length(btrim(${table.note})) between 10 and 280`
    ),
    storySubmissionContentCheck: check(
      'story_submission_content_check',
      sql`${table.sourceUrl} is not null or ${table.note} is not null`
    ),
    storySubmissionRejectionReasonCheck: check(
      'story_submission_rejection_reason_check',
      sql`${table.rejectionReason} is null or char_length(btrim(${table.rejectionReason})) between 4 and 280`
    ),
    storySubmissionCountCheck: check('story_submission_count_check', sql`${table.submissionCount} >= 1`),
  })
);

export const song = scooprymSchema.table(
  'song',
  {
    id: text('id').primaryKey(),
    storyId: text('story_id')
      .notNull()
      .references(() => story.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    // 发布时固定的可读网址，标题与新闻摘要后续编辑不改变它。
    seoSlug: text('seo_slug'),
    lyrics: text('lyrics'),
    audioUrl: text('audio_url').notNull(),
    audioKey: text('audio_key'),
    // 封面图片存储在对象存储中，这里保存访问 URL 与存储 key
    coverImageUrl: text('cover_image_url'),
    coverImageKey: text('cover_image_key'),
    durationSec: integer('duration_sec'),
    plays: integer('plays').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    isAdminGenerated: boolean('is_admin_generated').default(false),
    isPublished: boolean('is_published').default(false),
    scheduledAt: timestamp('scheduled_at'),
    publishedAt: timestamp('published_at'),
  },
  (table) => ({
    songStoryIdIdx: index('song_story_id_idx').on(table.storyId),
    songUserIdIdx: index('song_user_id_idx').on(table.userId),
    songCreatedAtIdx: index('song_created_at_idx').on(table.createdAt),
    songScheduledAtIdx: index('song_scheduled_at_idx').on(table.scheduledAt),
    songPublishedAtIdx: index('song_published_at_idx').on(table.publishedAt),
    songSeoSlugUniqueIdx: uniqueIndex('song_seo_slug_unique_idx').on(table.seoSlug),
  })
);

export const generationAttempt = scooprymSchema.table(
  'generation_attempt',
  {
    id: text('id').primaryKey(),
    songId: text('song_id')
      .notNull()
      .references(() => song.id, { onDelete: 'cascade' }),
    prompt: text('prompt'),
    generationPrompt: text('generation_prompt'),
    coverArtPrompt: text('cover_art_prompt'),
    outputFormat: text('output_format').notNull().default('url'),
    audioFormat: text('audio_format').notNull().default('mp3'),
    generationRequestHash: text('generation_request_hash'),
    generationBillingMode: text('generation_billing_mode').notNull().default('internal_admin'),
    processingStatus: text('processing_status').default('queued'),
    processingError: text('processing_error'),
    creditsDeducted: boolean('credits_deducted').default(false),
    creditError: text('credit_error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    generationAttemptSongIdIdx: index('generation_attempt_song_id_idx').on(table.songId),
    generationAttemptStatusUpdatedIdx: index('generation_attempt_status_updated_idx').on(
      table.processingStatus,
      table.updatedAt
    ),
    generationAttemptSongCreatedIdx: index('generation_attempt_song_created_idx').on(table.songId, table.createdAt),
  })
);

/**
 * 一次完整的歌曲创作运行。它跨越歌词、人工确认、音频、封面和收尾阶段，
 * 与具体供应商解耦，允许页面刷新后恢复，也允许后台按阶段重试。
 */
export const songCreationRun = scooprymSchema.table(
  'song_creation_run',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    songId: text('song_id').references(() => song.id, { onDelete: 'set null' }),
    status: text('status').notNull().default('running'),
    currentStage: text('current_stage').notNull().default('source_ready'),
    workflowVersion: integer('workflow_version').notNull().default(1),
    sourceMode: text('source_mode'),
    sourceUrl: text('source_url'),
    sourceText: text('source_text'),
    directionPrompt: text('direction_prompt'),
    productionVariantId: text('production_variant_id'),
    title: text('title'),
    summary: text('summary'),
    lyrics: text('lyrics'),
    lyricWorkshop: jsonb('lyric_workshop'),
    inputHash: text('input_hash'),
    lastError: text('last_error'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    songCreationRunUserUpdatedIdx: index('song_creation_run_user_updated_idx').on(table.userId, table.updatedAt),
    songCreationRunSongIdx: index('song_creation_run_song_idx').on(table.songId),
    songCreationRunStatusUpdatedIdx: index('song_creation_run_status_updated_idx').on(
      table.status,
      table.updatedAt
    ),
  })
);

/**
 * 工作流步骤日志。每次尝试单独保留，不覆盖旧错误，便于审计成本与定位故障。
 */
export const songCreationStep = scooprymSchema.table(
  'song_creation_step',
  {
    id: text('id').primaryKey(),
    runId: text('run_id')
      .notNull()
      .references(() => songCreationRun.id, { onDelete: 'cascade' }),
    stage: text('stage').notNull(),
    status: text('status').notNull().default('running'),
    attempt: integer('attempt').notNull().default(1),
    provider: text('provider'),
    model: text('model'),
    outputMetadata: jsonb('output_metadata'),
    error: text('error'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    songCreationStepRunStartedIdx: index('song_creation_step_run_started_idx').on(table.runId, table.startedAt),
    songCreationStepRunStageIdx: index('song_creation_step_run_stage_idx').on(table.runId, table.stage),
  })
);

export const songPlay = scooprymSchema.table(
  'song_play',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    songId: text('song_id')
      .notNull()
      .references(() => song.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    songPlayUserIdIdx: index('song_play_user_id_idx').on(table.userId),
    songPlayUserCreatedAtIdx: index('song_play_user_created_at_idx').on(table.userId, table.createdAt),
    songPlaySongIdIdx: index('song_play_song_id_idx').on(table.songId),
    songPlaySongCreatedAtIdx: index('song_play_song_created_at_idx').on(table.songId, table.createdAt),
  })
);

/**
 * 匿名与登录用户共用的内容消费事件，用于计算播放漏斗。
 * actorKey 使用账户 ID 或匿名浏览器 ID，不保存原始 IP。
 */
export const songEngagementEvent = scooprymSchema.table(
  'song_engagement_event',
  {
    id: text('id').primaryKey(),
    songId: text('song_id')
      .notNull()
      .references(() => song.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    actorKey: text('actor_key').notNull(),
    eventSessionId: text('event_session_id').notNull(),
    eventType: text('event_type').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    songEngagementEventUnique: uniqueIndex('song_engagement_event_unique').on(
      table.songId,
      table.actorKey,
      table.eventSessionId,
      table.eventType
    ),
    songEngagementEventTypeCreatedIdx: index('song_engagement_event_type_created_idx').on(
      table.eventType,
      table.createdAt
    ),
    songEngagementEventSongCreatedIdx: index('song_engagement_event_song_created_idx').on(
      table.songId,
      table.createdAt
    ),
    songEngagementEventTypeCheck: check(
      'song_engagement_event_type_check',
      sql`${table.eventType} in ('detail_view', 'play_start', 'play_qualified', 'play_complete', 'share')`
    ),
  })
);

export const songFavorite = scooprymSchema.table(
  'song_favorite',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    songId: text('song_id')
      .notNull()
      .references(() => song.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    songFavoriteUserIdIdx: index('song_favorite_user_id_idx').on(table.userId),
    songFavoriteUserCreatedAtIdx: index('song_favorite_user_created_at_idx').on(table.userId, table.createdAt),
    songFavoriteSongIdIdx: index('song_favorite_song_id_idx').on(table.songId),
  })
);

export const songReaction = scooprymSchema.table(
  'song_reaction',
  {
    id: text('id').primaryKey(),
    songId: text('song_id')
      .notNull()
      .references(() => song.id, { onDelete: 'cascade' }),
    actorKey: text('actor_key').notNull(),
    reactionType: text('reaction_type').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    songReactionSongActorUnique: uniqueIndex('song_reaction_song_actor_unique').on(table.songId, table.actorKey),
    songReactionSongTypeIdx: index('song_reaction_song_type_idx').on(table.songId, table.reactionType),
    songReactionTypeCheck: check(
      'song_reaction_type_check',
      sql`${table.reactionType} in ('clown', 'dead', 'popcorn', 'eyes', 'receipts')`
    ),
  })
);

/**
 * 歌曲详情页的公开评论。
 * 评论与歌曲、登录用户分别关联，歌曲或账户删除时同步清理。
 */
export const songComment = scooprymSchema.table(
  'song_comment',
  {
    id: text('id').primaryKey(),
    songId: text('song_id')
      .notNull()
      .references(() => song.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    status: text('status').notNull().default('visible'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    songCommentSongCreatedIdx: index('song_comment_song_created_idx').on(table.songId, table.createdAt),
    songCommentUserCreatedIdx: index('song_comment_user_created_idx').on(table.userId, table.createdAt),
    songCommentContentLengthCheck: check(
      'song_comment_content_length_check',
      sql`char_length(btrim(${table.content})) between 1 and 500`
    ),
    songCommentStatusCheck: check('song_comment_status_check', sql`${table.status} in ('visible', 'hidden')`),
  })
);

/** 用户对公开评论的举报，交由管理员审核。 */
export const songCommentReport = scooprymSchema.table(
  'song_comment_report',
  {
    id: text('id').primaryKey(),
    commentId: text('comment_id')
      .notNull()
      .references(() => songComment.id, { onDelete: 'cascade' }),
    reporterId: text('reporter_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('pending'),
    handledBy: text('handled_by').references(() => user.id, { onDelete: 'set null' }),
    handledAt: timestamp('handled_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    songCommentReportReporterUnique: uniqueIndex('song_comment_report_reporter_unique').on(
      table.commentId,
      table.reporterId
    ),
    songCommentReportStatusCreatedIdx: index('song_comment_report_status_created_idx').on(
      table.status,
      table.createdAt
    ),
    songCommentReportReasonCheck: check(
      'song_comment_report_reason_check',
      sql`${table.reason} in ('spam', 'harassment', 'misinformation', 'other')`
    ),
    songCommentReportStatusCheck: check(
      'song_comment_report_status_check',
      sql`${table.status} in ('pending', 'actioned', 'dismissed')`
    ),
  })
);

// 封面恢复点不进入公开歌曲或工作流响应，歌曲删除时一并清理。
export const coverAssetCheckpoint = scooprymSchema.table('cover_asset_checkpoint', {
  id: text('id').primaryKey(),
  songId: text('song_id').notNull().references(() => song.id, { onDelete: 'cascade' }),
  imageSource: text('image_source'),
  uploadedAsset: jsonb('uploaded_asset').$type<{ url: string; key: string; dimensions: { width: number; height: number } | null }>(),
  leaseToken: text('lease_token'),
  leaseUntil: timestamp('lease_until', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
