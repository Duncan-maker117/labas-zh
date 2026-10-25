/** Coalesce typing and serialize requests so the last response wins before finishing. */
export class AnswerSaveQueue<T> {
  private pending = new Map<string, T>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private running: Promise<void> | undefined;
  constructor(private save: (input: T) => Promise<unknown>, private onError: (error: unknown) => void, private interval = 650) {}
  get hasPending() { return this.pending.size > 0 || !!this.running; }
  enqueue(key: string, input: T) {
    this.pending.set(key, input);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { void this.flush().catch(this.onError); }, this.interval);
  }
  flush(): Promise<void> {
    clearTimeout(this.timer);
    if (this.running) return this.running.then(() => this.pending.size ? this.flush() : undefined);
    if (!this.pending.size) return Promise.resolve();
    this.running = this.drain().finally(() => { this.running = undefined; });
    return this.running;
  }
  private async drain() {
    while (this.pending.size) {
      const [key, input] = this.pending.entries().next().value!;
      await this.save(input);
      if (this.pending.get(key) === input) this.pending.delete(key);
      // The API rate limit is shared across questions, not per question.
      await new Promise((resolve) => setTimeout(resolve, this.interval));
    }
  }
  cancelTimer() { clearTimeout(this.timer); }
}
