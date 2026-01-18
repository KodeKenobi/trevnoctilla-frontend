"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Loader,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  MessageSquare,
} from "lucide-react";

export default function CreateCampaignPage() {
  const router = useRouter();
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

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName,
          message_template: JSON.stringify(formData), // Store form data as JSON
          companies: uploadedData.rows,
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
        <Loader className="w-5 h-5 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-12 px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-gray-800">
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="group flex items-center gap-2 text-white hover:text-purple-400 text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <h1 className="text-xl font-medium text-white tracking-tight">Create Campaign</h1>
          </div>
          <p className="text-sm text-white font-mono ml-13">
            {uploadedData.validRows} companies ready to contact
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 rounded-lg">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label htmlFor="campaignName" className="block text-sm text-white font-medium mb-3">
              Campaign Name
            </label>
            <input
              id="campaignName"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-base text-white 
                       focus:border-white focus:outline-none transition-colors rounded-lg
                       hover:border-gray-700 placeholder:text-gray-600"
              placeholder="Q1 2026 Outreach Campaign"
              required
            />
          </div>

          {/* Form Data Section */}
          <div className="border border-white/20 rounded-lg p-6 bg-white/[0.02]">
            <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Form Data (Will be filled into contact forms)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Your Name */}
              <div>
                <label className="block text-xs text-white mb-2 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Your Name
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 text-sm text-white 
                           focus:border-white/30 focus:outline-none transition-colors rounded
                           hover:border-white/20 placeholder:text-gray-600"
                  placeholder="John Doe"
                />
                <p className="text-[10px] text-white/40 mt-1">Used for: Name, First Name, Last Name fields</p>
              </div>

              {/* Your Email */}
              <div>
                <label className="block text-xs text-white mb-2 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" />
                  Your Email
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 text-sm text-white 
                           focus:border-white/30 focus:outline-none transition-colors rounded
                           hover:border-white/20 placeholder:text-gray-600"
                  placeholder="john@example.com"
                />
                <p className="text-[10px] text-white/40 mt-1">Used for: Email, Contact Email fields</p>
              </div>

              {/* Your Phone */}
              <div>
                <label className="block text-xs text-white mb-2 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5" />
                  Your Phone
                </label>
                <input
                  type="tel"
                  value={senderPhone}
                  onChange={(e) => setSenderPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 text-sm text-white 
                           focus:border-white/30 focus:outline-none transition-colors rounded
                           hover:border-white/20 placeholder:text-gray-600"
                  placeholder="+1 555-123-4567"
                />
                <p className="text-[10px] text-white/40 mt-1">Used for: Phone, Mobile, Telephone fields</p>
              </div>

              {/* Your Address */}
              <div>
                <label className="block text-xs text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" />
                  Your Address
                </label>
                <input
                  type="text"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 text-sm text-white 
                           focus:border-white/30 focus:outline-none transition-colors rounded
                           hover:border-white/20 placeholder:text-gray-600"
                  placeholder="123 Main St, New York, NY 10001"
                />
                <p className="text-[10px] text-white/40 mt-1">Used for: Address, Location, City, State fields</p>
              </div>

              {/* Subject */}
              <div className="md:col-span-2">
                <label className="block text-xs text-white mb-2 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-black border border-white/10 text-sm text-white 
                           focus:border-white/30 focus:outline-none transition-colors rounded
                           hover:border-white/20 placeholder:text-gray-600"
                  placeholder="Business Inquiry"
                />
                <p className="text-[10px] text-white/40 mt-1">Used for: Subject, Topic, Inquiry Type fields</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-xs text-blue-300">
                💡 <strong>Smart Form Handling:</strong> The bot will automatically detect and handle checkboxes, radio buttons, dropdowns, and other fields on forms. It intelligently selects appropriate options based on context.
              </p>
            </div>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm text-white font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-base text-white leading-relaxed
                       focus:border-white focus:outline-none transition-colors resize-none rounded-lg
                       hover:border-gray-700 placeholder:text-gray-600"
              placeholder={`Hello,

I hope this message finds you well. I came across your website and was impressed by your work.

I'd love to discuss potential collaboration opportunities.

Looking forward to connecting!

Best regards`}
              required
            />
            <p className="text-xs text-white mt-2 font-mono">
              💬 This message will be filled into Message, Comments, or Inquiry fields on contact forms
            </p>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => router.push("/campaigns/upload")}
              className="px-5 py-2.5 text-sm text-white hover:text-purple-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="group flex items-center gap-2 px-6 py-2.5 bg-white text-black text-sm font-medium 
                       hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Campaign
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
