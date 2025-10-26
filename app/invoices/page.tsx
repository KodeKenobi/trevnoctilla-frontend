"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Edit,
  FileText,
  ShoppingCart,
  Receipt,
  CreditCard,
  Building,
  Briefcase,
  GraduationCap,
  Heart,
  Wrench,
  Lightbulb,
  Image as ImageIcon,
  Search,
  Filter,
  ArrowRight,
  Eye,
} from "lucide-react";
import Link from "next/link";

interface Invoice {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  icon: any;
  color: string;
  downloadUrl: string;
}

const invoiceTemplates: Invoice[] = [
  {
    id: "invoice-1",
    title: "Simple Business Invoice",
    type: "Standard",
    category: "Business",
    description: "Clean and professional invoice for any business",
    icon: Briefcase,
    color: "from-blue-500 to-cyan-500",
    downloadUrl: "/templates/simple-business-invoice.html",
  },
  {
    id: "invoice-2",
    title: "Retail Store Invoice",
    type: "Retail",
    category: "Business",
    description: "Perfect for retail stores and shops",
    icon: ShoppingCart,
    color: "from-green-500 to-emerald-500",
    downloadUrl: "/templates/retail-store-invoice.html",
  },
  {
    id: "invoice-3",
    title: "Service Provider Invoice",
    type: "Service",
    category: "Business",
    description: "Ideal for consultants, freelancers, and service providers",
    icon: Wrench,
    color: "from-purple-500 to-pink-500",
    downloadUrl: "/templates/service-provider-invoice.html",
  },
  {
    id: "invoice-4",
    title: "Subscription Invoice",
    type: "Subscription",
    category: "Business",
    description: "Recurring billing template for subscription services",
    icon: CreditCard,
    color: "from-orange-500 to-red-500",
    downloadUrl: "/templates/subscription-invoice.html",
  },
  {
    id: "invoice-5",
    title: "Restaurant Invoice",
    type: "Food & Beverage",
    category: "Hospitality",
    description: "Restaurant and cafe billing template",
    icon: Receipt,
    color: "from-amber-500 to-yellow-500",
    downloadUrl: "/templates/restaurant-invoice.html",
  },
  {
    id: "invoice-6",
    title: "Construction Invoice",
    type: "Construction",
    category: "Business",
    description: "Construction and contractor invoice template",
    icon: Wrench,
    color: "from-yellow-600 to-orange-600",
    downloadUrl: "/templates/construction-invoice.html",
  },
  {
    id: "invoice-7",
    title: "Education Invoice",
    type: "Education",
    category: "Education",
    description: "School, college, and educational institution invoice",
    icon: GraduationCap,
    color: "from-indigo-500 to-blue-500",
    downloadUrl: "/templates/education-invoice.html",
  },
  {
    id: "invoice-8",
    title: "Medical Invoice",
    type: "Healthcare",
    category: "Healthcare",
    description: "Medical clinic and healthcare provider invoice",
    icon: Heart,
    color: "from-red-500 to-pink-500",
    downloadUrl: "/templates/medical-invoice.html",
  },
  {
    id: "invoice-9",
    title: "Legal Services Invoice",
    type: "Legal",
    category: "Professional Services",
    description: "Law firm and legal services invoice template",
    icon: FileText,
    color: "from-slate-600 to-gray-600",
    downloadUrl: "/templates/legal-invoice.html",
  },
  {
    id: "invoice-10",
    title: "Creative Agency Invoice",
    type: "Creative",
    category: "Business",
    description: "Design agencies and creative professionals",
    icon: Lightbulb,
    color: "from-violet-500 to-purple-500",
    downloadUrl: "/templates/creative-agency-invoice.html",
  },
  {
    id: "invoice-11",
    title: "E-commerce Invoice",
    type: "E-commerce",
    category: "Business",
    description: "Online store and e-commerce platform invoice",
    icon: ShoppingCart,
    color: "from-cyan-500 to-blue-500",
    downloadUrl: "/templates/ecommerce-invoice.html",
  },
  {
    id: "invoice-12",
    title: "Photography Invoice",
    type: "Photography",
    category: "Creative",
    description: "Photographer and photography studio invoice",
    icon: ImageIcon,
    color: "from-pink-500 to-rose-500",
    downloadUrl: "/templates/photography-invoice.html",
  },
];

