/** A number token such as --corner-smoothing. `fallback` is used when the token is missing or not a number. */
export function readNum(styles: CSSStyleDeclaration, name: string, fallback = 0): number {
  const value = parseFloat(styles.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}
