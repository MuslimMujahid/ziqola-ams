export function pick<T extends Record<string, unknown>, K extends keyof T>(
  source: T,
  keys: ReadonlyArray<K>,
): Pick<T, K> {
  return keys.reduce(
    (result, key) => {
      if (key in source) {
        result[key] = source[key];
      }
      return result;
    },
    {} as Pick<T, K>,
  );
}
