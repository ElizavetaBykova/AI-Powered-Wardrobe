import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

export async function uploadClothingImage(userId, itemId, base64, mediaType = 'image/jpeg') {
  const ext = mediaType === 'image/png' ? 'png' : mediaType === 'image/webp' ? 'webp' : 'jpg';
  const filePath = `${userId}/${itemId}.${ext}`;

  const { error } = await supabase.storage
    .from('clothing-images')
    .upload(filePath, decode(base64), { contentType: mediaType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('clothing-images').getPublicUrl(filePath);
  return data.publicUrl;
}
