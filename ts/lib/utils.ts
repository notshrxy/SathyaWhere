/**
 * lib/utils.ts
 * General purpose utility functions.
 * Currently contains the `cn` helper for conditionally merging 
 * Tailwind CSS classes using `clsx` and `tailwind-merge`.
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
