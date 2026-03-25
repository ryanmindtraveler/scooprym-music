declare module 'replicate' {
  export default class Replicate {
    constructor(options?: { auth?: string });
    run(
      model: string,
      options: {
        input: Record<string, unknown>;
      }
    ): Promise<Array<string | { url?: string | (() => string | Promise<string>) }>>;
  }
}
