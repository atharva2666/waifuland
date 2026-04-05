"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import { Download, RefreshCw, Loader2, Image as ImageIcon } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { loadTags, searchImages } from "./waifu-api";

export default function Home() {
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isNsfw, setIsNsfw] = useState(false);
  const [category, setCategory] = useState("waifu");
  const [isGenerating, startGenerating] = useTransition();
  const { toast } = useToast();

  // Load all available tags from the API on initial render
  useEffect(() => {
    async function getTags() {
      const { versatile, nsfw } = await loadTags();
      // Combine SFW and NSFW tags and sort them for the dropdown
      const combined = [...new Set([...versatile, ...nsfw])].sort();
      setAllTags(combined);
    }
    getTags();
  }, []);

  const fetchAndSetGallery = useCallback(
    async (isInitialLoad = false) => {
      startGenerating(async () => {
        if (isInitialLoad) {
          setGalleryImages([]); // Clear previous images on new category/filter
        }
        const result = await searchImages({
          category,
          isNsfw,
          many: true,
        });

        if (result.success) {
          if (result.images.length > 0) {
            if (isInitialLoad) {
              setGalleryImages(result.images);
            } else {
              // Add new images, preventing duplicates
              setGalleryImages((prev) => [...new Set([...prev, ...result.images])]);
            }
          } else {
             if (isInitialLoad) setGalleryImages([]);
             toast({ title: "No images found", description: result.message });
          }
        } else {
          toast({
            variant: "destructive",
            title: "Error fetching images",
            description: result.message,
          });
        }
      });
    },
    [category, isNsfw, toast]
  );
  
  // Fetch images when category or NSFW toggle changes
  useEffect(() => {
    if (allTags.length > 0) { // Ensure tags are loaded before fetching
        fetchAndSetGallery(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, isNsfw, allTags.length]);


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

  return (
    <div className="min-h-screen w-full bg-background text-foreground font-body">
      <div className="flex">
        {/* --- Sidebar --- */}
        <aside className="w-72 h-screen flex-col gap-4 border-r border-white/10 bg-black/20 p-4 hidden md:flex sticky top-0">
           <div className="text-left mb-4">
            <h1 className="text-3xl font-bold text-white">WaifuVault</h1>
            <p className="text-white/60">Find your perfect image</p>
          </div>
          <Separator className="bg-white/10" />
          <div className="flex flex-col gap-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-select">Category</Label>
                <Select value={category} onValueChange={setCategory} disabled={allTags.length === 0}>
                  <SelectTrigger id="category-select" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTags.length > 0 ? (
                      allTags.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>Loading tags...</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label htmlFor="nsfw-toggle">NSFW Mode</Label>
                    <p className="text-xs text-white/60">Show not safe for work content</p>
                </div>
                <Switch id="nsfw-toggle" checked={isNsfw} onCheckedChange={setIsNsfw} />
              </div>
          </div>
           <Button onClick={() => fetchAndSetGallery(true)} disabled={isGenerating} className="w-full mt-auto transition-transform active:scale-95 bg-primary/80 hover:bg-primary text-primary-foreground font-bold">
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate
            </Button>
        </aside>

        {/* --- Main Content --- */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white drop-shadow-md">
                    Gallery
                </h2>
                <span className="text-white/60">{galleryImages.length > 0 ? `${galleryImages.length} images` : ''}</span>
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
                                    priority={index < 10} // Prioritize loading first 10 images
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
                    <div className="text-center mt-8">
                        <Button onClick={() => fetchAndSetGallery(false)} disabled={isGenerating} className="transition-transform active:scale-95 bg-primary/80 hover:bg-primary text-primary-foreground font-bold">
                            {isGenerating && galleryImages.length > 0 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                            Load More
                        </Button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground bg-black/20 rounded-lg">
                    <ImageIcon className="w-16 h-16 mb-4 text-white/30" />
                    <p className="text-center text-white/70">No images to display.</p>
                    <p className="text-center text-white/50 text-sm">Try changing the category or filters.</p>
                </div>
            )}
            </div>
        </main>
      </div>
    </div>
  );
}
