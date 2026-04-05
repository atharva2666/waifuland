'use client';

// Common interface for an API source
export interface ImageApiSource {
  name: string;
  hasNsfw: boolean;
  getTags: () => Promise<{ sfw: string[]; nsfw: string[] }>;
  getImages: (params: {
    category: string;
    isNsfw: boolean;
    count: number;
  }) => Promise<{ success: boolean; images: string[]; message?: string }>;
}

// --- waifu.im Implementation ---
const waifuImApi: ImageApiSource = {
  name: 'waifu.im',
  hasNsfw: true,
  async getTags() {
    try {
      const response = await fetch('https://api.waifu.im/tags');
      if (!response.ok) {
        console.error(`waifu.im tags API failed with status: ${response.status}`);
        throw new Error('Failed to fetch tags from waifu.im');
      }
      const data = await response.json();
      
      const sfw = data?.versatile && Array.isArray(data.versatile) ? data.versatile.sort() : [];
      const nsfw = data?.nsfw && Array.isArray(data.nsfw) ? data.nsfw.sort() : [];
      
      if (sfw.length === 0 && nsfw.length === 0) {
        console.warn("waifu.im returned no tags, using fallback.");
        return {
          sfw: ['waifu', 'maid', 'uniform', 'selfies', 'marin-kitagawa', 'mori-calliope', 'raiden-shogun'],
          nsfw: ['ero', 'ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'oppai'],
        };
      }
      
      return { sfw, nsfw };
    } catch (error) {
      console.error('waifu.im getTags error:', error);
      // Fallback tags in case of any error
      return {
        sfw: ['waifu', 'maid', 'uniform', 'selfies', 'marin-kitagawa', 'mori-calliope', 'raiden-shogun'],
        nsfw: ['ero', 'ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi', 'oppai'],
      };
    }
  },
  async getImages(params) {
    const { category, isNsfw } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    const url = `https://api.waifu.im/search?included_tags=${category}&is_nsfw=${isNsfw}&many=true`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      if (!data.images || data.images.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      const imageUrls = data.images.map((img: any) => img.url);
      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("waifu.im getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

// --- waifu.pics Implementation ---
const waifuPicsApi: ImageApiSource = {
  name: 'waifu.pics',
  hasNsfw: true,
  async getTags() {
    try {
      const response = await fetch('https://api.waifu.pics/endpoints');
      if (!response.ok) throw new Error('Failed to fetch tags from waifu.pics');
      const data = await response.json();
      return {
        sfw: (data.sfw || []).sort(),
        nsfw: (data.nsfw || []).sort(),
      };
    } catch (error) {
      console.error('waifu.pics getTags error:', error);
      return {
        sfw: [ 'waifu', 'neko', 'shinobu', 'megumin', 'bully', 'cuddle', 'cry', 'hug', 'awoo', 'kiss', 'lick', 'pat', 'smug', 'bonk', 'yeet', 'blush', 'smile', 'wave', 'highfive', 'handhold', 'nom', 'bite', 'glomp', 'slap', 'kill', 'kick', 'happy', 'wink', 'poke', 'dance', 'cringe' ],
        nsfw: [ 'waifu', 'neko', 'trap', 'blowjob' ]
      };
    }
  },
  async getImages(params) {
    const { category, isNsfw, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    const type = isNsfw ? 'nsfw' : 'sfw';
    // The API expects a max of 30, but we will use the count passed in.
    const url = `https://api.waifu.pics/many/${type}/${category}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exclude: [] }),
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      if (!data.files || data.files.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      return { success: true, images: data.files };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("waifu.pics getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

// --- nekos.life Implementation ---
const nekosLifeApi: ImageApiSource = {
  name: 'nekos.life',
  hasNsfw: true,
  async getTags() {
    const sfw = ['neko', 'waifu', 'tickle', 'slap', 'poke', 'pat', 'lizard', 'kiss', 'hug', 'fox_girl', 'feed', 'cuddle', 'kemonomimi', 'holo', 'smug', 'baka', 'woof', 'wallpaper', 'goose', 'gecg', 'avatar'];
    const nsfw = ['femdom', 'classic', 'ngif', 'erok', 'yuri', 'erokemo', 'kuni', 'tits', 'pussy_jpg', 'cum_jpg', 'pussy', 'les', 'lewdkemo', 'lewd', 'hololewd', 'holoero', 'hentai', 'futanari', 'ero', 'eron', 'erofeet', 'eroyuri', 'solo', 'solog', 'feet', 'bj'];
    return Promise.resolve({ sfw: sfw.sort(), nsfw: nsfw.sort() });
  },
  async getImages(params) {
    const { category, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    
    // This API returns one image per call, so we make 'count' requests in parallel.
    // This may be slow or hit rate limits.
    const url = `https://nekos.life/api/v2/img/${category}`;
    try {
      const imagePromises = Array.from({ length: count }).map(() => fetch(url, { cache: 'no-store' }));
      const responses = await Promise.all(imagePromises);
      
      const imageUrls: string[] = [];
      for (const response of responses) {
        if (response.ok) {
          const data = await response.json();
          if (data.url) {
            imageUrls.push(data.url);
          }
        }
      }

      if (imageUrls.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      return { success: true, images: [...new Set(imageUrls)] }; // Remove duplicates
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("nekos.life getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};


// --- nekos.best Implementation ---
const nekosBestApi: ImageApiSource = {
  name: 'nekos.best',
  hasNsfw: false, // nekos.best doesn't have an NSFW flag, categories are distinct
  async getTags() {
    try {
      const response = await fetch('https://nekos.best/api/v2/endpoints');
      if (!response.ok) throw new Error('Failed to fetch tags from nekos.best');
      const data = await response.json();
      const categories = Object.keys(data).sort();
      return { sfw: categories, nsfw: [] };
    } catch (error) {
      console.error('nekos.best getTags error:', error);
      return { sfw: ['neko', 'kitsune', 'waifu', 'husbando', 'baka', 'bite', 'blush', 'bored', 'cry', 'cuddle', 'dance', 'facepalm', 'feed', 'handhold', 'happy', 'highfive', 'hug', 'kiss', 'laugh', 'nod', 'nom', 'nope', 'pat', 'poke', 'pout', 'punch', 'shoot', 'shrug', 'slap', 'sleep', 'smile', 'smug', 'stare', 'think', 'thumbsup', 'tickle', 'wave', 'wink', 'yeet'], nsfw: [] };
    }
  },
  async getImages(params) {
    const { category, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    const url = `https://nekos.best/api/v2/${category}?amount=${count}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      const data = await response.json();
      if (!data.results || data.results.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      const imageUrls = data.results.map((img: any) => img.url);
      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("nekos.best getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

export const apiSources: { [key: string]: ImageApiSource } = {
  'waifu.im': waifuImApi,
  'waifu.pics': waifuPicsApi,
  'nekos.life': nekosLifeApi,
  'nekos.best': nekosBestApi,
};
