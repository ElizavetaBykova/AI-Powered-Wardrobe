import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const PROXY_URL = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/claude-proxy`;
const MODEL = 'claude-haiku-4-5-20251001';

async function callClaude(messages, maxTokens = 1024) {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();
  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
}

export async function readImageAsBase64(uri) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const mediaType = blob.type || 'image/jpeg';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ base64: reader.result.split(',')[1], mediaType });
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const ext = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const mediaType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  return { base64, mediaType };
}

export async function analyzeClothing(base64, mediaType = 'image/jpeg') {
  const text = await callClaude([
    {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: base64 },
        },
        {
          type: 'text',
          text: `Analyze this clothing item. Respond with ONLY valid JSON, no markdown, no extra text.

{
  "name": "short descriptive name",
  "type": "top | bottom | dress | jumpsuit | outerwear | shoes | bag | accessory | other",
  "color": "primary color",
  "colors": ["all visible colors"],
  "style": "casual | formal | smart-casual | sporty | streetwear | classic | other",
  "season": ["spring" and/or "summer" and/or "autumn" and/or "winter"],
  "description": "2 sentence description of the item",
  "warmth_level": 1,
  "occasion": ["everyday" and/or "work" and/or "party" and/or "date" and/or "sport" and/or "beach" and/or "travel" and/or "formal-event"],
  "material": "likely material or fabric"
}

warmth_level is an integer 1-5: 1=very light summer piece, 5=heavy winter piece.`,
        },
      ],
    },
  ]);

  return JSON.parse(text);
}

export async function generateOutfits(items) {
  if (items.length < 2) throw new Error('Add at least 2 items to generate outfits');

  const list = items
    .map((item) => `• [${item.id}] ${item.name} — ${item.type}, ${item.color}, ${item.style}, warmth:${item.warmth_level}`)
    .join('\n');

  const text = await callClaude([
    {
      role: 'user',
      content: `You are a fashion stylist. Suggest complete outfit combinations from these wardrobe items. Concentrate on quality over quantity.

Fill each outfit using NAMED SLOTS. This ensures every look is complete and wearable:
- "top_id": the top, shirt, dress, or jumpsuit worn as the main body piece (REQUIRED). A dress or jumpsuit counts here — they cover both top and bottom in one piece.
- "bottom_id": the pants, skirt, or shorts (REQUIRED for tops). Set to null ONLY if top_id is a dress or jumpsuit — those already cover the bottom half.
- "outerwear_id": jacket, coat, blazer, kimono etc worn over the top (optional, null if unused)
- "shoes_id": footwear (optional, null if unused)
- "extras": array of IDs for any additional pieces — hats, bags, belts, scarves, jewellery, sunglasses etc. (optional, empty array if unused)

Outerwear always goes OVER a complete top + bottom base. Never use outerwear as a substitute for a top or bottom.

Wardrobe:
${list}

Respond with ONLY valid JSON, no markdown:
{
  "outfits": [
    {
      "name": "outfit name",
      "occasion": "when to wear",
      "description": "1-2 sentences on why these pieces work together",
      "season": "best season",
      "top_id": "item id",
      "bottom_id": "item id or null",
      "outerwear_id": "item id or null",
      "shoes_id": "item id or null",
      "extras": ["item id", "item id"]
    }
  ]
}`,
    },
  ], 4096);

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`Could not parse outfit response. Raw: ${text.slice(0, 120)}`);
  }

  // Build item_ids from named slots, preserving order: top → bottom → outerwear → shoes
  result.outfits = (result.outfits || []).map((outfit) => ({
    ...outfit,
    item_ids: [
      outfit.top_id,
      outfit.bottom_id,
      outfit.outerwear_id,
      outfit.shoes_id,
      ...(Array.isArray(outfit.extras) ? outfit.extras : []),
    ].filter(Boolean),
  }));

  return result;
}
