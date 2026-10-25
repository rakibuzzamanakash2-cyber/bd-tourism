import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
];

/** 6 → "Six", 25 → "25". For headings like "Six places to start with". */
export function countWord(n: number, { capitalize = true } = {}): string {
  const word = NUMBER_WORDS[n] ?? String(n);
  return capitalize ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

/**
 * A post-login destination from a URL parameter, limited to paths on this
 * site (e.g. "/book/x"). Anything else — another domain, "//evil.com" —
 * falls back to the home page, so links can't bounce users off-site.
 */
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}
