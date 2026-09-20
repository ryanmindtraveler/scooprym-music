/** 主题页只从已发布作品中选择匹配项；这些词用于筛选，不作为新闻事实发布。 */
export const songTopicTerms: Record<string, string[]> = {
  'absurd-social-phenomena': ['raccoon', 'florida', 'police', 'court', 'weird', 'bizarre', 'pasta', 'robot'],
  'entertainment-topics': ['actor', 'actress', 'singer', 'hollywood', 'premiere', 'award', 'movie', 'grammy', 'miley'],
  'gossip-roast': ['dating', 'divorce', 'feud', 'relationship', 'rumor', 'breakup', 'boyfriend', 'girlfriend'],
  'news-parody': ['trump', 'vance', 'congress', 'government', 'president', 'politic', 'election'],
  'meme-culture': ['meme', 'viral', 'tiktok', 'influencer', 'livestream', 'internet', 'online', 'brainrot'],
  'comedy-drill': ['drill'],
};
