(function () {
  try {
    console.log("[Video Ads] Initializing PropellerAds Multitag system...");
    
    // PropellerAds Multitag configuration
    const MULTITAG_CONFIG = {
      zoneId: 179377,  // Your real Multitag zone ID
      domain: "fpyf8.com",
      scriptPath: "/88/tag.min.js"
    };

    // Function to load PropellerAds Multitag
    function loadMultitagAd(callback) {
      const script = document.createElement("script");
      script.src = `https://${MULTITAG_CONFIG.domain}${MULTITAG_CONFIG.scriptPath}`;
      script.setAttribute("data-zone", MULTITAG_CONFIG.zoneId);
      script.async = true;
      script.setAttribute("data-cfasync", "false");
      
      script.onload = function() {
        console.log(`[Video Ads] PropellerAds Multitag loaded successfully (Zone: ${MULTITAG_CONFIG.zoneId})`);
        if (callback) callback();
      };
      
      script.onerror = function() {
        console.error(`[Video Ads] Failed to load PropellerAds Multitag (Zone: ${MULTITAG_CONFIG.zoneId})`);
        if (callback) callback();
      };
      
      try {
        document.head.appendChild(script);
      } catch (e) {
        console.error("[Video Ads] Script injection error:", e);
        if (callback) callback();
      }
    }

    // Load PropellerAds Multitag
    loadMultitagAd(function() {
      // Set up ad completion callback
      if (window._fgiomte) {
        console.log("[Video Ads] Multitag ad completion callback ready");
      }
    });

    // Fallback timeout - if no ad loads in 10 seconds, trigger completion
    setTimeout(function() {
      if (!window._fgiomte) {
        console.log("[Video Ads] Fallback timeout - triggering completion");
        if (window._fgiomte) {
          window._fgiomte();
        }
      }
    }, 10000);

  } catch (e) {
    console.error("[Video Ads] PropellerAds Multitag error:", e);
  }
})();
