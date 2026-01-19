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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading campaign data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-24 pb-12 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/campaigns/upload")}
            className="group flex items-center gap-2 text-gray-300 hover:text-white text-sm mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Upload
          </button>
          
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-white mb-2">
                  Create Your Campaign Template
                </h1>
                <p className="text-gray-300 text-sm leading-relaxed mb-3">
                  You've uploaded <strong className="text-white">{uploadedData.validRows} companies</strong>. 
                  Now, create your message template that will be used to fill out contact forms on each company's website.
                </p>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-300 uppercase tracking-wide">How it works:</p>
                  <ol className="text-sm text-gray-300 space-y-1.5 ml-4 list-decimal">
                    <li>Fill in YOUR contact information below (name, email, phone, etc.)</li>
                    <li>Write YOUR custom message</li>
                    <li>Click "Create Campaign" to save your template</li>
                    <li>Then use "Rapid All" to automatically fill forms for all companies</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-200 text-sm flex items-start gap-3 rounded-xl">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-semibold mb-1">Error creating campaign</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <label
              htmlFor="campaignName"
              className="block text-sm text-white font-semibold mb-2"
            >
              Step 1: Name Your Campaign
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Give your campaign a memorable name so you can find it later (e.g., "January Outreach", "Partnership Campaign Q1")
            </p>
            <input
              id="campaignName"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-base text-white 
                       focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all rounded-lg
                       hover:border-gray-500 placeholder:text-gray-500"
              placeholder="Q1 2026 Outreach Campaign"
              required
            />
          </div>

          {/* Form Data Section */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Step 2: Your Contact Information
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Fill in YOUR details below. The bot will automatically detect form fields on each company's website 
                and fill them with this information. <strong className="text-gray-300">All fields are optional</strong> - 
                only fill what you want to share.
              </p>
            </div>

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
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-sm text-white 
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all rounded
                           hover:border-gray-500 placeholder:text-gray-500"
                  placeholder="John Doe"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Used for: Name, First Name, Last Name fields
                </p>
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
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-sm text-white 
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all rounded
                           hover:border-gray-500 placeholder:text-gray-500"
                  placeholder="john@example.com"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Used for: Email, Contact Email fields
                </p>
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
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-sm text-white 
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all rounded
                           hover:border-gray-500 placeholder:text-gray-500"
                  placeholder="+1 555-123-4567"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Used for: Phone, Mobile, Telephone fields
                </p>
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
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-sm text-white 
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all rounded
                           hover:border-gray-500 placeholder:text-gray-500"
                  placeholder="123 Main St, New York, NY 10001"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Used for: Address, Location, City, State fields
                </p>
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
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-600 text-sm text-white 
                           focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all rounded
                           hover:border-gray-500 placeholder:text-gray-500"
                  placeholder="Partnership Opportunity"
                />
                <p className="text-[10px] text-white/40 mt-1">
                  Used for: Subject, Topic, Inquiry Type fields
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <p className="text-xs font-semibold text-purple-300 mb-2">🤖 Smart Automation Features:</p>
              <ul className="text-xs text-purple-200 space-y-1 ml-4 list-disc">
                <li>Automatically detects and fills checkboxes, radio buttons, and dropdowns</li>
                <li>Matches your subject to the best option in "Inquiry Type" dropdowns</li>
                <li>Handles country codes, phone formats, and address fields intelligently</li>
                <li>Adapts to different form layouts and field names</li>
              </ul>
            </div>
          </div>

          {/* Message */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <label
              htmlFor="message"
              className="block text-sm text-white font-semibold mb-2 flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-green-400" />
              Step 3: Write Your Message
            </label>
            <p className="text-xs text-gray-400 mb-3">
              Write the message you want to send to each company. This will be filled into "Message", "Comments", 
              or "Inquiry" fields on their contact forms. <strong className="text-gray-300">Be personal and professional!</strong>
            </p>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 text-base text-white leading-relaxed
                       focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all resize-none rounded-lg
                       hover:border-gray-500 placeholder:text-gray-500"
              placeholder={`Hello,

I hope this message finds you well. I came across your website and was impressed by your work.

I'd love to discuss potential collaboration opportunities.

Looking forward to connecting!

Best regards`}
              required
            />
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-xs text-green-300">
                ✓ The bot will automatically find and fill the message field on each company's contact form
              </p>
            </div>
          </div>

          {/* Submit */}
          <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-6">
            <div className="mb-4">
              <p className="text-sm font-semibold text-white mb-1">Ready to launch?</p>
              <p className="text-xs text-gray-400">
                After you create this campaign, you'll be able to process all {uploadedData.validRows} companies 
                automatically using the "Rapid All" button on the next page.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.push("/campaigns/upload")}
                className="px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Go Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="group flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold 
                         hover:from-blue-600 hover:to-purple-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-lg shadow-blue-500/25"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    Create Campaign & Continue
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
