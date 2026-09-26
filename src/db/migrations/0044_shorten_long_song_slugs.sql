-- 仅缩短已核对的 17 条过长地址；旧地址由路由按歌曲 ID 永久跳转。
WITH updates(id, old_slug, new_slug) AS (
  VALUES
  ('21b9a635-36ed-4073-8948-547a651cce0e', 'fans-are-howling-after-j-law-rehomed-her-dog-after-a-bite-incident-the-internet-is-losing-funny-song-3', 'j-law-dog-rehoming-bite-incident-funny-song-3'),
  ('3a231eca-3296-455b-a51b-9651c679dae7', 'mychal-thompson-plays-matchmaker-for-his-son-klay-with-megan-thee-stallion-over-a-kitchen-funny-song-6', 'mychal-thompson-klay-megan-matchmaking-funny-song-6'),
  ('9f053601-b4af-417c-aac8-239d1be7da18', 'mychal-thompson-plays-matchmaker-for-his-son-klay-with-megan-thee-stallion-over-a-kitchen-funny-song-7', 'mychal-thompson-klay-megan-matchmaking-funny-song-7'),
  ('3b33e7a4-8d05-430c-ad82-bed6a73d9648', 'mychal-thompson-plays-matchmaker-for-his-son-klay-with-megan-thee-stallion-over-a-kitchen-funny-song-9', 'mychal-thompson-klay-megan-matchmaking-funny-song-9'),
  ('154ca807-4664-49b6-960c-d2f93463aa35', 'a-florida-sheriff-is-fighting-a-bizarre-gta-6-fueled-campaign-to-turn-miami-into-real-life-funny-song', 'florida-sheriff-gta-6-vice-city-campaign-funny-song'),
  ('06c8396c-e1da-4cd5-8bf3-a8f05274b6a1', 'a-grave-robber-gets-busted-after-hoarding-100-corpses-in-a-cluttered-mess-worst-roommate-funny-song-2', 'grave-robber-100-corpses-arrest-funny-song-2'),
  ('5c4cf230-6a23-4fa6-b4ab-9b2512bff2fd', 'a-high-stakes-digital-fallout-occurs-when-a-streamer-leaks-private-voice-notes-following-a-funny-song', 'streamer-private-voice-note-leak-funny-song'),
  ('604cbb79-0576-4498-8cd6-2ce98d02dc77', 'a-suspect-in-the-brown-university-shooting-that-left-two-students-dead-has-been-identified-funny-song', 'brown-university-shooting-suspect-identified-funny-song'),
  ('955f87cf-3367-4517-92d5-e3de9753c894', 'a-viral-youtube-series-has-been-turned-into-a-video-game-where-players-must-draw-their-own-funny-song', 'viral-youtube-drawing-combat-game-funny-song'),
  ('a1aa6af9-448d-496b-88f2-3799114c2933', 'comedian-meg-stalter-hit-the-emmys-2026-red-carpet-painted-head-to-toe-gold-as-a-full-emmy-funny-song', 'meg-stalter-gold-emmys-outfit-funny-song'),
  ('b5fe0039-9eef-4893-8961-8b54e6a89f9e', 'florida-man-arrested-for-trespassing-while-concealing-a-loaded-firearm-within-prosthetic-funny-song-3', 'florida-man-prosthetic-breasts-gun-arrest-funny-song-3'),
  ('1f681c1e-57ca-4efd-9776-6e12283a94a4', 'hailey-bieber-just-called-out-scooter-braun-for-his-lack-of-support-during-justin-s-latest-funny-song', 'hailey-bieber-scooter-braun-support-claim-funny-song'),
  ('e66bb6d4-3fbb-4a2f-a0a6-7c0db7427827', 'hollywood-s-elite-swap-the-red-carpet-for-rubber-ducks-splashing-cash-while-they-soak-in-funny-song-2', 'hollywood-rubber-duck-luxury-baths-funny-song-2'),
  ('95ec8b9c-4256-44a3-b47c-9ac5d0cd9892', 'karamo-brown-ditches-queer-eye-interviews-in-a-sudden-ghosting-act-the-fab-five-is-down-funny-song-10', 'karamo-brown-queer-eye-interview-exit-funny-song-10'),
  ('d0087e85-e950-4a22-af47-882cdf235f40', 'karamo-brown-ditches-queer-eye-interviews-in-a-sudden-ghosting-act-the-fab-five-is-down-funny-song-11', 'karamo-brown-queer-eye-interview-exit-funny-song-11'),
  ('2f30aa65-6f44-45ab-872c-510cce4a022c', 'trisha-paytas-runs-for-congress-while-timoth-e-and-kylie-dominate-the-headlines-d-c-goes-funny-song-2', 'trisha-paytas-congress-run-funny-song-2'),
  ('6cc68d73-23d7-45c2-a161-a886709349a6', 'katy-perry-s-2017-snl-swish-swish-performance-with-the-backpack-kid-went-viral-again-funny-song', 'katy-perry-swish-swish-snl-viral-funny-song')
)
UPDATE "scooprym"."song" AS s
SET "seo_slug" = updates.new_slug
FROM updates
WHERE s."id" = updates.id AND s."seo_slug" = updates.old_slug;
