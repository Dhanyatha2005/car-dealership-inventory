/** Joins truthy class names. Tiny local helper so ui primitives need no extra dependency. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
