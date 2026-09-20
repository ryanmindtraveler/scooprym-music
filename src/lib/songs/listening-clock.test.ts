import { expect, it } from 'vitest';
import { ListeningClock } from './listening-clock';

it('累计实际播放时间，暂停和缓冲不计时', () => {
  const clock = new ListeningClock();
  clock.start(0, 0);
  expect(clock.update(15, 15000)).toBe(15);
  clock.stop();
  expect(clock.update(15, 60000)).toBe(15);
  clock.start(15, 60000);
  expect(clock.update(30, 75000)).toBe(30);
});

it('直接跳到30秒或结尾不能获得有效播放时长', () => {
  const clock = new ListeningClock();
  clock.start(0, 0);
  expect(clock.update(60, 1000)).toBe(0);
  clock.stop();
  clock.start(170, 2000);
  expect(clock.update(180, 12000)).toBe(10);
});

it('切换作品时清空之前的收听时间', () => {
  const clock = new ListeningClock();
  clock.start(0, 0);
  clock.update(40, 40000);
  clock.reset();
  expect(clock.seconds).toBe(0);
  expect(clock.update(50, 50000)).toBe(0);
});
