export function outfitKey(outfit) {
  return (outfit.item_ids || []).slice().sort().join('|');
}
