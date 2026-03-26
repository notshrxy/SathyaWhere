/**
 * lib/supabase.ts
 * Supabase client configuration and storage helpers.
 * Provides `supabase` for client-side queries and `supabaseAdmin` for 
 * administrative tasks. Also includes helpers for file uploads, 
 * deletions, and public URL generation.
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate that environment variables exist
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

/**
 * Client-side Supabase client (for browser)
 * Uses anon key - limited permissions based on RLS policies
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Server-side Supabase client (for API routes)
 * Uses service role key - bypasses RLS (use carefully!)
 * 
 * ⚠️ ONLY use this in API routes, never expose to client!
 */
export const supabaseAdmin = typeof window === 'undefined'
  ? createClient(
    supabaseUrl,
    supabaseServiceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
  : null as unknown as ReturnType<typeof createClient>;

/**
 * Helper function to get Supabase Storage URL
 * 
 * Usage:
 * const imageUrl = getStorageUrl('item-images', 'path/to/image.jpg');
 */
export function getStorageUrl(bucket: string, path: string): string {
  if (!path) return '';
  
  // 1. If it's already a full URL, return it
  if (path.startsWith('http')) return path;

  // 2. Clean the path (remove leading slash)
  let cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // 3. Prevent double-prefixing if bucket name is already in the path
  if (cleanPath.startsWith(`${bucket}/`)) {
    cleanPath = cleanPath.slice(bucket.length + 1);
  }

  // 4. Return the public URL
  const { data } = supabase.storage.from(bucket).getPublicUrl(cleanPath);
  return data.publicUrl;
}

/**
 * Helper function to upload file to Supabase Storage
 * 
 * Usage:
 * const { data, error } = await uploadFile(
 *   'item-images',
 *   'user-123/item.jpg',
 *   file
 * );
 */
export async function uploadFile(
  bucket: string,
  path: string,
  file: File | Blob | Buffer | ArrayBuffer
) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    });

  if (error) {
    console.error('Upload error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

/**
 * Helper function to delete file from Supabase Storage
 */
export async function deleteFile(bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}