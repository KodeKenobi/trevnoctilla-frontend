// Comprehensive Analytics System - All Free Services
// This file provides analytics tracking for your website

// Global type declarations
declare global {
  interface Window {
    gtag: {
      (...args: any[]): void;
      q: any[];
    };
    posthog: any;
    plausible: any;
    fathom: any;
  }
}

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: number;
}

class AnalyticsManager {
  private consent: any = null;
  private events: AnalyticsEvent[] = [];
  private isInitialized = false;

  constructor() {
    this.loadConsent();
  }

  private loadConsent() {
    if (typeof window !== "undefined") {
      try {
        const consent = localStorage.getItem("cookieConsent");
        const preferences = localStorage.getItem("cookiePreferences");

        if (consent && preferences) {
          this.consent = JSON.parse(preferences);
          this.isInitialized = true;
          this.initializeAnalytics();
        }
      } catch (error) {
        
      }
    }
  }

  private initializeAnalytics() {
    if (!this.consent) return;

    try {
      // Initialize Google Analytics 4 (Free)
      if (this.consent.analytics) {
        this.initGoogleAnalytics();
      }

      // Initialize Plausible Analytics (Free tier available)
      if (this.consent.analytics) {
        this.initPlausible();
      }

      // Initialize PostHog (Free tier available)
      if (this.consent.analytics) {
        this.initPostHog();
      }

      // Initialize Hotjar (Free tier available)
      if (this.consent.analytics) {
        this.initHotjar();
      }

      // Initialize Microsoft Clarity (Free)
      if (this.consent.analytics) {
        this.initClarity();
      }

      // Initialize Fathom Analytics (Free tier available)
      if (this.consent.analytics) {
        this.initFathom();
      }
    } catch (error) {
      
    }
  }

  private initGoogleAnalytics() {
    // Google Analytics 4 - Free
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"; // Replace with your GA4 ID
    document.head.appendChild(script);

    window.gtag =
      window.gtag ||
      function () {
        (window.gtag.q = window.gtag.q || []).push(arguments);
      };
    window.gtag("js", new Date());
    window.gtag("config", "G-XXXXXXXXXX", {
      anonymize_ip: true,
      cookie_flags: "SameSite=None;Secure",
    });
  }

  private initPlausible() {
    // Plausible Analytics - Free tier available
    const script = document.createElement("script");
    script.defer = true;
    script.src = "https://plausible.io/js/script.js";
    script.setAttribute("data-domain", "trevnoctilla.com");
    document.head.appendChild(script);
  }

  private initPostHog() {
    // PostHog - Free tier available
    const script = document.createElement("script");
    script.src = "https://app.posthog.com/static/array.js";
    script.onload = () => {
      window.posthog.init("phc-XXXXXXXXXX", {
        // Replace with your PostHog key
        api_host: "https://app.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
        disable_session_recording: !this.consent.functional,
      });
    };
    document.head.appendChild(script);
  }

  private initHotjar() {
    // Hotjar - Free tier available
    const script = document.createElement("script");
    script.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:XXXXXXX,hjsv:6}; // Replace with your Hotjar ID
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(script);
  }

  private initClarity() {
    // Microsoft Clarity - Free
    const script = document.createElement("script");
    script.innerHTML = `
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "XXXXXXXXXX"); // Replace with your Clarity ID
    `;
    document.head.appendChild(script);
  }

  private initFathom() {
    // Fathom Analytics - Free tier available
    const script = document.createElement("script");
    script.src = "https://cdn.usefathom.com/script.js";
    script.setAttribute("data-site", "XXXXXXXXXX"); // Replace with your Fathom site ID
    script.setAttribute("data-spa", "auto");
    document.head.appendChild(script);
  }

  // Track custom events
  track(event: string, properties?: Record<string, any>) {
    if (!this.consent?.analytics) return;

    const eventData: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now(),
    };

    this.events.push(eventData);

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", event, properties);
    }

    // Send to PostHog
    if (window.posthog) {
      window.posthog.capture(event, properties);
    }

    // Send to Plausible
    if (window.plausible) {
      window.plausible(event, { props: properties });
    }

    // Send to Fathom
    if (window.fathom) {
      window.fathom.trackGoal(event, 0);
    }

    // Log to console for debugging
    
  }

  // Track page views
  trackPageView(url?: string) {
    if (!this.consent?.analytics) return;

    const pageUrl = url || window.location.href;
    const pageTitle = document.title;

    // Google Analytics
    if (window.gtag) {
      window.gtag("config", "G-XXXXXXXXXX", {
        page_title: pageTitle,
        page_location: pageUrl,
      });
    }

    // PostHog
    if (window.posthog) {
      window.posthog.capture("$pageview", {
        $current_url: pageUrl,
        $title: pageTitle,
      });
    }

    // Plausible
    if (window.plausible) {
      window.plausible("pageview", { u: pageUrl });
    }

    // Fathom
    if (window.fathom) {
      window.fathom.trackPageview();
    }
  }

  // Track user interactions
  trackClick(element: string, location: string) {
    this.track("click", {
      element,
      location,
      page: window.location.pathname,
    });
  }

  trackFormSubmit(formName: string, success: boolean) {
    this.track("form_submit", {
      form_name: formName,
      success,
      page: window.location.pathname,
    });
  }

  trackFileUpload(fileType: string, fileSize: number) {
    this.track("file_upload", {
      file_type: fileType,
      file_size: fileSize,
      page: window.location.pathname,
    });
  }

  trackConversion(conversionType: string, value?: number) {
    this.track("conversion", {
      conversion_type: conversionType,
      value,
      page: window.location.pathname,
    });
  }

  trackError(error: string, context?: string) {
    this.track("error", {
      error_message: error,
      context,
      page: window.location.pathname,
      user_agent: navigator.userAgent,
    });
  }

  // Track user behavior
  trackScroll(depth: number) {
    this.track("scroll", {
      scroll_depth: depth,
      page: window.location.pathname,
    });
  }

  trackTimeOnPage(timeSpent: number) {
    this.track("time_on_page", {
      time_spent: timeSpent,
      page: window.location.pathname,
    });
  }

  trackSearch(query: string, results?: number) {
    this.track("search", {
      search_query: query,
      results_count: results,
      page: window.location.pathname,
    });
  }

  // Get all tracked events (for debugging)
  getEvents() {
    return this.events;
  }

  // Clear events (for privacy)
  clearEvents() {
    this.events = [];
  }
}

// Create singleton instance
export const analytics = new AnalyticsManager();

// Auto-track page views
if (typeof window !== "undefined") {
  // Track initial page view
  analytics.trackPageView();

  // Track route changes (for SPA)
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      analytics.trackPageView(url);
    }
  }).observe(document, { subtree: true, childList: true });

  // Track scroll depth
  let maxScroll = 0;
  window.addEventListener("scroll", () => {
    const scrollDepth = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    if (scrollDepth > maxScroll) {
      maxScroll = scrollDepth;
      analytics.trackScroll(scrollDepth);
    }
  });

  // Track time on page
  const startTime = Date.now();
  window.addEventListener("beforeunload", () => {
    const timeSpent = Date.now() - startTime;
    analytics.trackTimeOnPage(timeSpent);
  });

  // Track errors
  window.addEventListener("error", (event) => {
    analytics.trackError(event.message, event.filename);
  });

  // Track unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    analytics.trackError(
      event.reason?.toString() || "Unhandled promise rejection"
    );
  });
}

// Export for use in components
export default analytics;