const categories = [
  "All",
  "Business",
  "Healthcare",
  "Education",
  "Professional Services",
  "Creative",
  "Hospitality",
];

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoiceTemplates.filter((invoice) => {
    const matchesSearch =
      invoice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || invoice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDownload = (invoice: Invoice) => {
    // Create a download link
    const link = document.createElement("a");
    link.href = invoice.downloadUrl;
    link.download = `${invoice.title.replace(/\s+/g, "-")}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (invoice: Invoice) => {
    // Navigate to PDF editor with invoice
    window.location.href = `/pdf-editor?template=${encodeURIComponent(
      invoice.downloadUrl
    )}`;
  };

  const handlePreview = (invoice: Invoice) => {
    // Open invoice in new tab for preview
    window.open(invoice.downloadUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 page-content">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Professional Invoice Templates
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Download and customize professional invoices for your business. Edit
            them with our powerful PDF editor.
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-12 pr-4 py-3 bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all cursor-pointer appearance-none w-full sm:w-auto"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-gray-400 text-sm">
            Showing {filteredInvoices.length} of {invoiceTemplates.length}{" "}
            invoice templates
          </p>
        </motion.div>

        {/* Invoice Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredInvoices.map((invoice, index) => {
            const IconComponent = invoice.icon;
            return (
              <motion.div
                key={invoice.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all group"
              >
                {/* Template Preview */}
                <div className="relative aspect-[3/4] bg-gradient-to-br from-gray-700 to-gray-800 overflow-hidden">
                  {/* Mock Invoice Design */}
                  <div className="absolute inset-4 rounded-lg overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="h-24 bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">INVOICE</span>
                    </div>
                    
                    {/* Content Area */}
                    <div className="bg-white p-4 h-full">
                      {/* Company Info */}
                      <div className="space-y-1 mb-4">
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      
                      {/* Table */}
                      <div className="mb-3">
                        <div className="h-6 bg-purple-100 rounded mb-1"></div>
                        <div className="space-y-1">
                          <div className="h-3 bg-gray-100 rounded"></div>
                          <div className="h-3 bg-gray-100 rounded"></div>
                          <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                        </div>
                      </div>
                      
                      {/* Summary */}
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-purple-200 rounded mt-2"></div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Overlay with View Icon */}
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       onClick={() => handlePreview(invoice)}>
                    <div className="bg-white/90 backdrop-blur-sm p-6 rounded-full shadow-xl hover:scale-110 transition-transform">
                      <Eye className="w-12 h-12 text-purple-600" />
                    </div>
                  </div>
                </div>

                {/* Title and Actions */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {invoice.title}
                  </h3>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                    {invoice.description}
                  </p>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded text-xs font-medium">
                      {invoice.type}
                    </span>
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-medium border border-purple-500/30">
                      {invoice.category}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(invoice)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700/50 hover:bg-gray-700 text-white rounded transition-all text-xs group/item"
                    >
                      <Download className="w-3 h-3 group-hover/item:translate-y-0.5 transition-transform" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleEdit(invoice)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded transition-all text-xs group/item"
                    >
                      <Edit className="w-3 h-3 group-hover/item:rotate-12 transition-transform" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {filteredInvoices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FileText className="w-20 h-20 text-gray-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              No invoices found
            </h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search or filter criteria
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("All");
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all"
            >
              Clear Filters
            </button>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Need More Customization?
          </h2>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Use our powerful PDF editor to customize these templates to match
            your brand perfectly.
          </p>
          <Link
            href="/pdf-editor"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all group"
          >
            Open PDF Editor
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
