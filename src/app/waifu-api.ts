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

// --- Danbooru Implementation ---
const danbooruApi: ImageApiSource = {
  name: 'Danbooru',
  hasNsfw: true,
  async getTags() {
    // Danbooru has millions of tags. We provide a curated list of popular SFW and NSFW tags as categories.
    const sfwTags = [ '1girl', 'solo', 'long_hair', 'smile', 'genshin_impact', 'hololive', 'touhou', 'vocaloid' ];
    const nsfwTags = [ 'breasts', 'ass', 'pussy', 'thighhighs', 'sex', 'blowjob', 'genshin_impact', 'hololive' ];
    return Promise.resolve({
        sfw: sfwTags.sort(),
        nsfw: nsfwTags.sort(),
    });
  },
  async getImages(params) {
    const { category, isNsfw, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }

    const tags = [category];
    if (isNsfw) {
      tags.push('rating:explicit');
      // Filter for horizontal/landscape images
      tags.push('ratio:>=1.2');
    } else {
      tags.push('rating:general');
    }
    
    const url = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(tags.join(' '))}&limit=${count}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response.');
        throw new Error(`API Error: ${response.statusText} (${response.status}) - ${errorText}`);
      }
      const data = await response.json();

      if (!data || !Array.isArray(data) || data.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      
      const imageUrls = data
        .filter((post: any) => post.file_url)
        .map((post: any) => post.file_url);
        
      if (imageUrls.length === 0) {
        return { success: true, images: [], message: 'No valid image URLs found in the response.' };
      }

      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Danbooru getImages error:", message);
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
    
    // This API returns one image per call, so we make 'count' requests in parallel.
    const imagePromises = Array.from({ length: count }).map(() => {
        const url = `https://api.waifu.pics/${type}/${category}`;
        return fetch(url, { cache: 'no-store' });
    });

    try {
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
      // a Set ensures we don't have duplicate images
      return { success: true, images: [...new Set(imageUrls)] };
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
  hasNsfw: false,
  async getTags() {
    const sfw = ['neko', 'waifu', 'tickle', 'slap', 'poke', 'pat', 'lizard', 'kiss', 'hug', 'fox_girl', 'feed', 'cuddle', 'kemonomimi', 'holo', 'smug', 'baka', 'woof', 'wallpaper', 'goose', 'gecg', 'avatar'];
    return Promise.resolve({ sfw: sfw.sort(), nsfw: [] });
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

// --- waifu.im Implementation ---
const waifuImApi: ImageApiSource = {
  name: 'waifu.im',
  hasNsfw: true,
  async getTags() {
    // waifu.im has a flexible tagging system. We'll provide some popular ones.
    const sfwTags = [ 'waifu', 'maid', 'uniform', 'oppai', 'marin-kitagawa', 'raiden-shogun', 'selfies' ];
    const nsfwTags = [ 'ass', 'hentai', 'milf', 'oral', 'paizuri', 'ecchi' ];
    return Promise.resolve({
        sfw: sfwTags.sort(),
        nsfw: nsfwTags.sort(),
    });
  },
  async getImages(params) {
    const { category, isNsfw, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }

    const url = new URL('https://api.waifu.im/search');
    url.searchParams.append('included_tags', category);
    url.searchParams.append('is_nsfw', String(isNsfw));
    url.searchParams.append('many', 'true'); // This returns up to 30 images
    
    if (isNsfw) {
        // Filter for horizontal-ish images
        url.searchParams.append('width', '>=1000');
    }

    try {
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Could not read error response.');
        throw new Error(`API Error: ${response.statusText} (${response.status}) - ${errorText}`);
      }
      const data = await response.json();

      if (!data || !Array.isArray(data.images) || data.images.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      
      const imageUrls = data.images.map((img: any) => img.url);
        
      if (imageUrls.length === 0) {
        return { success: true, images: [], message: 'No valid image URLs found in the response.' };
      }

      return { success: true, images: imageUrls.slice(0, count) };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("waifu.im getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

// --- NekosAPI (nekos.moe) Implementation ---
const nekosMoeApi: ImageApiSource = {
  name: 'Nekos.moe',
  hasNsfw: true,
  async getTags() {
    try {
      const sfwResponse = await fetch('https://api.nekosapi.com/v2/tags?limit=40&sort=-images_count&filter[is_nsfw]=false');
      const nsfwResponse = await fetch('https://api.nekosapi.com/v2/tags?limit=40&sort=-images_count&filter[is_nsfw]=true');
      if (!sfwResponse.ok || !nsfwResponse.ok) throw new Error('Failed to fetch tags from NekosAPI');
      
      const sfwData = await sfwResponse.json();
      const nsfwData = await nsfwResponse.json();

      const sfwTags = sfwData.data.map((tag: any) => tag.attributes.name).sort();
      const nsfwTags = nsfwData.data.map((tag: any) => tag.attributes.name).sort();
      
      return { sfw: sfwTags, nsfw: nsfwTags };
    } catch (error) {
      console.error('Nekos.moe getTags error:', error);
      return {
        sfw: [ 'neko', 'kitsune', 'waifu', 'husbando', 'baka', 'bite', 'blush', 'bored', 'cry', 'cuddle', 'dance', 'facepalm', 'feed', 'happy', 'highfive', 'hug', 'kiss', 'laugh', 'pat', 'poke', 'pout', 'slap', 'sleep', 'smile', 'smug', 'wave', 'wink' ],
        nsfw: [ 'anal', 'ass', 'bdsm', 'blowjob', 'boobs', 'cum', 'feet', 'femboy', 'hentai', 'pussy', 'spank', 'yuri' ],
      };
    }
  },
  async getImages(params) {
    const { category, isNsfw, count } = params;
    if (!category) {
      return { success: false, images: [], message: 'No category selected.' };
    }
    
    const url = new URL('https://api.nekosapi.com/v2/images');
    url.searchParams.append('limit', String(count));
    url.searchParams.append('filter[is_nsfw]', String(isNsfw));
    url.searchParams.append('filter[tags.name]', category);
    url.searchParams.append('sort', 'random');

    try {
      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) {
        const errorJson = await response.json().catch(()=> ({}));
        const errorDetail = errorJson.errors?.[0]?.detail || 'Could not read error response.';
        throw new Error(`API Error: ${response.statusText} (${response.status}) - ${errorDetail}`);
      }
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      
      const imageUrls = data.data.map((img: any) => img.attributes.file);
      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Nekos.moe getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

export const apiSources: { [key: string]: ImageApiSource } = {
  'danbooru': danbooruApi,
  'waifu.pics': waifuPicsApi,
  'waifu.im': waifuImApi,
  'nekos.moe': nekosMoeApi,
  'nekos.life': nekosLifeApi,
  'nekos.best': nekosBestApi,
};
