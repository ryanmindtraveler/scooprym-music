import { describe, expect, it } from 'vitest';
import { inspectSongLyrics, inspectSongProduct, readImageDimensions } from './song-product-check';

const validSong = {
  title: 'Property Line',
  lyrics:
    '[Verse 1]\nOne line here\nTwo lines here\nThree lines here\nFour lines here\n[Hook]\nFive lines here\nSix lines here\nSeven lines here\nEight lines here',
  audioUrl: 'https://cdn.example.com/song.mp3',
  audioKey: 'songs/song.mp3',
  coverImageUrl: 'https://cdn.example.com/cover.png',
  coverImageKey: 'covers/cover.png',
  durationSec: 62,
  sourceUrl: 'https://example.com/story',
  coverDimensions: { width: 1024, height: 1024 },
};

describe('inspectSongProduct', () => {
  it('拒绝无限气场事故中的空段落与审校字段碎片', () => {
    const result = inspectSongLyrics(
      "[Intro]\n[Verse 1]\n[Hook]\nselections recorded for the final cut.', craft\nIssues: [], risks: [] }\n[Outro]"
    );
    expect(result.passed).toBe(false);
    expect(result.issues).toContain('Lyrics contain structured response metadata instead of sung text.');
  });

  it('即使有足够歌词行数也不能夹带程序字段', () => {
    expect(inspectSongLyrics(`${validSong.lyrics}\ncraftIssues: []`).passed).toBe(false);
  });

  it('正常歌词中的 risks 单词和呼应不误拦截', () => {
    expect(inspectSongLyrics(`${validSong.lyrics}\nWe take risks (so high!)`).passed).toBe(true);
  });
  it('通过完整的待发布成品', () => {
    expect(inspectSongProduct(validSong)).toMatchObject({ passed: true, issues: [] });
  });

  it('自动恢复 HTML 换行，但仍拒绝缺失音频和非方形小封面', () => {
    const result = inspectSongProduct({
      ...validSong,
      lyrics: validSong.lyrics.replace('One line here', '<br>One line here'),
      audioKey: null,
      coverDimensions: { width: 640, height: 1024 },
    });

    expect(result.passed).toBe(false);
    expect(result.checks.lyrics).toBe(true);
    expect(result.issues).toHaveLength(2);
  });

  it('在付费生成前返回明确的歌词格式问题', () => {
    const result = inspectSongLyrics('[Verse 1]<br>Only one line');

    expect(result.passed).toBe(false);
    expect(result.lyrics).toBe('[Verse 1]\nOnly one line');
    expect(result.issues).toEqual(['Lyrics need at least 8 sung lines; found 1.']);
  });

  it('按统一规则识别带制作说明且与正文粘连的旧歌词', () => {
    const result = inspectSongProduct({
      ...validSong,
      lyrics:
        '[Verse 1 - dry gossip tone]One line here\nTwo lines here\nThree lines here\nFour lines here[Hook - group reply]Five lines here\nSix lines here\nSeven lines here\nEight lines here',
    });

    expect(result.checks.lyrics).toBe(true);
  });

  it('没有真实音频时长时保留人工确认警告，而不是伪造失败', () => {
    const result = inspectSongProduct({ ...validSong, durationSec: null });
    expect(result.passed).toBe(true);
    expect(result.checks.duration).toBeNull();
    expect(result.warnings).toContain('Finished audio duration still requires administrator confirmation.');
  });

  it('拒绝把通用兜底图当作可发布封面', () => {
    const result = inspectSongProduct({ ...validSong, coverFallback: true });
    expect(result.passed).toBe(false);
    expect(result.checks.cover).toBe(false);
  });

  it('无需完整解码即可读取 PNG 封面尺寸', () => {
    const pngHeader = Buffer.alloc(24);
    pngHeader.write('PNG', 1, 'ascii');
    pngHeader.write('IHDR', 12, 'ascii');
    pngHeader.writeUInt32BE(1024, 16);
    pngHeader.writeUInt32BE(1024, 20);
    expect(readImageDimensions(pngHeader, 'image/png')).toEqual({ width: 1024, height: 1024 });
  });
});
