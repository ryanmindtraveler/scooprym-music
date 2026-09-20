# GA 公众听歌统计

本次调整只影响统计，不修改作品发布状态、歌曲地址或收录规则。历史后台访问不会被自动清除，前后对比须区分上线日期。

## 采集范围

- 仅生产环境的实际 `https://scooprym.app` 域名启用；localhost、预览域名不启用。
- 等待身份检查，排除管理员账户及 `/admin`、`/zh/admin`、`/en/admin` 路径。身份检查失败暂不采集，以免运营数据混入。
- 已加载 Google 标签后通过官方 `ga-disable-测量ID` 开关停用。保留 GA 自动页面浏览，不再另发手工 page_view。
- 匿名运营访问仍无法自动识别；切换身份前已发生的数据不会追溯删除。
- 不更改自建歌曲行为数据库；自建统计仍可含管理员操作，不能直接与公众 GA 数量对账。

## 歌曲事件

| GA 事件 | 触发口径 |
| --- | --- |
| song_detail_view | 进入歌曲详情 |
| song_play_start | 音频实际触发 playing；暂停恢复不重复 |
| song_play_qualified | 同次播放累计实际收听达到30秒；暂停、缓冲、拖动不计 |
| song_play_complete | 音频结束且累计收听至少达到总时长90% |
| song_share | 链接成功写入剪贴板；不表示对方收到或成功发布社交平台 |

仅镜像自建 API 成功接受的公开歌曲事件。相同歌曲、事件、播放会话去重；第三方上报失败不影响业务。GA 参数只有 `song_id`，分享另含 `method=copy_link`，不上传自建用户和播放会话标识。标签加载前短暂排队，不绕过浏览器广告拦截，也不保证第三方全部接收。

## 报表配置与解读

在 GA 数据可用后使用上述事件建立探索漏斗：page_view → song_play_start → song_play_qualified → song_play_complete。song_share 单独观察。用户级漏斗可能跨歌曲，精确单次播放以自建事件的 eventSessionId 分析；不要宣称 GA 用户级漏斗等同同一首作品完整播放。

2026-09-20 已在 scooprym 属性（529274494）保存 song_play_qualified、song_share 两个关键事件，使用代码上报、按每次事件计数、不设置默认金额；已保存“歌曲 ID”事件范围自定义维度，对应参数 song_id。没有创建由 page_view 派生的重复事件。线上发出与 GA 收到仍需分别验收，关键事件注册不代表已有真实数据。

## 推广链接

对外运营链接统一使用真实渠道，例如 `https://scooprym.app/?utm_source=x&utm_medium=social&utm_campaign=weekly_songs`。邮件使用 medium=email。站内导航不加 UTM，避免覆盖原始来源。来源不同分别命名，不把没有UTM的Direct全部解释为品牌用户。

## 验证边界

自动化测试覆盖播放开始/暂停恢复/拖动/听完、管理员及路径排除、服务端拒绝、标签初始化排队与去重、剪贴板失败。

Google 官方说明：
- https://developers.google.com/tag-platform/security/guides/privacy
- https://developers.google.com/analytics/devguides/collection/ga4/views
- https://nextjs.org/docs/app/guides/third-party-libraries
