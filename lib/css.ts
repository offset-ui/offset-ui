export function readNum(styles: CSSStyleDeclaration, name: string, fallback = 0): number {
  const value = parseFloat(styles.getPropertyValue(name));
  return Number.isFinite(value) ? value : fallback;
}
