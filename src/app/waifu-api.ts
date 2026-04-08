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

// --- Gelbooru Implementation ---
const gelbooruApi: ImageApiSource = {
  name: 'Gelbooru',
  hasNsfw: true,
  async getTags() {
    // Gelbooru has millions of tags. We provide a curated list of popular SFW and NSFW tags as categories.
    const sfwTags = [ '1girl', 'solo', 'long_hair', 'smile', 'genshin_impact', 'hololive', 'touhou', 'vocaloid', 'azur_lane', 'arknights' ];
    const nsfwTags = [ 'pussy', 'sex', 'blowjob', 'nude', 'masturbation', 'ass', 'breasts', 'ahegao', 'tentacles', 'bdsm' ];
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
    } else {
      tags.push('rating:safe');
    }
    
    const url = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${encodeURIComponent(tags.join(' '))}&limit=${count}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
      }
      
      const text = await response.text();
      // Gelbooru returns an object with a "post" key, or an empty response if no results.
      const data = text ? JSON.parse(text) : {};

      if (!data.post || !Array.isArray(data.post) || data.post.length === 0) {
        return { success: true, images: [], message: 'No images found for this selection.' };
      }
      
      const imageUrls = data.post
        .filter((post: any) => post.file_url)
        .map((post: any) => post.file_url);
        
      if (imageUrls.length === 0) {
        return { success: true, images: [], message: 'No valid image URLs found in the response.' };
      }

      return { success: true, images: imageUrls };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Gelbooru getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

// --- Yande.re Implementation ---
const yandereApi: ImageApiSource = {
  name: 'Yande.re',
  hasNsfw: true,
  async getTags() {
    // Curated popular tags
    const sfwTags = [ 'animal_ears', 'bikini', 'blonde_hair', 'blue_eyes', 'breasts', 'long_hair', 'seifuku', 'swimsuit', 'touhou', 'vocaloid' ];
    const nsfwTags = [ 'pussy', 'sex', 'nude', 'uncensored', 'ass', 'breasts', 'panties', 'pantyhose', 'pussy_juice', 'areolae' ];
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
    } else {
      tags.push('rating:questionable'); // Yande.re doesn't have much 'safe' content, 'questionable' is a better SFW default.
    }
    
    const url = `https://yande.re/post.json?tags=${encodeURIComponent(tags.join(' '))}&limit=${count}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
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
      console.error("Yande.re getImages error:", message);
      return { success: false, images: [], message };
    }
  },
};

// --- Konachan Implementation ---
const konachanApi: ImageApiSource = {
  name: 'Konachan',
  hasNsfw: true,
  async getTags() {
    // Curated popular tags
    const sfwTags = [ 'animal_ears', 'blonde_hair', 'blue_eyes', 'brown_hair', 'long_hair', 'seifuku', 'smile', 'touhou', 'vocaloid', 'weapon' ];
    const nsfwTags = [ 'nude', 'pussy', 'sex', 'uncensored', 'ass', 'breasts', 'panties', 'pantyhose', 'cum', 'bondage' ];
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
    const baseUrl = 'https://konachan.com';

    if (isNsfw) {
      tags.push('rating:explicit');
    } else {
      tags.push('rating:questionable'); // Konachan is similar to yande.re, questionable is better for SFW.
    }
    
    const url = `${baseUrl}/post.json?tags=${encodeURIComponent(tags.join(' '))}&limit=${count}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText} (${response.status})`);
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
      console.error("Konachan getImages error:", message);
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

export const apiSources: { [key: string]: ImageApiSource } = {
  'danbooru': danbooruApi,
  'gelbooru': gelbooruApi,
  'yande.re': yandereApi,
  'konachan': konachanApi,
  'waifu.pics': waifuPicsApi,
  'nekos.life': nekosLifeApi,
  'nekos.best': nekosBestApi,
};
