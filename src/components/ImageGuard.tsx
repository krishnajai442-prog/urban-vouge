"use client";
import { useEffect } from "react";

export function ImageGuard() {
  useEffect(() => {
    // Point this to a reliable local asset in your /public folder
    const FALLBACK_SRC = "/placeholder-banner-bg.jpg"; 

    const handleError = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        const img = target as HTMLImageElement;
        
        // Prevent infinite loops if the fallback itself somehow fails
        if (img.src && !img.src.includes(FALLBACK_SRC) && !img.dataset.guarded) {
          img.dataset.guarded = "true";
          img.src = FALLBACK_SRC;
          
          // Optional: hide the broken image icon that some browsers show before the fallback loads
          img.style.visibility = "hidden";
          img.onload = () => { img.style.visibility = "visible"; };
        }
      }
    };

    // The `true` parameter is critical: error events don't bubble, so we must capture them on the way down
    document.addEventListener("error", handleError, true);
    return () => document.removeEventListener("error", handleError, true);
  }, []);

  return null;
}