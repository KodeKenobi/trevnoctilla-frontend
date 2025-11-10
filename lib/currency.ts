// Currency conversion utility
// Fetches USD to ZAR exchange rate and converts amounts

const EXCHANGE_RATE_CACHE_KEY = "usd_to_zar_rate";
const EXCHANGE_RATE_CACHE_DURATION = 60 * 60 * 1000; // 1 hour

interface ExchangeRateCache {
  rate: number;
  timestamp: number;
}

/**
 * Get USD to ZAR exchange rate
 * Uses free API and caches the result for 1 hour
 */
export async function getUSDToZARRate(): Promise<number> {
  // Check cache first
  if (typeof window !== "undefined") {
    const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
    if (cached) {
      try {
        const cache: ExchangeRateCache = JSON.parse(cached);
        const now = Date.now();
        // Use cached rate if less than 1 hour old
        if (now - cache.timestamp < EXCHANGE_RATE_CACHE_DURATION) {
          return cache.rate;
        }
      } catch (e) {
        // Invalid cache, fetch new rate
      }
    }
  }

  try {
    // Use exchangerate-api.com free tier (no API key needed for USD to ZAR)
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    );
    const data = await response.json();
    const rate = data.rates?.ZAR || 18.5; // Fallback to ~18.5 if API fails

    // Cache the rate
    if (typeof window !== "undefined") {
      const cache: ExchangeRateCache = {
        rate,
        timestamp: Date.now(),
      };
      localStorage.setItem(EXCHANGE_RATE_CACHE_KEY, JSON.stringify(cache));
    }

    return rate;
  } catch (error) {
    console.error("Failed to fetch exchange rate:", error);
    // Fallback to cached rate or default
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem(EXCHANGE_RATE_CACHE_KEY);
      if (cached) {
        try {
          const cache: ExchangeRateCache = JSON.parse(cached);
          return cache.rate;
        } catch (e) {
          // Invalid cache
        }
      }
    }
    // Default fallback rate (approximate)
    return 18.5;
  }
}

/**
 * Convert USD amount to ZAR
 */
export async function convertUSDToZAR(usdAmount: number): Promise<number> {
  const rate = await getUSDToZARRate();
  return parseFloat((usdAmount * rate).toFixed(2));
}
