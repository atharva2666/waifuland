'use client';

export type WaifuImTag = {
  tag_id: number;
  name: string;
  description: string;
  is_nsfw: boolean;
};

export type WaifuImImage = {
  url: string;
  tags: WaifuImTag[];
};

export type WaifuImSearchResponse = {
  images: WaifuImImage[];
};

export type WaifuImTagsResponse = {
  versatile: string[];
  nsfw: string[];
};

let nsfwTags: Set<string> = new Set();
let versatileTags: string[] = [];

/**
 * Fetches all versatile and NSFW tags from the waifu.im API and caches them.
 * This is the definitive source for which tags are considered NSFW.
 */
export async function loadTags(): Promise<{ versatile: string[], nsfw: string[] }> {
  if (versatileTags.length > 0) {
    return { versatile: versatileTags, nsfw: Array.from(nsfwTags) };
  }

  try {
    const response = await fetch('https://api.waifu.im/tags');
    if (!response.ok) {
      throw new Error(`Failed to fetch tags: ${response.status}`);
    }
    const data: WaifuImTagsResponse = await response.json();
    
    // Add defensive checks to prevent crash if API response is malformed
    nsfwTags = new Set(data.nsfw || []);
    versatileTags = (data.versatile || []).sort();

    return { versatile: versatileTags, nsfw: (data.nsfw || []).sort() };
  } catch (error) {
    console.error("Error loading tags:", error);
    // Return a hardcoded fallback if the API fails
    const fallbackNsfw = ["ass", "hentai", "milf", "oral", "paizuri", "ecchi", "ero"];
    const fallbackSfw = ["waifu", "maid", "uniform", "selfies", "marin-kitagawa", "raiden-shogun", "mori-calliope", "oppai"];
    nsfwTags = new Set(fallbackNsfw);
    versatileTags = fallbackSfw;
    return { versatile: fallbackSfw, nsfw: fallbackNsfw };
  }
}

/**
 * Searches for images on waifu.im.
 * This function contains the critical fix for the 404 errors by intelligently
 * handling the is_nsfw flag based on the selected category.
 */
export async function searchImages(params: {
  category: string;
  isNsfw: boolean;
  many: boolean;
}): Promise<{ success: boolean; images: string[]; message?: string }> {
  const { category, isNsfw: isNsfwToggleOn, many } = params;

  // CRITICAL FIX: Determine the correct NSFW status for the API call.
  // If the user selects an NSFW tag, we MUST query for NSFW images.
  // If the user selects a SFW tag but has the toggle on, we also query for NSFW.
  const isApiNsfw = nsfwTags.has(category) || isNsfwToggleOn;

  const endpoint = new URL('https://api.waifu.im/search');
  endpoint.searchParams.set('included_tags', category);
  endpoint.searchParams.set('is_nsfw', String(isApiNsfw));
  if (many) {
    endpoint.searchParams.set('many', 'true');
  }
  
  try {
    const response = await fetch(endpoint, { cache: 'no-store' });

    if (!response.ok) {
      // This handles HTTP errors like 404, 500 etc.
      throw new Error(`API Error: ${response.statusText} (${response.status})`);
    }

    const data: WaifuImSearchResponse = await response.json();

    if (!data.images || data.images.length === 0) {
      return { success: true, images: [], message: 'No images found for this selection.' };
    }

    return { success: true, images: data.images.map((img) => img.url) };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    console.error("Image fetch error:", message);
    return { success: false, images: [], message };
  }
}
