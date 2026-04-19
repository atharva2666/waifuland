"use client";

import { useState, useEffect, useCallback, useTransition, useRef } from "react";
import {
  Download,
  Loader2,
  ImageIcon,
  ChevronUp,
  Heart,
  Image,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiSources } from "./waifu-api";
import { MediaPlayer } from "@/components/media-player";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { ImageViewer } from "@/components/image-viewer";
import { searchAnime } from "./actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const IMAGE_FETCH_COUNT = 30;

// Jikan Presets
const jikanPresets = [
    { name: "Naruto", id: "20" },
    { name: "JJK", id: "40748" },
    { name: "DBZ", id: "813" },
    { name: "Death Note", id: "1535" },
    { name: "AOT", id: "16498" },
];

export default function Home() {
  const [apiSourceKey, setApiSourceKey] = useState('jikan');
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [sfwCategories, setSfwCategories] = useState<string[]>([]);
  const [nsfwCategories, setNsfwCategories] = useState<string[]>([]);

  const [isNsfw, setIsNsfw] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [isGenerating, startGenerating] = useTransition();
  const { toast } = useToast();

  const [showBackToTop, setShowBackToTop] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  // States for sorting, likes, and viewer
  const [sortOrder, setSortOrder] = useState("score");
  const [likedImages, setLikedImages] = useState<string[]>([]);
  const [viewingLikes, setViewingLikes] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // States for Jikan Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isSearchPopoverOpen, setIsSearchPopoverOpen] = useState(false);
  
  const apiSource = apiSources[apiSourceKey];
  
  useEffect(() => {
    const storedApiSource = localStorage.getItem("apiSourceKey");
    if (storedApiSource && apiSources[storedApiSource]) {
      setApiSourceKey(storedApiSource);
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem("apiSourceKey", apiSourceKey);
  }, [apiSourceKey]);


  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Effect for Jikan search debouncing
  useEffect(() => {
    if (apiSourceKey !== 'jikan' || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const results = await searchAnime(searchQuery);
        setSearchResults(results);
        if (results.length > 0) {
          setIsSearchPopoverOpen(true);
        }
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, apiSourceKey]);

  useEffect(() => {
    async function getTags() {
      setGalleryImages([]);
      setActiveCategory("");
      setSfwCategories([]);
      setNsfwCategories([]);
      setPage(1);
      setSearchQuery("");
      setSearchResults([]);

      const { sfw, nsfw } = await apiSource.getTags();
      setSfwCategories(sfw);
      setNsfwCategories(nsfw);

      if (apiSourceKey !== 'jikan') {
        let currentList = sfw;
        if (isNsfw && apiSource.hasNsfw) {
          currentList = nsfw;
        }

        if (currentList.length > 0) {
          setActiveCategory(currentList[0]);
        }
      }
    }
    getTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSourceKey]);

  const fetchAndSetGallery = useCallback(
    async (isNewSearch = false) => {
      if (viewingLikes || !activeCategory) return;
      if (!isNewSearch && isGenerating) return;

      startGenerating(async () => {
        const currentPage = isNewSearch ? 1 : page;
        if (isNewSearch) {
          setGalleryImages([]);
        }

        const result = await apiSource.getImages({
          category: activeCategory,
          isNsfw: isNsfw && apiSource.hasNsfw,
          count: IMAGE_FETCH_COUNT,
          page: currentPage,
          sort: apiSource.sortingSupported ? sortOrder : undefined,
        });

        if (result.success) {
          if (result.images.length > 0) {
            setPage(currentPage + 1);
            if (isNewSearch) {
              setGalleryImages(result.images);
            } else {
              setGalleryImages((prev) => [
                ...new Set([...prev, ...result.images]),
              ]);
            }
          } else {
            if (isNewSearch) {
              setGalleryImages([]);
              toast({
                title: "No images found",
                description: result.message || "Try another category or toggle.",
              });
            }
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
    [activeCategory, isNsfw, toast, apiSource, isGenerating, page, sortOrder, viewingLikes]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!isGenerating && galleryImages.length > 0 && !viewingLikes && apiSourceKey !== 'jikan') {
            fetchAndSetGallery(false);
          }
        }
      },
      { rootMargin: "400px" }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isGenerating, galleryImages.length, fetchAndSetGallery, viewingLikes, apiSourceKey]);

  useEffect(() => {
    if (apiSourceKey === 'jikan') return;

    const currentList =
      isNsfw && apiSource.hasNsfw ? nsfwCategories : sfwCategories;
    if (currentList.length > 0 && !currentList.includes(activeCategory)) {
      setActiveCategory(currentList[0]);
    } else if (activeCategory) {
      fetchAndSetGallery(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNsfw]);

  useEffect(() => {
    if (activeCategory) {
      setPage(1);
      fetchAndSetGallery(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sortOrder]);
  
  useEffect(() => {
    if (viewingLikes) {
        setGalleryImages(likedImages);
    } else if (activeCategory) {
        fetchAndSetGallery(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewingLikes]);


  const handleImageDownload = (url: string | null) => {
    if (!url) return;
    window.open(url, "_blank");
  };

  const handlePasswordSubmit = () => {
    if (password.toLowerCase() === "nsfw") {
      setIsNsfw(true);
      toast({
        title: "Access Granted",
        description: "Secret mode unlocked.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Incorrect Password",
        description: "Wrong key, try again.",
      });
    }
    setIsPasswordDialogOpen(false);
    setPassword("");
  };
  
  const handleLikeToggle = (imgUrl: string) => {
    setLikedImages((prev) =>
      prev.includes(imgUrl)
        ? prev.filter((url) => url !== imgUrl)
        : [...prev, imgUrl]
    );
  };
  
  const openImageViewer = (index: number) => {
    setActiveImageIndex(index);
    setIsViewerOpen(true);
  };

  const closeImageViewer = () => {
    setIsViewerOpen(false);
  };

  const handlePresetClick = (preset: { name: string; id: string }) => {
      setViewingLikes(false);
      setActiveCategory(preset.id);
      setSearchQuery(preset.name);
      setIsSearchPopoverOpen(false);
      setSearchResults([]);
  };
  
  const currentCategories =
    isNsfw && apiSource.hasNsfw ? nsfwCategories : sfwCategories;
    
  const imagesToDisplay = viewingLikes ? likedImages : galleryImages;

  return (
    <div className="min-h-screen w-full font-body">
      <main className="w-full p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-7xl mx-auto flex flex-col">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent drop-shadow-md">
              Yoursonal
            </h1>
            <p className="text-muted-foreground mt-1">
              Your vision, your personal collection.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-2">
              Made by Atharva Bhatnagar (Coderbee0_Ggs) and other providers
            </p>
          </div>

          <div className="py-4 mb-8">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="api-source" className="text-sm font-medium">
                      Source
                    </Label>
                    <Select
                      value={apiSourceKey}
                      onValueChange={(val) => {
                        setApiSourceKey(val);
                        setViewingLikes(false);
                      }}
                    >
                      <SelectTrigger className="w-[150px] h-9 text-sm">
                        <SelectValue placeholder="Select an API" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(apiSources).map((key) => (
                          <SelectItem key={key} value={key}>
                            {apiSources[key].name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {apiSource.sortingSupported && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="sort-order"
                        className="text-sm font-medium"
                      >
                        Sort By
                      </Label>
                      <Select
                        value={sortOrder}
                        onValueChange={setSortOrder}
                        disabled={viewingLikes}
                      >
                        <SelectTrigger className="w-[150px] h-9 text-sm">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="score">Popularity</SelectItem>
                          <SelectItem value="id">Newest</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {apiSource.hasNsfw && (
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="nsfw-toggle"
                        className="text-sm font-medium"
                      >
                        Secret Mode
                      </Label>
                      <Switch
                        id="nsfw-toggle"
                        checked={isNsfw}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setIsPasswordDialogOpen(true);
                          } else {
                            setIsNsfw(false);
                          }
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-grow" />
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                  </div>
                </div>

                <Separator />

                <div className="flex-1 w-full">
                  {apiSourceKey === 'jikan' ? (
                     <div className="w-full">
                        <ScrollArea className="w-full">
                          <div className="flex items-center gap-2 pb-2">
                            <Button
                                key="likes"
                                variant={viewingLikes ? "secondary" : "outline"}
                                onClick={() => setViewingLikes(!viewingLikes)}
                                className="justify-start shrink-0 h-9"
                            >
                                <Heart className={`mr-2 h-4 w-4 ${likedImages.length > 0 ? "text-red-500 fill-current" : ""}`} />
                                My Likes ({likedImages.length})
                            </Button>
                            <Separator orientation="vertical" className="h-6 mx-1" />
                             {jikanPresets.map((preset) => (
                                <Button
                                  key={preset.id}
                                  variant={ activeCategory === preset.id && !viewingLikes ? "secondary" : "outline" }
                                  onClick={() => handlePresetClick(preset)}
                                  className="justify-start shrink-0 h-9"
                                >
                                  {preset.name}
                                </Button>
                              ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                        <div className="flex items-center gap-2 pt-2">
                          <Popover open={isSearchPopoverOpen} onOpenChange={setIsSearchPopoverOpen}>
                            <PopoverTrigger asChild>
                              <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Or search for another anime..."
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="pl-9"
                                  disabled={viewingLikes}
                                />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                              {isSearching && <div className="p-4 text-sm text-center">Searching...</div>}
                              {searchResults.length > 0 && !isSearching && (
                                <ScrollArea className="max-h-72">
                                  <div className="flex flex-col gap-1 p-1">
                                    {searchResults.map((anime) => (
                                      <Button
                                        key={anime.mal_id}
                                        variant="ghost"
                                        className="w-full h-auto justify-start text-left py-2 px-3"
                                        onClick={() => {
                                          setActiveCategory(String(anime.mal_id));
                                          setSearchQuery(anime.title);
                                          setIsSearchPopoverOpen(false);
                                          setSearchResults([]);
                                          setViewingLikes(false);
                                        }}
                                      >
                                        {anime.title}
                                      </Button>
                                    ))}
                                  </div>
                                </ScrollArea>
                              )}
                              {searchResults.length === 0 && !isSearching && searchQuery.length > 2 && (
                                <div className="p-4 text-center text-sm text-muted-foreground">No results found.</div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                    </div>
                  ) : (
                    <ScrollArea className="w-full">
                      <div className="flex items-center gap-2 pb-2">
                        <Button
                          key="likes"
                          variant={viewingLikes ? "secondary" : "outline"}
                          onClick={() => setViewingLikes(!viewingLikes)}
                          className="justify-start shrink-0 h-9"
                        >
                          <Heart
                            className={`mr-2 h-4 w-4 ${
                              likedImages.length > 0
                                ? "text-red-500 fill-current"
                                : ""
                            }`}
                          />
                          My Likes ({likedImages.length})
                        </Button>

                        <Separator orientation="vertical" className="h-6 mx-1" />

                        {currentCategories.length > 0 ? (
                          currentCategories.map((cat) => (
                            <Button
                              key={cat}
                              variant={
                                activeCategory === cat && !viewingLikes
                                  ? "secondary"
                                  : "outline"
                              }
                              onClick={() => {
                                setActiveCategory(cat);
                                setViewingLikes(false);
                              }}
                              className="justify-start capitalize shrink-0 h-9"
                            >
                              {cat.replace(/_/g, " ")}
                            </Button>
                          ))
                        ) : (
                          !viewingLikes &&
                          Array.from({ length: 10 }).map((_, i) => (
                            <Skeleton
                              key={i}
                              className="h-9 w-24 rounded-md"
                            />
                          ))
                        )}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-grow">
            {isGenerating && imagesToDisplay.length === 0 && !viewingLikes ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="aspect-[9/16] rounded-lg">
                    <Skeleton className="w-full h-full bg-muted" />
                  </div>
                ))}
              </div>
            ) : imagesToDisplay.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imagesToDisplay.map((imgUrl, index) => (
                    <div
                      key={`${imgUrl}-${index}`}
                      className="relative rounded-lg overflow-hidden group border bg-card shadow-lg aspect-[9/16]"
                    >
                      <div className="w-full h-full transition-transform duration-300 ease-in-out group-hover:scale-105 cursor-pointer" onClick={() => openImageViewer(index)}>
                        <MediaPlayer
                          src={imgUrl}
                          alt={`Gallery image ${index + 1}`}
                          priority={index < 8}
                          objectFit="cover"
                        />
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageDownload(imgUrl);
                          }}
                          className="text-foreground border-border/50 bg-background/20 hover:bg-background/40 hover:text-foreground backdrop-blur-sm h-12 w-12 rounded-full"
                        >
                          <Download className="h-6 w-6" />
                          <span className="sr-only">Download</span>
                        </Button>
                      </div>
                      <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); handleLikeToggle(imgUrl); }}
                          className="absolute top-2 right-2 text-white bg-black/20 hover:bg-black/50 hover:text-white rounded-full h-10 w-10"
                      >
                          <Heart className={`transition-colors ${likedImages.includes(imgUrl) ? 'text-red-500 fill-current' : 'text-white'}`} />
                          <span className="sr-only">Like</span>
                      </Button>
                    </div>
                  ))}
                </div>
                <div
                  ref={loadMoreRef}
                  className="h-16 flex items-center justify-center"
                >
                  {isGenerating && imagesToDisplay.length > 0 && !viewingLikes && (
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground bg-card rounded-lg w-full">
                <ImageIcon className="w-16 h-16 mb-4 text-muted-foreground/30" />
                <p className="text-center text-foreground/70">
                  {apiSourceKey === 'jikan' && !viewingLikes ? "Search for an anime to see images." :
                   viewingLikes ? "You haven't liked any images yet." : 
                   "It's empty in here..."}
                </p>
                <p className="text-center text-muted-foreground text-sm">
                  {viewingLikes ? "Click the heart on an image to save it here." : 
                   apiSourceKey === 'jikan' ? "Select a preset or use the search bar above." : 
                   "Select a category to get the party started."}
                </p>
              </div>
            )}
          </div>
        </div>
        <AlertDialog
          open={isPasswordDialogOpen}
          onOpenChange={setIsPasswordDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Enter Secret Mode</AlertDialogTitle>
              <AlertDialogDescription>
                This action requires a password to continue.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handlePasswordSubmit();
                  }
                }}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setPassword("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handlePasswordSubmit}>
                Enter
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {showBackToTop && (
          <Button
            onClick={scrollToTop}
            variant="secondary"
            size="icon"
            className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg z-50"
          >
            <ChevronUp className="h-8 w-8" />
            <span className="sr-only">Back to top</span>
          </Button>
        )}
        
        <ImageViewer 
          images={imagesToDisplay}
          activeIndex={activeImageIndex}
          isOpen={isViewerOpen}
          onClose={closeImageViewer}
          onNext={() => setActiveImageIndex((i) => (i + 1) % imagesToDisplay.length)}
          onPrev={() => setActiveImageIndex((i) => (i - 1 + imagesToDisplay.length) % imagesToDisplay.length)}
        />

      </main>
    </div>
  );
}
