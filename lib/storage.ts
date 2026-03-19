import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';

const BUCKET = 'profile-images';

/**
 * Upload a profile avatar to Supabase Storage.
 * Fixed path: {userId}/avatar.jpg — upserts on repeat.
 * Returns the public URL (with cache-buster) on success, null on failure.
 */
export async function uploadProfileAvatar(
    userId: string,
    uri: string
): Promise<string | null> {
    return uploadProfileImage(userId, 'avatar', uri);
}

/**
 * Upload a profile banner to Supabase Storage.
 * Fixed path: {userId}/banner.jpg — upserts on repeat.
 * Returns the public URL (with cache-buster) on success, null on failure.
 */
export async function uploadProfileBanner(
    userId: string,
    uri: string
): Promise<string | null> {
    return uploadProfileImage(userId, 'banner', uri);
}

// ─── Internal ────────────────────────────────────────────────────────────────

async function uploadProfileImage(
    userId: string,
    type: 'avatar' | 'banner',
    uri: string
): Promise<string | null> {
    try {
        const path = `${userId}/${type}.jpg`;

        console.log(`[storage] starting ${type} upload for path: ${path}`);

        // 1. Read the local file as a base64 string via expo-file-system.
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // 2. Decode base64 to Buffer (binary data).
        // Buffer.from is robust in React Native when the 'buffer' package is polyfilled/imported.
        const buffer = Buffer.from(base64, 'base64');

        // 3. Sanity check: Ensure we didn't get empty content.
        console.log(`[storage] ${type} decoded byte length: ${buffer.length}`);
        
        if (buffer.length === 0) {
            throw new Error(`Decoded ${type} byte length is 0. Base64 read may have failed.`);
        }

        // 4. Upload the Buffer directly to Supabase Storage.
        const { error } = await supabase.storage
            .from(BUCKET)
            .upload(path, buffer, {
                contentType: 'image/jpeg',
                upsert: true,
            });

        if (error) {
            console.error(`[storage] upload ${type} error:`, error.message);
            return null;
        }

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        
        // Append a cache-busting param so expo-image always re-fetches after an upsert.
        const versionedUrl = `${data.publicUrl}?t=${Date.now()}`;
        console.log(`[storage] ${type} upload success. URL: ${versionedUrl}`);
        
        return versionedUrl;
    } catch (err) {
        console.error(`[storage] upload ${type} exception:`, err);
        return null;
    }
}
