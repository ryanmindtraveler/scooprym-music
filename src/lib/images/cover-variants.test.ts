import { describe, expect, it } from 'vitest';
import { getCoverFamilyKeys, getCoverSources, getSmallCoverSource } from './cover-variants';

const prefix = `https://covers.example.com/song-covers/one/cover-v1-${'a'.repeat(64)}`;
describe('预生成封面地址', () => {
  it('生成真实宽度的三个候选，取色使用最小图', () => {
    const src = `${prefix}/w1024.webp`;
    expect(getCoverSources(src).srcSet).toBe(`${prefix}/w160.webp 160w, ${prefix}/w480.webp 480w, ${src} 1024w`);
    expect(getSmallCoverSource(src)).toBe(`${prefix}/w160.webp`);
  });
  it('小图不引用放大的尺寸或重复候选', () => {
    expect(getCoverSources(`${prefix}/w120.webp`).srcSet).toBe(`${prefix}/w120.webp 120w`);
    expect(getCoverSources(`${prefix}/w480.webp`).srcSet).toBe(`${prefix}/w160.webp 160w, ${prefix}/w480.webp 480w`);
  });
  it('旧图没有映射时不猜测派生图是否存在', () => {
    expect(getCoverSources('https://old.example.com/cover.png')).toEqual({
      src: 'https://old.example.com/cover.png',
      srcSet: undefined,
    });
  });
  it('只清理版本化封面家族，不扩大到音频和普通图片', () => {
    const key = `song-covers/one/cover-v1-${'a'.repeat(64)}/w1024.webp`;
    expect(getCoverFamilyKeys(key)).toEqual([key.replace('w1024', 'w160'), key.replace('w1024', 'w480'), key]);
    expect(getCoverFamilyKeys('audio/one.mp3')).toEqual(['audio/one.mp3']);
  });
});
