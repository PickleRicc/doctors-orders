/**
 * Combines class names into a single string, filtering out falsy values.
 * Similar to the clsx or classnames libraries but simpler.
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
