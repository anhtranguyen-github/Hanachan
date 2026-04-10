import { clsx, type ClassValue } from "clsx"

// Removed 'tailwind-merge' to reduce dependencies.
// Ensure classes are passed in correct order or manage conflicts manually.
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
