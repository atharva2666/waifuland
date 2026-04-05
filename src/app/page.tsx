"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import {
  Download,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FluxpointImage = {
  file: string;
};

type WaifuManyImage = {
  files: string[];
}

// IMPORTANT: Replace with your actual key from https://fluxpoint.io/dashboard
const FLUXPOINT_API_KEY = "YOUR_FLUXPOINT_API_KEY_HERE"; 

const SFW_CATEGORIES = ["anime", "azurlane", "chibi", "christmas", "halloween", "holo", "kemonomimi", "maid", "neko", "senko", "uniform", "wallpaper"];
const NSFW_CATEGORIES = ["ass", "bdsm", "blowjob", "cum", "ero", "feet", "hentai", "neko", "pussy", "yuri"];

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isNsfw, setIsNsfw] = useState(false);
  const [category, setCategory] = useState("anime");
  const [isGenerating, startGenerating] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [isGalleryLoading, startGalleryLoading] = useTransition();

  const availableCategories = isNsfw ? NSFW_CATEGORIES : SFW_CATEGORIES;

  const fetchImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (FLUXPOINT_API_KEY === "YOUR_FLUXPOINT_API_KEY_HERE") {
        const msg = "Please add your Fluxpoint API key to use the generator.";
        setError(msg);
        toast({
            variant: "destructive",
            title: "API Key Missing",
            description: msg,
        });
        setIsLoading(false);
        return;
    }

    try {
      const type = isNsfw ? "nsfw" : "sfw";
      const currentCategory = availableCategories.includes(category) ? category : availableCategories[0];
      
      const response = await fetch(`https://api.fluxpoint.io/${type}/img/${currentCategory}`, {
        headers: {
            'Authorization': FLUXPOINT_API_KEY
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to fetch image (status: ${response.status}).` }));
        throw new Error(errorData.message || `Failed to fetch image (status: ${response.status}). Check your API key.`);
      }

      const data: FluxpointImage = await response.json();
      setImageUrl(data.file);
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(message);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [isNsfw, category, availableCategories, toast]);

  const fetchGalleryImages = useCallback((isInitial: boolean) => {
    startGalleryLoading(async () => {
       if (FLUXPOINT_API_KEY === "YOUR_FLUXPOINT_API_KEY_HERE") {
            // Silently fail for gallery if no key is present
            return;
       }
       try {
        const type = isNsfw ? "nsfw" : "sfw";
        const currentCategory = availableCategories.includes(category) ? category : availableCategories[0];

        const response = await fetch(`https://api.fluxpoint.io/${type}/img/bulk/${currentCategory}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': FLUXPOINT_API_KEY
            },
            body: JSON.stringify({ amount: 30 })
        });

        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ message: `Failed to fetch gallery images (status: ${response.status}).` }));
            throw new Error(errorData.message || `Failed to fetch gallery images (status: ${response.status}).`);
        }
        const data: WaifuManyImage = await response.json();
        
        if (isInitial) {
          setGalleryImages(data.files);
        } else {
          setGalleryImages(prev => [...prev, ...data.files]);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "An unknown error occurred.";
        toast({
          variant: "destructive",
          title: "Could not load gallery.",
          description: message,
        });
      }
    });
  }, [isNsfw, category, availableCategories, toast]);
  
  useEffect(() => {
    startGenerating(() => {
      fetchImage();
    });
    fetchGalleryImages(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNsfw, category]);

  const handleImageDownload = (url: string | null) => {
    if (!url) return;
    try {
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = url.split("/").pop() || "waifu.jpg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({
        title: "Download Initiated",
        description: "Your image is being downloaded.",
      });
    } catch (error) {
      console.error("Download attempt failed:", error);
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: "Could not start download. Please try again.",
      });
    }
  };
  
  const handleGenerateClick = () => {
      startGenerating(() => {
        fetchImage();
      });
  };
  
  return (
    <div className="text-foreground font-body bg-background">
      <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-white mb-2 tracking-tight drop-shadow-lg">
            WaifuVault
          </h1>
          <p className="text-white/80 max-w-md mx-auto drop-shadow-md">
            Discover a new anime character image with every click.
          </p>
        </div>

        <div className="w-full max-w-md lg:max-w-lg bg-card/60 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-border/20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center mb-6">
            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              <Switch id="nsfw-toggle" checked={isNsfw} onCheckedChange={(checked) => {
                  setIsNsfw(checked);
                  const newCategories = checked ? NSFW_CATEGORIES : SFW_CATEGORIES;
                  setCategory(newCategories[0]);
              }} />
              <Label htmlFor="nsfw-toggle">NSFW</Label>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleGenerateClick} disabled={isGenerating || isLoading} className="w-full transition-transform active:scale-95 bg-primary/80 hover:bg-primary text-primary-foreground font-bold">
              {isGenerating || isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
          </div>

          <div className="block w-full aspect-square relative bg-black/20 rounded-lg overflow-hidden border-2 border-border/20">
            {isLoading || isGenerating ? (
              <Skeleton className="w-full h-full" />
            ) : imageUrl ? (
              <Image
                key={imageUrl}
                src={imageUrl}
                alt="Waifu"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className={cn(
                  "object-contain transition-all duration-300 opacity-0"
                )}
                onLoadingComplete={(image) => image.classList.remove("opacity-0")}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <ImageIcon className="w-16 h-16 mb-4" />
                <p className="text-center">{error || "No image to display"}</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 mt-6 justify-center">
            <Button variant="outline" onClick={() => handleImageDownload(imageUrl)} disabled={!imageUrl || isLoading || isGenerating} className="transition-transform active:scale-95">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
      </main>

      <section className="pb-16">
        <div className="w-full max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-white drop-shadow-lg">Lobby</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(isGalleryLoading && galleryImages.length === 0) ? (
              Array.from({ length: 30 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg bg-card/60" />)
            ) : (
              galleryImages.map((imgUrl, index) => (
                <div key={`${imgUrl}-${index}`} className="relative aspect-square rounded-lg overflow-hidden group border border-white/10 shadow-lg">
                  <Image
                    src={imgUrl}
                    alt={`Gallery image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleImageDownload(imgUrl)}
                      className="text-white border-white/50 bg-black/20 hover:bg-black/40 hover:text-white backdrop-blur-sm -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
                    >
                      <Download className="h-5 w-5" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
           <div className="text-center mt-8">
            <Button onClick={() => fetchGalleryImages(false)} disabled={isGalleryLoading} className="transition-transform active:scale-95 bg-primary/80 hover:bg-primary text-primary-foreground font-bold">
              {isGalleryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Load More
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
