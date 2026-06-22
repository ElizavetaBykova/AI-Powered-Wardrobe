import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';

async function callClaude(messages, maxTokens = 1024) {
  const apiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
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
  "type": "top | bottom | dress | outerwear | shoes | bag | accessory | other",
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
      content: `You are a fashion stylist. Suggest 3 complete outfit combinations from these wardrobe items. Respond with ONLY valid JSON, no markdown.

Wardrobe:
${list}

{
  "outfits": [
    {
      "name": "outfit name",
      "occasion": "when to wear this",
      "description": "1-2 sentences on why these pieces work together",
      "item_ids": ["id1", "id2", "id3"],
      "season": "best season"
    }
  ]
}`,
    },
  ]);

  return JSON.parse(text);
}
