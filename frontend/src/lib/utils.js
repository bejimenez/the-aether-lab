import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * A utility function to merge Tailwind CSS classes.
 * It's essential for conditionally applying styles in components.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Determines the correct API base URL based on the environment.
 * Checks for a Vite environment variable first, then production, then defaults to localhost.
 */
export const getApiBaseUrl = () => {
  // Check for Vite environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Fallback for production
  if (import.meta.env.PROD) {
    return 'https://the-aether-lab-production.up.railway.app/api';
  }
  
  // Development fallback
  return 'http://localhost:5001/api';
};