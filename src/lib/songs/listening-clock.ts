/** 累计实际推进的播放时间，暂停、缓冲和拖动进度不计入收听时长。 */
export class ListeningClock {
  seconds = 0;
  private previous: { media: number; wall: number } | null = null;

  start(media: number, wall: number) {
    this.previous = { media, wall };
  }

  update(media: number, wall: number) {
    if (this.previous) {
      const elapsed = Math.max(0, (wall - this.previous.wall) / 1000);
      const advanced = Math.max(0, media - this.previous.media);
      // 播放器当前只有正常倍速；进度跳跃不作为累计收听。
      if (advanced <= elapsed + 0.5) this.seconds += Math.min(advanced, elapsed);
      this.previous = { media, wall };
    }
    return this.seconds;
  }

  stop() {
    this.previous = null;
  }

  reset() {
    this.seconds = 0;
    this.stop();
  }
}
