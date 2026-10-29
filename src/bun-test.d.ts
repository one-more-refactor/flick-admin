declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function expect(actual: unknown): {
    toThrow(expected?: unknown): void;
    not: {
      toThrow(expected?: unknown): void;
    };
  };
}
