(function () {
  try {
    console.log("[PropellerAds] Loading single banner ad...");
    
    // Use your PropellerAds zone for a single banner ad
    const script = document.createElement("script");
    script.src = "https://fpyf8.com/88/tag.min.js";
    script.setAttribute("data-zone", "179377");
    script.async = true;
    script.setAttribute("data-cfasync", "false");
    
    // Add parameters to ensure only ONE banner ad
    script.setAttribute("data-ad-format", "banner");
    script.setAttribute("data-max-ads", "1");
    
    script.onload = function() {
      console.log("[PropellerAds] Banner ad loaded successfully");
    };
    
    script.onerror = function() {
      console.error("[PropellerAds] Failed to load banner ad");
      // Fallback - complete immediately if ad fails
      if (window._fgiomte) {
        window._fgiomte();
      }
    };
    
    document.head.appendChild(script);
    
    // Timeout after 8 seconds
    setTimeout(function() {
      console.log("[PropellerAds] Timeout - completing");
      if (window._fgiomte) {
        window._fgiomte();
      }
    }, 8000);

  } catch (e) {
    console.error("[PropellerAds] Error:", e);
    // Fallback
    if (window._fgiomte) {
      window._fgiomte();
    }
  }
})();
