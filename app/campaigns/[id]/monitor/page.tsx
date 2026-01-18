"use client";

import { useState, useEffect } from "react";
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

  const [campaign, setCampaign] = useState<any>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentScreenshot, setCurrentScreenshot] = useState<string>('');

  // Fetch campaign and companies
  useEffect(() => {
    fetchCampaign();
    
    // Cleanup WebSocket on unmount
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
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
      addLog('info', 'Started monitoring', `Connecting to campaign processor...`);
      
      // Connect to backend WebSocket for live processing
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'wss:'; // Always use wss for Railway
      const backendUrl = 'web-production-737b.up.railway.app';
      const wsUrl = `${wsProtocol}//${backendUrl}/ws/campaign/${campaignId}/monitor/${selectedCompany.id}`;
      
      console.log('[WebSocket] Attempting to connect:', wsUrl);
      const ws = new WebSocket(wsUrl);
      setWsConnection(ws);
      
      ws.onopen = () => {
        console.log('[WebSocket] Connection opened successfully');
        addLog('success', 'Connected', 'Connected to campaign processor');
        setCurrentUrl(selectedCompany.website_url);
        setCurrentScreenshot(''); // Clear old screenshot
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('[WebSocket] Message received:', message);
          
          if (message.type === 'log') {
            const log = message.data;
            addLog(log.status || 'info', log.action || 'Update', log.message || '');
            
            // Track URL from log details
            if (log.details?.url) {
              console.log('[Monitor] URL update:', log.details.url);
              setCurrentUrl(log.details.url);
            }
          } else if (message.type === 'navigation') {
            // Direct navigation event with URL
            if (message.data?.url) {
              console.log('[Monitor] Navigation event:', message.data.url);
              setCurrentUrl(message.data.url);
              addLog('info', 'Navigating', `Loading: ${message.data.url}`);
            }
          } else if (message.type === 'screenshot') {
            // Display screenshot - now using tiny images that won't crash
            if (message.data?.image) {
              console.log('[WebSocket] Screenshot received');
              setCurrentScreenshot(message.data.image);
            }
          } else if (message.type === 'completed') {
            addLog('success', 'Completed', 'Campaign processing completed!');
            setIsMonitoring(false);
            setWsConnection(null);
            setCurrentUrl('');
            // Keep screenshot visible to see final result
            ws.close();
          } else if (message.type === 'error') {
            addLog('failed', 'Error', message.data?.message || 'An error occurred');
            setIsMonitoring(false);
            setWsConnection(null);
            setCurrentUrl('');
            setCurrentScreenshot('');
            ws.close();
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
        addLog('failed', 'Connection Error', `Failed to connect to campaign processor`);
        setIsMonitoring(false);
        setWsConnection(null);
        setCurrentUrl('');
        setCurrentScreenshot('');
      };
      
      ws.onclose = (event) => {
        console.log('[WebSocket] Connection closed:', event.code, event.reason);
        if (event.code !== 1000) {
          addLog('warning', 'Disconnected', `Connection closed (Code: ${event.code})`);
        }
        setIsMonitoring(false);
        setWsConnection(null);
        setCurrentUrl('');
        // Keep screenshot if normal close, clear if error
        if (event.code !== 1000) {
          setCurrentScreenshot('');
        }
      };
    }
  };

  const stopMonitoring = () => {
    if (wsConnection) {
      wsConnection.close();
      setWsConnection(null);
    }
    setIsMonitoring(false);
    setCurrentUrl('');
    setCurrentScreenshot('');
    addLog('warning', 'Stopped', 'Monitoring stopped by user');
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
                    stopMonitoring();
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

        {/* Split View: Website + Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Website View */}
          <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden flex flex-col">
            {/* URL Bar */}
            {currentUrl && isMonitoring && (
              <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400 font-mono truncate">{currentUrl}</span>
              </div>
            )}
            
            {selectedCompany ? (
              <>
                {isMonitoring && currentScreenshot ? (
                  <div className="w-full flex-1 flex items-center justify-center bg-gray-900">
                    <img 
                      src={currentScreenshot} 
                      alt="Live browser view"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                ) : isMonitoring && !currentScreenshot ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Loader className="h-16 w-16 mx-auto mb-4 animate-spin text-purple-500" />
                      <p className="text-lg">Waiting for browser view...</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Click "Load Website" to start processing</p>
                      <p className="text-sm mt-2 text-gray-400">{selectedCompany.company_name}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a company and click "Load Website" to start monitoring</p>
                </div>
              </div>
            )}
          </div>

          {/* Live Logs Panel */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-3">Live Activity Log</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet...</p>
            ) : (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm ${
                      log.status === 'success' ? 'bg-green-900/30 border-l-2 border-green-500' :
                      log.status === 'failed' ? 'bg-red-900/30 border-l-2 border-red-500' :
                      log.status === 'warning' ? 'bg-yellow-900/30 border-l-2 border-yellow-500' :
                      'bg-blue-900/30 border-l-2 border-blue-500'
                    }`}
                  >
                    <div className="font-semibold text-white">{log.action}</div>
                    <div className="text-gray-300 text-xs mt-1">{log.message}</div>
                    <div className="text-gray-500 text-xs mt-1">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
