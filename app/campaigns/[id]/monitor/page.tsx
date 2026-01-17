"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Play, Pause, StopCircle, Eye, Activity, Globe, Cookie, FileText, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react";

/**
 * Live Campaign Monitoring View
 * Watch scraping automation happen in real-time (like image converter testing)
 */

interface ScrapingSession {
  id: number;
  status: string;
  current_step: string;
  progress_percentage: number;
  detected_language?: string;
  contact_page_url?: string;
  contact_page_found: boolean;
  cookie_modal_handled: boolean;
  captcha_detected: boolean;
  form_found: boolean;
  current_url: string;
  current_screenshot_url?: string;
}

export default function CampaignMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [session, setSession] = useState<ScrapingSession | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);

  // Poll for session updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaignId}/monitor`);
        const data = await response.json();
        
        if (data.session) {
          setSession(data.session);
          if (data.logs) {
            setLogs(prev => [...prev, ...data.logs]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      }
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isMonitoring, campaignId]);

  const startMonitoring = async (companyId: number) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/monitor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (response.ok) {
        setIsMonitoring(true);
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const stopMonitoring = async () => {
    setIsMonitoring(false);
    setSession(null);
  };

  return (
    <div className="min-h-screen bg-gray-950 pt-24 pb-12 px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Live Campaign Monitoring</h1>
          <p className="text-gray-400">Watch automation happen in real-time</p>
        </div>

        {/* Main Layout: Sidebar + Iframe + Logs */}
        <div className="flex gap-6 min-h-[800px]">
          {/* Left Sidebar - Session Info */}
          <div className="w-80 space-y-4">
            {/* Progress Card */}
            {session && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Current Progress</h3>
                  <div className={`w-2 h-2 rounded-full ${
                    session.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                  }`} />
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-medium">{session.progress_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${session.progress_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Current Step */}
                <div className="text-sm">
                  <span className="text-gray-400">Current Step:</span>
                  <p className="text-white mt-1">{session.current_step || 'Initializing...'}</p>
                </div>
              </div>
            )}

            {/* Detection Status */}
            {session && (
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-3">Detection Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">Language</span>
                    </div>
                    <span className="text-white font-medium">{session.detected_language?.toUpperCase() || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Cookie className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">Cookie Modal</span>
                    </div>
                    {session.cookie_modal_handled ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">Contact Page</span>
                    </div>
                    {session.contact_page_found ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <Loader className="h-4 w-4 text-yellow-400 animate-spin" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">Form Found</span>
                    </div>
                    {session.form_found ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : session.contact_page_found ? (
                      <Loader className="h-4 w-4 text-yellow-400 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">CAPTCHA</span>
                    </div>
                    {session.captcha_detected ? (
                      <AlertCircle className="h-4 w-4 text-red-400" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Controls</h3>
              <div className="space-y-2">
                {!isMonitoring ? (
                  <button
                    onClick={() => startMonitoring(1)} // TODO: Get company ID
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <Play className="h-4 w-4" />
                    Start Monitoring
                  </button>
                ) : (
                  <button
                    onClick={stopMonitoring}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <StopCircle className="h-4 w-4" />
                    Stop Monitoring
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
                <span className="text-white font-semibold">Live View</span>
              </div>
              {session && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Connected</span>
                </div>
              )}
            </div>
            
            {isMonitoring && session ? (
              <iframe
                ref={iframeRef}
                src={session.current_url}
                className="flex-1 w-full border-0 bg-white"
                title="Live Scraping View"
                sandbox="allow-same-origin allow-scripts allow-forms"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Eye className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>Click "Start Monitoring" to watch automation in real-time</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Logs */}
          <div className="w-80 bg-gray-800/50 border border-gray-700 rounded-lg flex flex-col">
            <div className="px-4 py-3 border-b border-gray-700">
              <h3 className="text-white font-semibold">Activity Log</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-xs border ${
                    log.status === 'success'
                      ? 'bg-green-900/20 border-green-500/30 text-green-300'
                      : log.status === 'failed'
                      ? 'bg-red-900/20 border-red-500/30 text-red-300'
                      : log.status === 'warning'
                      ? 'bg-yellow-900/20 border-yellow-500/30 text-yellow-300'
                      : 'bg-gray-700/30 border-gray-600/30 text-gray-300'
                  }`}
                >
                  <div className="font-semibold mb-1">{log.action}</div>
                  <div className="opacity-75">{log.message}</div>
                  <div className="text-xs opacity-50 mt-1">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
