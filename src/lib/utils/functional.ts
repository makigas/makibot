export type Index<T> = { [key: string]: T };

export function mapBy<R, K extends keyof R>(items: R[], key: K): { [k: string]: R } {
  return Object.fromEntries(items.map((item) => [item[key], item]));
}
