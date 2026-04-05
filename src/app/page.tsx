"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import { Download, RefreshCw, Loader2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { loadEndpoints, searchImages } from "./waifu-api";

export default function Home() {
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [sfwCategories, setSfwCategories] = useState<string[]>([]);
  const [nsfwCategories, setNsfwCategories] = useState<string[]>([]);
  
  const [isNsfw, setIsNsfw] = useState(false);
  const [activeCategory, setActiveCategory] = useState("waifu");
  const [isGenerating, startGenerating] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    async function getEndpoints() {
      const { sfw, nsfw } = await loadEndpoints();
      setSfwCategories(sfw);
      setNsfwCategories(nsfw);
    }
    getEndpoints();
  }, []);

  const fetchAndSetGallery = useCallback(
    async (isNewSearch = false) => {
      if (!activeCategory) return;

      startGenerating(async () => {
        if (isNewSearch) {
          setGalleryImages([]);
        }
        
        const result = await searchImages({
          type: isNsfw ? 'nsfw' : 'sfw',
          category: activeCategory,
        });

        if (result.success) {
          if (result.images.length > 0) {
            if (isNewSearch) {
              setGalleryImages(result.images);
            } else {
              setGalleryImages((prev) => [...new Set([...prev, ...result.images])]);
            }
          } else {
             if (isNewSearch) setGalleryImages([]);
             toast({ title: "No images found", description: result.message || "Try another category." });
          }
        } else {
          if (isNewSearch) setGalleryImages([]);
          toast({
            variant: "destructive",
            title: "Error fetching images",
            description: result.message,
          });
        }
      });
    },
    [activeCategory, isNsfw, toast]
  );
  
  useEffect(() => {
    const currentCategoryList = isNsfw ? nsfwCategories : sfwCategories;
    if (currentCategoryList.length > 0 && !currentCategoryList.includes(activeCategory)) {
        setActiveCategory(currentCategoryList[0]);
    } else if (activeCategory) {
        fetchAndSetGallery(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNsfw, sfwCategories, nsfwCategories]);

  useEffect(() => {
    if (activeCategory) {
        fetchAndSetGallery(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);


  const handleImageDownload = (url: string | null) => {
    if (!url) return;
    fetch(url)
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = url.split("/").pop() || "waifu.jpg";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        a.remove();
        toast({
          title: "Download Started",
          description: "Your image is being downloaded.",
        });
      })
      .catch(error => {
        console.error("Download failed:", error);
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: "Could not download the image.",
        });
      });
  };

  const currentCategories = isNsfw ? nsfwCategories : sfwCategories;

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-body">
      <main className="w-full p-4 sm:p-6 md:p-8">
          <div className="w-full max-w-7xl mx-auto">
            
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white drop-shadow-md">Waifu.pics Gallery</h1>
              <p className="text-white/60 mt-1">Browse a collection of images from waifu.pics</p>
            </div>

            <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-4 mb-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-4 self-start sm:self-center">
                    <Label htmlFor="nsfw-toggle" className="text-base font-medium text-white whitespace-nowrap">NSFW Mode</Label>
                    <Switch id="nsfw-toggle" checked={isNsfw} onCheckedChange={setIsNsfw} />
                </div>
                <Separator orientation="vertical" className="h-8 hidden sm:block bg-white/10"/>
                <div className="flex-1 w-full sm:w-auto">
                    <ScrollArea className="w-full">
                        <div className="flex items-center gap-2 pb-2">
                            {currentCategories.length > 0 ? (
                              currentCategories.map((cat) => (
                                <Button 
                                  key={cat} 
                                  variant={activeCategory === cat ? "secondary" : "outline"}
                                  onClick={() => setActiveCategory(cat)}
                                  className="justify-start capitalize shrink-0 border-white/20 bg-transparent hover:bg-white/10 hover:text-white"
                                >
                                  {cat.replace(/-/g, ' ')}
                                </Button>
                              ))
                            ) : (
                              Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-md bg-white/10" />)
                            )}
                        </div>
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </div>
              </div>
            </div>
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white drop-shadow-md capitalize">
                  {activeCategory.replace(/-/g, ' ')}
              </h2>
              <span className="text-white/60">{galleryImages.length > 0 ? `${galleryImages.length} images found` : `Loading images...`}</span>
            </div>
          
            {isGenerating && galleryImages.length === 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {Array.from({ length: 30 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-lg bg-white/10" />)}
                </div>
            ) : galleryImages.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {galleryImages.map((imgUrl, index) => (
                            <div key={`${imgUrl}-${index}`} className="relative aspect-[3/4] rounded-lg overflow-hidden group border border-white/10 shadow-lg transition-all duration-300 hover:shadow-primary/40 hover:border-primary/60">
                                <Image
                                    src={imgUrl}
                                    alt={`Gallery image ${index + 1}`}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                    priority={index < 10}
                                />
                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleImageDownload(imgUrl)}
                                    className="text-white border-white/50 bg-black/20 hover:bg-black/40 hover:text-white backdrop-blur-sm transform-gpu -translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-in-out"
                                    >
                                    <Download className="h-5 w-5" />
                                    <span className="sr-only">Download</span>
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="flex justify-center mt-8">
                      <Button onClick={() => fetchAndSetGallery(false)} disabled={isGenerating || !activeCategory} className="transition-transform active:scale-95 bg-primary/80 hover:bg-primary text-primary-foreground font-bold text-base py-6 px-8">
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Load More Images
                      </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground bg-black/20 rounded-lg">
                    <ImageIcon className="w-16 h-16 mb-4 text-white/30" />
                    <p className="text-center text-white/70">No images to display.</p>
                    <p className="text-center text-white/50 text-sm">Select a category to get started.</p>
                </div>
            )}
          </div>
      </main>
    </div>
  );
}
