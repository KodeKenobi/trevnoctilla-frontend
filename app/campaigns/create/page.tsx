"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [uploadedData, setUploadedData] = useState<any>(null);

  // Form field values
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("uploadedCampaignData");
    if (!data) {
      router.push("/campaigns/upload");
      return;
    }
    setUploadedData(JSON.parse(data));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!campaignName.trim()) {
      setError("Campaign name is required");
      return;
    }

    if (!message.trim()) {
      setError("Message is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Combine all form data into the message template
      const formData = {
        sender_name: senderName || "Sender",
        sender_email: senderEmail || "sender@example.com",
        sender_phone: senderPhone || "+1 555-0000",
        sender_address: senderAddress || "",
        subject: subject || "Inquiry",
        message: message,
      };

      // Get or create session ID for guest users
      let sessionId = localStorage.getItem("guest_session_id");
      if (!sessionId) {
        sessionId = `guest_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        localStorage.setItem("guest_session_id", sessionId);
      }

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          message_template: JSON.stringify(formData), // Store form data as JSON
          companies: uploadedData.rows,
          session_id: sessionId, // Include session ID for guest tracking
        }),
      });

      if (!response.ok) {
        let errorMsg = "Failed to create campaign";
        try {
          const data = await response.json();
          errorMsg = data.error || errorMsg;
        } catch (e) {
          // If JSON parsing fails, use status text
          errorMsg = `Failed to create campaign (${response.status})`;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      localStorage.removeItem("uploadedCampaignData");
      router.push(`/campaigns/${data.campaign.id}`);
    } catch (err: any) {
      console.error("Failed to create campaign:", err);
      setError(err.message || "Failed to create campaign");
    } finally {
      setLoading(false);
    }
  };

  if (!uploadedData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
          <p className="text-sm text-white/60">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-8">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/campaigns/upload")}
          className="text-white/60 hover:text-white text-sm mb-4 transition-colors"
        >
          ← Back
        </button>

        {/* Sign-In/Sign-Up Banner for Guests */}
        {!user && (
          <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Unlock Full Campaign Power
                </h3>
                <p className="text-sm text-gray-300">
                  You're currently limited to 5 companies as a guest.
                  <strong className="text-white">
                    {" "}
                    Sign up free to get 50 companies per campaign
                  </strong>{" "}
                  - that's 10x more reach!
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/auth/register")}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors rounded-full whitespace-nowrap"
                >
                  Sign Up Free
                </button>
                <button
                  onClick={() => router.push("/auth/login")}
                  className="px-5 py-2 bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors rounded-full whitespace-nowrap"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Create Campaign
          </h1>
          <p className="text-sm text-white/60 mb-6">
            {uploadedData.validRows} companies ready • Fill in your details and
            message
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campaign Name */}
          <div>
            <label
              htmlFor="campaignName"
              className="block text-sm text-white mb-2"
            >
              Campaign Name
            </label>
            <input
              id="campaignName"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 text-white 
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all rounded-lg
                         placeholder:text-gray-500"
              placeholder="Q1 2026 Outreach"
              required
            />
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm text-white mb-3">Your Information</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-sm text-white 
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all rounded-lg
                           placeholder:text-gray-500"
                placeholder="Your Name"
              />

              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-sm text-white 
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all rounded-lg
                           placeholder:text-gray-500"
                placeholder="Your Email"
              />

              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-sm text-white 
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all rounded-lg
                           placeholder:text-gray-500"
                placeholder="Your Phone"
              />

              <input
                type="text"
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-sm text-white 
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all rounded-lg
                           placeholder:text-gray-500"
                placeholder="Your Address (optional)"
              />

              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 text-sm text-white 
                           focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all rounded-lg
                           placeholder:text-gray-500"
                placeholder="Subject"
              />
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm text-white mb-2">
              Your Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 text-white leading-relaxed
                         focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all resize-none rounded-lg
                         placeholder:text-gray-500"
              placeholder="Write your message here..."
              required
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/campaigns/upload")}
              className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium
                         hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
            >
              {loading ? "Creating..." : "Create Campaign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
