"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const campaignId = params.id as string;
  const companyIdParam = searchParams.get('company');
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
        
        // Auto-select company from query param or first company
        if (companiesData.companies && companiesData.companies.length > 0) {
          if (companyIdParam) {
            const targetCompany = companiesData.companies.find((c: Company) => c.id === parseInt(companyIdParam));
            setSelectedCompany(targetCompany || companiesData.companies[0]);
          } else {
            setSelectedCompany(companiesData.companies[0]);
          }
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
      addLog('info', 'Started monitoring', `Connecting to live scraper...`);
      
      // Connect to WebSocket for live streaming
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const backendUrl = 'web-production-737b.up.railway.app';
      const wsUrl = `${wsProtocol}//${backendUrl}/ws/campaign/${campaignId}/monitor/${selectedCompany.id}`;
      
      console.log('[WebSocket] Attempting to connect:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[WebSocket] Connection opened successfully');
        addLog('success', 'Connected', 'Connected to live scraper');
      };
      
      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'log') {
          const log = message.data;
          addLog(log.status, log.action, log.message);
        } else if (message.type === 'screenshot') {
          // Update iframe with screenshot
          if (iframeRef.current && message.data.image) {
            const doc = iframeRef.current.contentDocument;
            if (doc) {
              doc.open();
              doc.write(`
                <html>
                  <head>
                    <style>
                      body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #000; }
                      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                    </style>
                  </head>
                  <body>
                    <img src="${message.data.image}" alt="Live Browser View" />
                  </body>
                </html>
              `);
              doc.close();
            }
          }
        } else if (message.type === 'completed') {
          addLog('success', 'Completed', 'Scraping completed!');
          setIsMonitoring(false);
          ws.close();
        } else if (message.type === 'error') {
          addLog('failed', 'Error', message.data.message);
          setIsMonitoring(false);
          ws.close();
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        addLog('failed', 'WebSocket Error', `Connection failed. Check console for details.`);
        setIsMonitoring(false);
      };
      
      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        if (event.code !== 1000) {
          addLog('warning', 'Disconnected', `Connection closed (Code: ${event.code})`);
        }
        setIsMonitoring(false);
      };
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

        {/* Top Control Bar */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4">
            {/* Company Selector */}
            <div className="flex items-center gap-3 flex-1">
              <Eye className="h-5 w-5 text-purple-400" />
              <select
                value={selectedCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find(c => c.id === parseInt(e.target.value));
                  setSelectedCompany(company || null);
                  if (isMonitoring) {
                    setIsMonitoring(false);
                  }
                }}
                className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.company_name} - {company.website_url}
                  </option>
                ))}
              </select>
            </div>

            {/* Control Button */}
            <div>
              {!isMonitoring ? (
                <button
                  onClick={startMonitoring}
                  disabled={!selectedCompany}
                  className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Play className="h-4 w-4" />
                  Load Website
                </button>
              ) : (
                <button
                  onClick={stopMonitoring}
                  className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop
                </button>
              )}
            </div>

            {/* Live Status Indicator */}
            {isMonitoring && selectedCompany && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-900/30 border border-green-500/30 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">Live</span>
              </div>
            )}
          </div>

          {/* Latest Activity */}
          {logs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Latest:</span>
                <span className={`font-medium ${
                  logs[logs.length - 1].status === 'success' ? 'text-green-400' :
                  logs[logs.length - 1].status === 'failed' ? 'text-red-400' :
                  logs[logs.length - 1].status === 'warning' ? 'text-yellow-400' :
                  'text-blue-400'
                }`}>
                  {logs[logs.length - 1].action}
                </span>
                <span className="text-gray-500">-</span>
                <span className="text-gray-300">{logs[logs.length - 1].message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Full Width Website View */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 280px)' }}>
          {isMonitoring && selectedCompany ? (
            <iframe
              ref={iframeRef}
              src={selectedCompany.website_url}
              className="w-full h-full border-0 bg-white"
              title="Company Website View"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              onLoad={() => addLog('success', 'Loaded', `Successfully loaded ${selectedCompany.website_url}`)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a company and click "Load Website" to start monitoring</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
