'use client';

import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Globe, ArrowRight } from 'lucide-react';

export default function LeadsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [senderInfo, setSenderInfo] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '0123456789',
    subject: 'Interested in your services',
    message: 'Hello, I came across your website and would like to learn more about your offerings.'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setProcessing(true);
    setError(null);
    setResults([]);

    const formData = new FormData();
    formData.append('file', file);
    Object.entries(senderInfo).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process leads');

      setResults(data.results);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Leads Automation
          </h1>
          <p className="text-gray-400 mt-2">
            Upload a spreadsheet, and we'll fill form contacts and take screenshots for you.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                Processing Setup
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Spreadsheet (CSV/XLSX)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept=".csv,.xlsx"
                      onChange={handleFileChange}
                      className="hidden" 
                      id="file-upload"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-xl p-6 cursor-pointer bg-zinc-900/50 group-hover:border-blue-500 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-zinc-500 group-hover:text-blue-400 mb-2" />
                      <span className="text-sm text-zinc-400 group-hover:text-zinc-200">
                        {file ? file.name : 'Choose a file'}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">First Name</label>
                    <input 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                      value={senderInfo.firstName}
                      onChange={e => setSenderInfo({...senderInfo, firstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Last Name</label>
                    <input 
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                      value={senderInfo.lastName}
                      onChange={e => setSenderInfo({...senderInfo, lastName: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Your Email</label>
                  <input 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm focus:outline-none focus:border-blue-500"
                    value={senderInfo.email}
                    onChange={e => setSenderInfo({...senderInfo, email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1">Message Template</label>
                  <textarea 
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2 text-sm h-24 focus:outline-none focus:border-blue-500"
                    value={senderInfo.message}
                    onChange={e => setSenderInfo({...senderInfo, message: e.target.value})}
                  />
                </div>

                <button 
                  disabled={!file || processing}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-zinc-800 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing Leads...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-5 h-5" />
                      Start Automation
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">Live Results</h2>
              <span className="text-sm text-zinc-500">{results.length} processed</span>
            </div>

            {results.length === 0 && !processing ? (
              <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
                <Globe className="w-12 h-12 text-zinc-700 mb-3" />
                <p className="text-zinc-500 text-sm">Waiting for you to run the automation...</p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((res, i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Globe className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <span className="text-xs font-mono text-zinc-300 truncate">{new URL(res.url).hostname}</span>
                    </div>
                    {res.status === 'Filled' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  
                  {res.screenshot ? (
                    <div className="aspect-video relative group cursor-zoom-in overflow-hidden">
                      <img 
                        src={res.screenshot} 
                        alt="Form fill screenshot" 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs bg-black/60 px-3 py-1 rounded-full border border-white/20">View Screenshot</span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-zinc-950 flex flex-col items-center justify-center text-xs text-zinc-600 gap-2">
                       <AlertCircle className="w-6 h-6" />
                       {res.error || 'Screenshot failed'}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {processing && (
               <div className="flex items-center justify-center py-12 gap-3 text-blue-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-sm font-medium">Navigating through leads and filling forms...</span>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
