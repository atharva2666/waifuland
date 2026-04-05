'use client';

export type WaifuPicsEndpoints = {
  sfw: string[];
  nsfw: string[];
};

export type WaifuPicsManyResponse = {
  files: string[];
}

let sfwCategoriesCache: string[] = [];
let nsfwCategoriesCache: string[] = [];

/**
 * Fetches all SFW and NSFW endpoints from the waifu.pics API.
 */
export async function loadEndpoints(): Promise<WaifuPicsEndpoints> {
  if (sfwCategoriesCache.length > 0 && nsfwCategoriesCache.length > 0) {
    return { sfw: sfwCategoriesCache, nsfw: nsfwCategoriesCache };
  }

  try {
    const response = await fetch('https://api.waifu.pics/endpoints');
    if (!response.ok) {
      throw new Error(`Failed to fetch endpoints: ${response.status}`);
    }
    const data: WaifuPicsEndpoints = await response.json();
    
    sfwCategoriesCache = (data.sfw || []).sort();
    nsfwCategoriesCache = (data.nsfw || []).sort();

    return { sfw: sfwCategoriesCache, nsfw: nsfwCategoriesCache };
  } catch (error) {
    console.error("Error loading waifu.pics endpoints:", error);
    // Return a hardcoded fallback if the API fails
    return { 
      sfw: ['waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe'],
      nsfw: ['waifu', 'neko', 'trap', 'blowjob']
    };
  }
}

/**
 * Searches for images on waifu.pics.
 * The /many endpoint requires a POST request.
 */
export async function searchImages(params: {
  type: 'sfw' | 'nsfw';
  category: string;
}): Promise<{ success: boolean; images: string[]; message?: string }> {
  const { type, category } = params;

  if (!category) {
    return { success: false, images: [], message: 'No category selected.' };
  }

  const endpoint = `https://api.waifu.pics/many/${type}/${category}`;
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ exclude: [] }), // API requires a body, can be empty
      cache: 'no-store' 
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, images: [], message: `Category '${category}' not found for ${type} type.`};
      }
      throw new Error(`API Error: ${response.statusText} (${response.status})`);
    }

    const data: WaifuPicsManyResponse = await response.json();

    if (!data.files || data.files.length === 0) {
      return { success: true, images: [], message: 'No images found for this selection.' };
    }

    return { success: true, images: data.files };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred.';
    console.error("Image fetch error:", message);
    return { success: false, images: [], message };
  }
}
