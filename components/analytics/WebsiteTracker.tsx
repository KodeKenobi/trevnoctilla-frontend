"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import internalAnalytics from "../../lib/internalAnalytics";

export default function WebsiteTracker() {
  const pathname = usePathname();
  const startTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());

  // Skip tracking on admin/analytics page to avoid polluting analytics data
  const isAnalyticsPage = pathname === "/admin/analytics";

  useEffect(() => {
    // Skip all tracking on analytics page
    if (isAnalyticsPage) {
      return;
    }

    // Track page view when pathname changes
    internalAnalytics.trackPageView();

    // Reset timers for new page
    startTimeRef.current = Date.now();
    lastActivityRef.current = Date.now();

    // Track page load time
    const loadTime = performance.now();
    internalAnalytics.track("page_load", {
      load_time: loadTime,
      page: pathname,
      timestamp: Date.now(),
    });

    // Track Core Web Vitals
    if ("web-vital" in window) {
      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        internalAnalytics.track("web_vital", {
          metric: "LCP",
          value: lastEntry.startTime,
          page: pathname,
        });
      }).observe({ entryTypes: ["largest-contentful-paint"] });

      // First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEventTiming;
          internalAnalytics.track("web_vital", {
            metric: "FID",
            value: fidEntry.processingStart - fidEntry.startTime,
            page: pathname,
          });
        });
      }).observe({ entryTypes: ["first-input"] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const clsEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value || 0;
          }
        });
        internalAnalytics.track("web_vital", {
          metric: "CLS",
          value: clsValue,
          page: pathname,
        });
      }).observe({ entryTypes: ["layout-shift"] });
    }

    // Track user interactions
    const trackInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      const element = target.tagName?.toLowerCase() || "unknown";
      const className = target.className;
      const id = target.id;
      const text = target.textContent?.slice(0, 50) || "";

      internalAnalytics.track("user_interaction", {
        event_type: event.type,
        element,
        class: className,
        id,
        text,
        page: pathname,
        timestamp: Date.now(),
      });

      lastActivityRef.current = Date.now();
    };

    // Add event listeners for all interactions
    const events = [
      "click",
      "submit",
      "change",
      "focus",
      "blur",
      "keydown",
      "scroll",
    ];
    events.forEach((eventType) => {
      document.addEventListener(eventType, trackInteraction, true);
    });

    // Track form submissions
    const trackFormSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement;
      const formData = new FormData(form);
      const formFields: Record<string, string> = {};

      formData.forEach((value, key) => {
        formFields[key] = value.toString();
      });

      internalAnalytics.track("form_submit", {
        form_id: form.id,
        form_class: form.className,
        form_action: form.action,
        form_method: form.method,
        fields: Object.keys(formFields),
        page: pathname,
      });
    };

    document.addEventListener("submit", trackFormSubmit, true);

    // Track file uploads
    const trackFileUpload = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (input.type === "file" && input.files) {
        Array.from(input.files).forEach((file) => {
          internalAnalytics.track("file_upload", {
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            input_id: input.id,
            page: pathname,
          });
        });
      }
    };

    document.addEventListener("change", trackFileUpload, true);

    // Track external links
    const trackExternalLink = (event: Event) => {
      const link = event.target as HTMLAnchorElement;
      if (link.href && !link.href.startsWith(window.location.origin)) {
        internalAnalytics.track("external_link_click", {
          url: link.href,
          text: link.textContent?.slice(0, 50) || "",
          page: pathname,
        });
      }
    };

    document.addEventListener("click", trackExternalLink, true);

    // Track search queries
    const trackSearch = (event: Event) => {
      const input = event.target as HTMLInputElement;
      if (
        input.type === "search" ||
        input.name?.includes("search") ||
        input.placeholder?.toLowerCase().includes("search")
      ) {
        internalAnalytics.track("search_query", {
          query: input.value,
          input_id: input.id,
          input_name: input.name,
          page: pathname,
        });
      }
    };

    document.addEventListener("input", trackSearch, true);

    // Track button clicks
    const trackButtonClick = (event: Event) => {
      const button = event.target as HTMLButtonElement;
      if (
        button.tagName === "BUTTON" ||
        button.type === "button" ||
        button.type === "submit"
      ) {
        internalAnalytics.track("button_click", {
          button_text: button.textContent?.slice(0, 50) || "",
          button_id: button.id,
          button_class: button.className,
          page: pathname,
        });
      }
    };

    document.addEventListener("click", trackButtonClick, true);

    // Track navigation clicks
    const trackNavigation = (event: Event) => {
      const link = event.target as HTMLAnchorElement;
      if (link.tagName === "A" && link.href) {
        internalAnalytics.track("navigation_click", {
          url: link.href,
          text: link.textContent?.slice(0, 50) || "",
          is_external: !link.href.startsWith(window.location.origin),
          page: pathname,
        });
      }
    };

    document.addEventListener("click", trackNavigation, true);

    // Track tool usage
    const trackToolUsage = (event: Event) => {
      const element = event.target as HTMLElement;
      if (element.closest("[data-tool]")) {
        const tool = element.closest("[data-tool]")?.getAttribute("data-tool");
        internalAnalytics.track("tool_usage", {
          tool_name: tool,
          action: event.type,
          element: element.tagName.toLowerCase(),
          page: pathname,
        });
      }
    };

    document.addEventListener("click", trackToolUsage, true);

    // Track API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const startTime = Date.now();

      try {
        const response = await originalFetch(...args);
        const endTime = Date.now();

        // Don't track analytics calls to avoid recursion
        const urlStr = url.toString();
        if (!urlStr.includes("/api/analytics/")) {
          internalAnalytics.track("api_call", {
            url: urlStr,
            method: options?.method || "GET",
            status: response.status,
            duration: endTime - startTime,
            page: pathname,
          });
        }

        return response;
      } catch (error) {
        const endTime = Date.now();
        const urlStr = url.toString();

        // Don't track analytics errors to avoid recursion
        if (!urlStr.includes("/api/analytics/")) {
          internalAnalytics.track("api_error", {
            url: urlStr,
            method: options?.method || "GET",
            error: error instanceof Error ? error.message : "Unknown error",
            duration: endTime - startTime,
            page: pathname,
          });
        }

        throw error;
      }
    };

    // Track user session
    const trackSession = () => {
      const sessionDuration = Date.now() - startTimeRef.current;
      const timeSinceLastActivity = Date.now() - lastActivityRef.current;

      internalAnalytics.track("session_update", {
        session_duration: sessionDuration,
        time_since_last_activity: timeSinceLastActivity,
        page: pathname,
        timestamp: Date.now(),
      });
    };

    // Track session every 30 seconds
    const sessionInterval = setInterval(trackSession, 30000);

    // Track when user leaves page
    const trackPageLeave = () => {
      const sessionDuration = Date.now() - startTimeRef.current;
      internalAnalytics.track("page_leave", {
        session_duration: sessionDuration,
        page: pathname,
        timestamp: Date.now(),
      });
    };

    window.addEventListener("beforeunload", trackPageLeave);

    // Cleanup
    return () => {
      clearInterval(sessionInterval);
      events.forEach((eventType) => {
        document.removeEventListener(eventType, trackInteraction, true);
      });
      document.removeEventListener("submit", trackFormSubmit, true);
      document.removeEventListener("change", trackFileUpload, true);
      document.removeEventListener("click", trackExternalLink, true);
      document.removeEventListener("input", trackSearch, true);
      document.removeEventListener("click", trackButtonClick, true);
      document.removeEventListener("click", trackNavigation, true);
      document.removeEventListener("click", trackToolUsage, true);
      window.removeEventListener("beforeunload", trackPageLeave);
    };
  }, [pathname, isAnalyticsPage]);

  return null; // This component doesn't render anything
}
