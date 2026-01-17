"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, StopCircle, Eye, Loader } from "lucide-react";

/**
 * Live Campaign Monitoring View  
 * Watch company websites being visited in real-time (like image converter testing)
 */

interface Company {
  id: number;
  company_name: string;
  website_url: string;
  status: string;
}

export default function CampaignMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [campaign, setCampaign] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch campaign and companies
  useEffect(() => {
    fetchCampaign();
  }, [campaignId]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();
      
      if (data.campaign) {
        setCampaign(data.campaign);
        
        // Fetch companies
        const companiesResponse = await fetch(`/api/campaigns/${campaignId}/companies`);
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.companies || []);
        
        // Auto-select first company
        if (companiesData.companies && companiesData.companies.length > 0) {
          setSelectedCompany(companiesData.companies[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const startMonitoring = () => {
    if (selectedCompany) {
      setIsMonitoring(true);
      addLog('info', 'Started monitoring', `Loading ${selectedCompany.website_url}`);
      
      // Update iframe to load the company website
      if (iframeRef.current) {
        iframeRef.current.src = selectedCompany.website_url;
      }
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    addLog('warning', 'Stopped monitoring', 'Monitoring stopped by user');
  };

  const addLog = (status: string, action: string, message: string) => {
    setLogs(prev => [...prev, {
      status,
      action,
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 pt-24 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-12 px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Live Website Monitor</h1>
            <p className="text-gray-400">Watch company websites being visited - just like the converter tests</p>
          </div>
          <button
            onClick={() => router.push(`/campaigns/${campaignId}`)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 border border-gray-700"
          >
            Back to Campaign
          </button>
        </div>

        {/* Main Layout: Company Selector + Iframe + Logs */}
        <div className="flex gap-4 h-[calc(100vh-200px)]">
          {/* Left Sidebar - Company Selector & Controls */}
          <div className="w-80 space-y-4">
            {/* Company Selector */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Select Company</h3>
              <select
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find(c => c.id === parseInt(e.target.value));
                  setSelectedCompany(company || null);
                  if (isMonitoring) {
                    setIsMonitoring(false);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
              {selectedCompany && (
                <div className="mt-2 text-xs text-gray-400 break-all">
                  {selectedCompany.website_url}
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Controls</h3>
              <div className="space-y-2">
                {!isMonitoring ? (
                  <button
                    onClick={startMonitoring}
                    disabled={!selectedCompany}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="h-4 w-4" />
                    Load Website
                  </button>
                ) : (
                  <button
                    onClick={stopMonitoring}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <StopCircle className="h-4 w-4" />
                    Stop
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Center - Live Iframe */}
          <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-400" />
                <span className="text-white font-semibold">Website View</span>
              </div>
              {isMonitoring && selectedCompany && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Live</span>
                </div>
              )}
            </div>
            
            {isMonitoring && selectedCompany ? (
              <iframe
                ref={iframeRef}
                src={selectedCompany.website_url}
                className="flex-1 w-full border-0 bg-white"
                title="Company Website View"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                onLoad={() => addLog('success', 'Loaded', `Successfully loaded ${selectedCompany.website_url}`)}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Select a company and click "Load Website" to view</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Logs */}
          <div className="w-80 bg-gray-800/50 border border-gray-700 rounded-lg flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-semibold">Activity Log</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[calc(100vh-300px)]">
              {logs.length === 0 ? (
                <div className="text-center text-gray-500 text-sm pt-8">
                  No activity yet
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-xs border ${
                      log.status === 'success'
                        ? 'bg-green-900/20 border-green-500/30 text-green-300'
                      : log.status === 'failed'
                      ? 'bg-red-900/20 border-red-500/30 text-red-300'
                      : log.status === 'warning'
                      ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                      : 'bg-blue-900/20 border-blue-500/30 text-blue-300'
                    }`}
                  >
                    <div className="font-semibold mb-1">{log.action}</div>
                    <div className="opacity-75">{log.message}</div>
                    <div className="text-xs opacity-50 mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
