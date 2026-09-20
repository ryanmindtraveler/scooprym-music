import { describe, expect, it } from 'vitest';
import { selectRelatedSongs } from './related-songs';

describe('同题歌曲推荐', () => {
  it('排除当前歌曲以及仅大小写、空格、弯引号不同的同名版本', () => {
    expect(
      selectRelatedSongs({ id: 'a', title: 'Karamo’s Exit' }, [
        { id: 'a', title: 'Other title' },
        { id: 'b', title: " karamo's exit " },
        { id: 'c', title: 'Final Bow' },
        { id: 'd', title: 'FINAL BOW' },
        { id: 'e', title: '' },
      ])
    ).toEqual([{ id: 'c', title: 'Final Bow' }]);
  });

  it('保留候选排序且最多显示四首', () => {
    const candidates = Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, title: `Song ${i}` }));
    expect(selectRelatedSongs({ id: 'current', title: 'Current' }, candidates)).toEqual(candidates.slice(0, 4));
  });

  it('没有同题候选时不补入无关作品', () => {
    expect(selectRelatedSongs({ id: 'a', title: 'Only song' }, [])).toEqual([]);
  });
});
