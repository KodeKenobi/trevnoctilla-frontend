(function () {
  try {
    console.log("[Video Ads] Initializing video ad system...");
    
    // Video ad configuration
    const VIDEO_AD_CONFIG = {
      // Different zone IDs for different video ad formats
      zones: {
        interstitial: 10067334, // Video interstitial ads
        popunder: 10067335,    // Video popunder ads  
        inStream: 10067336,     // In-stream video ads
        outStream: 10067337,    // Out-stream video ads
        banner: 10067333         // Current banner zone
      },
      domain: "ueuee.com",
      // Video ad preferences
      preferences: {
        autoplay: true,
        muted: true,
        controls: false,
        loop: false
      }
    };

    // Function to load video ads
    function loadVideoAd(zoneId, callback) {
      const script = document.createElement("script");
      script.src = `//${VIDEO_AD_CONFIG.domain}/400/${zoneId}`;
      
      script.onload = function() {
        console.log(`[Video Ads] Loaded video ad zone ${zoneId}`);
        if (callback) callback();
      };
      
      script.onerror = function() {
        console.error(`[Video Ads] Failed to load video ad zone ${zoneId}`);
        if (callback) callback();
      };
      
      try {
        (document.body || document.documentElement).appendChild(script);
      } catch (e) {
        console.error("[Video Ads] Script injection error:", e);
        if (callback) callback();
      }
    }

    // Load primary video ad (interstitial)
    loadVideoAd(VIDEO_AD_CONFIG.zones.interstitial, function() {
      // Set up video ad completion callback
      if (window._fgiomte) {
        console.log("[Video Ads] Video ad completion callback ready");
      }
    });

    // Fallback: Load banner ad if video fails
    setTimeout(function() {
      if (!window._fgiomte) {
        console.log("[Video Ads] Loading fallback banner ad...");
        loadVideoAd(VIDEO_AD_CONFIG.zones.banner, function() {
          console.log("[Video Ads] Fallback banner ad loaded");
        });
      }
    }, 2000);

  } catch (e) {
    console.error("[Video Ads] Video ad system error:", e);
  }
})();
