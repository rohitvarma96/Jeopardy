import type { IconName } from '../components/ui/IconSlot';
import type { Category, CategoryId } from '../game/types/match';

// Text labels with generic Ionicons UI glyphs; category artwork is excluded per docs/ASSET_MANIFEST.md.
export const CATEGORIES = [
  { id: 'science', name: 'Science', icon: 'flask-outline' },
  { id: 'sports', name: 'Sports', icon: 'football-outline' },
  { id: 'history', name: 'History', icon: 'library-outline' },
  { id: 'movies-tv', name: 'Movies & TV', icon: 'film-outline' },
  { id: 'space', name: 'Space', icon: 'planet-outline' },
  { id: 'technology', name: 'Technology', icon: 'hardware-chip-outline' },
  { id: 'geography', name: 'Geography', icon: 'earth-outline' },
  { id: 'music', name: 'Music', icon: 'musical-notes-outline' },
] as const satisfies readonly (Category & { icon: IconName })[];

export const CATEGORY_IDS: readonly CategoryId[] = CATEGORIES.map((category) => category.id);

export function getCategory(id: CategoryId) {
  const category = CATEGORIES.find((entry) => entry.id === id);
  if (!category) throw new Error(`Unknown category: ${id}`);
  return category;
}
