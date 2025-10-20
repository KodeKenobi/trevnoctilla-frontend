(function () {
  try {
    console.log("[Ezoic Video] Initializing Ezoic video ad placement...");
    
    // Create Ezoic ad placeholder for video ads
    function createEzoicVideoAd() {
      // Create placeholder div
      const placeholder = document.createElement('div');
      placeholder.id = 'ezoic-pub-ad-placeholder-video-modal';
      placeholder.style.cssText = `
        width: 100%;
        max-width: 400px;
        height: 300px;
        margin: 0 auto;
        background: #1e293b;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      // Add loading message
      placeholder.innerHTML = `
        <div style="text-align: center;">
          <div style="width: 40px; height: 40px; border: 2px solid #3b82f6; border-top: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
          <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">Loading Video Ad</div>
          <div style="font-size: 14px; color: #94a3b8;">Please wait...</div>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      
      // Add to modal content
      const modalContent = document.querySelector('[data-modal-content]') || document.body;
      modalContent.appendChild(placeholder);
      
      // Show Ezoic ad
      if (window.ezstandalone && window.ezstandalone.cmd) {
        window.ezstandalone.cmd.push(function () {
          console.log("[Ezoic Video] Showing video ad placement");
          window.ezstandalone.showAds('video-modal');
        });
      } else {
        console.log("[Ezoic Video] Ezoic not ready, waiting...");
        // Wait for Ezoic to load
        setTimeout(() => {
          if (window.ezstandalone && window.ezstandalone.cmd) {
            window.ezstandalone.cmd.push(function () {
              window.ezstandalone.showAds('video-modal');
            });
          }
        }, 1000);
      }
      
      // Set up completion callback
      if (window._fgiomte) {
        console.log("[Ezoic Video] Video completion callback ready");
      }
    }
    
    // Create the video ad
    createEzoicVideoAd();
    
    // Timeout after 8 seconds
    setTimeout(function() {
      console.log("[Ezoic Video] Timeout - completing");
      if (window._fgiomte) {
        window._fgiomte();
      }
    }, 8000);

  } catch (e) {
    console.error("[Ezoic Video] Error:", e);
    // Fallback
    if (window._fgiomte) {
      window._fgiomte();
    }
  }
})();
