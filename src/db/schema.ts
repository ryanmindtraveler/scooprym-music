
import { boolean, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
        id: text("id").primaryKey(),
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

export const session = pgTable("session", {
        id: text("id").primaryKey(),
        expiresAt: timestamp('expires_at').notNull(),
        token: text('token').notNull().unique(),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull(),
        ipAddress: text('ip_address'),
        userAgent: text('user_agent'),
        userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
        impersonatedBy: text('impersonated_by')
}, (table) => ({
        sessionTokenIdx: index("session_token_idx").on(table.token),
        sessionUserIdIdx: index("session_user_id_idx").on(table.userId),
}));

export const account = pgTable("account", {
        id: text("id").primaryKey(),
        accountId: text('account_id').notNull(),
        providerId: text('provider_id').notNull(),
        userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
        accessToken: text('access_token'),
        refreshToken: text('refresh_token'),
        idToken: text('id_token'),
        accessTokenExpiresAt: timestamp('access_token_expires_at'),
        refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
        scope: text('scope'),
        password: text('password'),
        createdAt: timestamp('created_at').notNull(),
        updatedAt: timestamp('updated_at').notNull()
}, (table) => ({
        accountUserIdIdx: index("account_user_id_idx").on(table.userId),
        accountAccountIdIdx: index("account_account_id_idx").on(table.accountId),
        accountProviderIdIdx: index("account_provider_id_idx").on(table.providerId),
}));

export const verification = pgTable("verification", {
        id: text("id").primaryKey(),
        identifier: text('identifier').notNull(),
        value: text('value').notNull(),
        expiresAt: timestamp('expires_at').notNull(),
        createdAt: timestamp('created_at'),
        updatedAt: timestamp('updated_at')
});

export const payment = pgTable("payment", {
        id: text("id").primaryKey(),
        priceId: text('price_id').notNull(),
        amount: integer("amount").notNull().default(0),
        type: text('type').notNull(),
        scene: text('scene'), // payment scene: 'lifetime', 'credit', 'subscription'
        interval: text('interval'),
        userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
        customerId: text('customer_id').notNull(),
        subscriptionId: text('subscription_id'),
        sessionId: text('session_id'),
        invoiceId: text('invoice_id').unique(), // unique constraint for avoiding duplicate processing
        status: text('status').notNull(),
        paid: boolean('paid').notNull().default(false), // indicates whether payment is completed (set in invoice.paid event)
        periodStart: timestamp('period_start'),
        periodEnd: timestamp('period_end'),
        cancelAtPeriodEnd: boolean('cancel_at_period_end'),
        trialStart: timestamp('trial_start'),
        trialEnd: timestamp('trial_end'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
        paymentTypeIdx: index("payment_type_idx").on(table.type),
        paymentSceneIdx: index("payment_scene_idx").on(table.scene),
        paymentPriceIdIdx: index("payment_price_id_idx").on(table.priceId),
        paymentUserIdIdx: index("payment_user_id_idx").on(table.userId),
        paymentCustomerIdIdx: index("payment_customer_id_idx").on(table.customerId),
        paymentStatusIdx: index("payment_status_idx").on(table.status),
        paymentPaidIdx: index("payment_paid_idx").on(table.paid),
        paymentSubscriptionIdIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
        paymentSessionIdIdx: index("payment_session_id_idx").on(table.sessionId),
        paymentInvoiceIdIdx: index("payment_invoice_id_idx").on(table.invoiceId),
}));

export const userCredit = pgTable("user_credit", {
        id: text("id").primaryKey(),
        userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
        currentCredits: integer("current_credits").notNull().default(0),
        lastRefreshAt: timestamp("last_refresh_at"), // deprecated
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
        userCreditUserIdIdx: index("user_credit_user_id_idx").on(table.userId),
}));

export const creditTransaction = pgTable("credit_transaction", {
        id: text("id").primaryKey(),
        userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
        type: text("type").notNull(),
        description: text("description"),
        amount: integer("amount").notNull(),
        remainingAmount: integer("remaining_amount"),
        paymentId: text("payment_id"), // field name is paymentId, but actually it's invoiceId
        expirationDate: timestamp("expiration_date"),
        expirationDateProcessedAt: timestamp("expiration_date_processed_at"),
        createdAt: timestamp("created_at").notNull().defaultNow(),
        updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
        creditTransactionUserIdIdx: index("credit_transaction_user_id_idx").on(table.userId),
        creditTransactionTypeIdx: index("credit_transaction_type_idx").on(table.type),
}));

// Songs generated by users
export const song = pgTable(
        'song',
        {
                id: text('id').primaryKey(),
                userId: text('user_id')
                        .notNull()
                        .references(() => user.id, { onDelete: 'cascade' }),
                title: text('title').notNull(),
                lyrics: text('lyrics'),
                prompt: text('prompt'),
                sourceUrl: text('source_url'),
                sourceText: text('source_text'),
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
                creditsDeducted: boolean('credits_deducted').default(false),
                processingStatus: text('processing_status').default('processing'),
                creditError: text('credit_error'),
                newsSummary: text('news_summary'),
                isPublished: boolean('is_published').default(false),
        },
        (table) => ({
                songUserIdIdx: index('song_user_id_idx').on(table.userId),
                songCreatedAtIdx: index('song_created_at_idx').on(table.createdAt),
        }),
);

// User song play history (recently listened)
export const songPlay = pgTable(
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
    songPlayUserCreatedAtIdx: index(
      'song_play_user_created_at_idx',
    ).on(table.userId, table.createdAt),
    songPlaySongIdIdx: index('song_play_song_id_idx').on(table.songId),
  }),
);

// User favorite songs
export const songFavorite = pgTable(
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
    songFavoriteUserCreatedAtIdx: index(
      'song_favorite_user_created_at_idx',
    ).on(table.userId, table.createdAt),
    songFavoriteSongIdIdx: index('song_favorite_song_id_idx').on(table.songId),
  }),
);
