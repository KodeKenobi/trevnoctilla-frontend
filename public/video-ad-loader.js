(function () {
  try {
    console.log("[Clean Ads] Initializing clean ad system...");
    
    // Clean, simple ad system for modal
    function showCleanAd() {
      // Create a simple, clean ad experience
      const adContainer = document.createElement('div');
      adContainer.id = 'clean-ad-container';
      adContainer.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        z-index: 9999;
        max-width: 400px;
        width: 90%;
        text-align: center;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      
      adContainer.innerHTML = `
        <div style="margin-bottom: 16px;">
          <div style="width: 48px; height: 48px; background: #3b82f6; border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600;">Support Trevnoctilla</h3>
          <p style="margin: 0; font-size: 14px; color: #94a3b8;">Thank you for using our free tools!</p>
        </div>
        <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">This helps us keep the service free for everyone</p>
        </div>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <button id="skip-ad-btn" style="background: #374151; border: none; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer;">Skip (3s)</button>
          <button id="support-btn" style="background: #3b82f6; border: none; color: white; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer;">Support Us</button>
        </div>
      `;
      
      document.body.appendChild(adContainer);
      
      // Countdown timer
      let countdown = 3;
      const skipBtn = document.getElementById('skip-ad-btn');
      const supportBtn = document.getElementById('support-btn');
      
      const updateCountdown = () => {
        skipBtn.textContent = `Skip (${countdown}s)`;
        if (countdown > 0) {
          countdown--;
          setTimeout(updateCountdown, 1000);
        } else {
          skipBtn.textContent = 'Skip';
          skipBtn.disabled = false;
        }
      };
      
      updateCountdown();
      
      // Event handlers
      skipBtn.addEventListener('click', () => {
        completeAd();
      });
      
      supportBtn.addEventListener('click', () => {
        completeAd();
      });
      
      // Auto-complete after 5 seconds
      setTimeout(() => {
        completeAd();
      }, 5000);
      
      function completeAd() {
        if (adContainer.parentNode) {
          adContainer.parentNode.removeChild(adContainer);
        }
        console.log("[Clean Ads] Clean ad completed");
        if (window._fgiomte) {
          window._fgiomte();
        }
      }
    }
    
    // Show clean ad immediately
    showCleanAd();

  } catch (e) {
    console.error("[Clean Ads] Clean ad system error:", e);
    // Fallback - complete immediately
    if (window._fgiomte) {
      window._fgiomte();
    }
  }
})();
