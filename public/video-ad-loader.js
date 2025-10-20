(function () {
  try {
    console.log("[Ezoic Video] Initializing Ezoic video player...");
    
    // Ezoic video player configuration
    const EZOIC_CONFIG = {
      scriptSrc: "https://open.video/video.js",
      ezscrex: false,
      cfasync: false,
      timeout: 5000  // Shorter timeout for modal
    };

    // Load Ezoic video player
    function loadEzoicVideo() {
      // First script - initialize humixPlayers
      const initScript = document.createElement("script");
      initScript.innerHTML = "(window.humixPlayers = window.humixPlayers || []).push({target: document.currentScript});";
      initScript.setAttribute("data-ezscrex", EZOIC_CONFIG.ezscrex.toString());
      initScript.setAttribute("data-cfasync", EZOIC_CONFIG.cfasync.toString());
      
      // Second script - load video.js
      const videoScript = document.createElement("script");
      videoScript.src = EZOIC_CONFIG.scriptSrc;
      videoScript.async = true;
      videoScript.setAttribute("data-ezscrex", EZOIC_CONFIG.ezscrex.toString());
      videoScript.setAttribute("data-cfasync", EZOIC_CONFIG.cfasync.toString());
      
      videoScript.onload = function() {
        console.log("[Ezoic Video] Video player loaded successfully");
        // Set up completion callback
        if (window._fgiomte) {
          console.log("[Ezoic Video] Video completion callback ready");
        }
      };
      
      videoScript.onerror = function() {
        console.error("[Ezoic Video] Failed to load video player - site may not be integrated with Ezoic");
        console.log("[Ezoic Video] Falling back to timeout completion");
        // Fallback - complete immediately if video fails
        setTimeout(() => {
          if (window._fgiomte) {
            window._fgiomte();
          }
        }, 1000);
      };
      
      try {
        document.head.appendChild(initScript);
        document.head.appendChild(videoScript);
      } catch (e) {
        console.error("[Ezoic Video] Script injection error:", e);
        // Fallback
        setTimeout(() => {
          if (window._fgiomte) {
            window._fgiomte();
          }
        }, 1000);
      }
    }
    
    // Load Ezoic video player
    loadEzoicVideo();
    
    // Shorter timeout for modal - 5 seconds max
    setTimeout(function() {
      console.log("[Ezoic Video] Timeout - completing");
      if (window._fgiomte) {
        window._fgiomte();
      }
    }, EZOIC_CONFIG.timeout);

  } catch (e) {
    console.error("[Ezoic Video] Error:", e);
    // Fallback
    if (window._fgiomte) {
      window._fgiomte();
    }
  }
})();
