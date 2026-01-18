"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader, CheckCircle, XCircle, AlertCircle } from "lucide-react";

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
  const [currentStep, setCurrentStep] = useState<string>('Connecting...');
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [formPreview, setFormPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'connecting' | 'processing' | 'success' | 'failed' | 'cancelled'>('connecting');
  const [hasCompleted, setHasCompleted] = useState(false); // Track if monitoring completed for this company

  // Fetch campaign and companies
  useEffect(() => {
    fetchCampaign();
    
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [campaignId]);

  // Auto-start monitoring when company is selected (but NOT after completion)
  useEffect(() => {
    if (selectedCompany && !isMonitoring && !wsConnection && !hasCompleted) {
      console.log('[Monitor] Auto-starting monitoring for:', selectedCompany.company_name);
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        startMonitoring();
      }, 500);
      return () => clearTimeout(timer);
    } else if (selectedCompany) {
      console.log('[Monitor] Company selected but not starting:', {
        isMonitoring,
        hasWsConnection: !!wsConnection,
        hasCompleted
      });
    }
  }, [selectedCompany, isMonitoring, wsConnection, hasCompleted]);

  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}`);
      const data = await response.json();
      
      if (data.campaign) {
        setCampaign(data.campaign);
        
        const companiesResponse = await fetch(`/api/campaigns/${campaignId}/companies`);
        const companiesData = await companiesResponse.json();
        setCompanies(companiesData.companies || []);
        
        if (companiesData.companies && companiesData.companies.length > 0) {
          if (companyIdParam) {
            const targetCompany = companiesData.companies.find((c: Company) => c.id === parseInt(companyIdParam));
            setSelectedCompany(targetCompany || companiesData.companies[0]);
          } else {
            setSelectedCompany(companiesData.companies[0]);
          }
          setHasCompleted(false); // Reset completion flag for new company
        }
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
      setStatus('failed');
      setCurrentStep('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const stopMonitoring = () => {
    if (wsConnection) {
      wsConnection.close(1000, 'User cancelled');
      setWsConnection(null);
    }
    setIsMonitoring(false);
    setStatus('cancelled');
    setCurrentStep('Monitoring cancelled by user');
  };

  const startMonitoring = () => {
    if (!selectedCompany) {
      console.error('[Monitor] Cannot start - no company selected');
      return;
    }
    
    console.log('[Monitor] Starting monitoring for company:', selectedCompany.id);
    setIsMonitoring(true);
    setStatus('connecting');
    setCurrentStep('Connecting to processor...');
    setProgress(5);
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'wss:';
    const backendUrl = 'web-production-737b.up.railway.app';
    const wsUrl = `${wsProtocol}//${backendUrl}/ws/campaign/${campaignId}/monitor/${selectedCompany.id}`;
    
    console.log('[Monitor] Connecting to WebSocket:', wsUrl);
    const ws = new WebSocket(wsUrl);
    setWsConnection(ws);
    
    ws.onopen = () => {
      console.log('[Monitor] WebSocket connected');
      setStatus('processing');
      setCurrentStep('Connected - Starting browser...');
      setProgress(10);
      setCurrentUrl(selectedCompany.website_url);
      if (iframeRef.current) {
        iframeRef.current.src = selectedCompany.website_url;
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('[Monitor] WebSocket message:', message.type, message.data);
        
        if (message.type === 'log') {
          const log = message.data;
          setCurrentStep(log.message || log.action);
          
          // Update progress based on action
          if (log.action === 'Starting') setProgress(15);
          if (log.action === 'Navigating') setProgress(25);
          if (log.action === 'Loaded') setProgress(40);
          if (log.action === 'Contact Page') setProgress(55);
          if (log.action === 'Form Detection') setProgress(65);
          if (log.action === 'Form Filled') setProgress(75);
          if (log.action === 'Capturing') setProgress(80);
          if (log.action === 'Preview Ready') setProgress(85);
          if (log.action === 'Submitting') setProgress(90);
          if (log.action === 'Completed') {
            setProgress(100);
            setStatus('success');
          }
          
          // Update iframe URL
          if (log.details?.url && iframeRef.current) {
            setCurrentUrl(log.details.url);
            if (iframeRef.current.src !== log.details.url) {
              iframeRef.current.src = log.details.url;
            }
          }
        } else if (message.type === 'form_preview' || message.type === 'screenshot_ready') {
          // Handle both old form_preview (base64) and new screenshot_ready (URL)
          if (message.data?.image) {
            setFormPreview(message.data.image);
            setCurrentStep('✓ Form filled - Review screenshot');
          } else if (message.data?.url) {
            setFormPreview(message.data.url);
            setCurrentStep('✓ Form filled - Review screenshot');
          }
        } else if (message.type === 'completed') {
          setStatus('success');
          setCurrentStep('✓ Campaign completed successfully!');
          setProgress(100);
          setIsMonitoring(false);
          setHasCompleted(true); // Prevent auto-restart
          // Keep connection open briefly so user can see the success state
          // Backend will close it after a few seconds anyway
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.close(1000, 'Completed');
            }
          }, 3000); // Keep success state visible for 3 seconds
        } else if (message.type === 'error') {
          setStatus('failed');
          setCurrentStep('✗ ' + (message.data?.message || 'Processing failed'));
          setIsMonitoring(false);
          // Close with normal code
          ws.close(1000, 'Error handled');
        }
      } catch (error) {
        console.error('[WebSocket] Error:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('[Monitor] WebSocket error:', error);
      setStatus('failed');
      setCurrentStep('Connection error - Please try again');
      setIsMonitoring(false);
    };
    
    ws.onclose = (event) => {
      console.log('[Monitor] WebSocket closed:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setIsMonitoring(false);
      setWsConnection(null);
      
      // Only show "Connection lost" if it was an unexpected closure
      // event.code 1000 = normal closure
      // event.code 1001 = going away
      // event.code 1006 = abnormal closure (no close frame)
      if (event.code !== 1000 && event.code !== 1001) {
        setStatus((prevStatus) => {
          // Don't override success or already-failed status
          if (prevStatus === 'success' || prevStatus === 'failed') {
            return prevStatus;
          }
          setCurrentStep('Connection lost - Please try again');
          return 'failed';
        });
      }
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Minimal Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push(`/campaigns/${campaignId}`)}
            className="flex items-center gap-2 text-white hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          {selectedCompany && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-white">Monitoring</div>
                <div className="text-white font-semibold">{selectedCompany.company_name}</div>
              </div>
              {companies.length > 1 && (
                <select
                  value={selectedCompany.id}
                  onChange={(e) => {
                    const company = companies.find(c => c.id === parseInt(e.target.value));
                    setSelectedCompany(company || null);
                    setFormPreview('');
                    setProgress(0);
                    setHasCompleted(false); // Reset completion flag for new company
                    if (wsConnection) {
                      wsConnection.close();
                      setWsConnection(null);
                    }
                  }}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:border-purple-500 focus:outline-none"
                >
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              )}
              {isMonitoring && (
                <button
                  onClick={stopMonitoring}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-3">
            {status === 'connecting' && <Loader className="w-5 h-5 animate-spin text-blue-400" />}
            {status === 'processing' && <Loader className="w-5 h-5 animate-spin text-purple-400" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-400" />}
            {status === 'failed' && <XCircle className="w-5 h-5 text-red-400" />}
            <span className={`text-sm font-medium ${
              status === 'success' ? 'text-green-400' :
              status === 'failed' ? 'text-red-400' :
              'text-white'
            }`}>
              {currentStep}
            </span>
          </div>
          
          <div className="relative w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`absolute top-0 left-0 h-full transition-all duration-500 rounded-full ${
                status === 'success' ? 'bg-green-500' :
                status === 'failed' ? 'bg-red-500' :
                'bg-gradient-to-r from-purple-500 to-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {currentUrl && (
            <div className="mt-3 text-xs text-white font-mono truncate">
              {currentUrl}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {/* Website Iframe - Full Width */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-6" style={{ height: '700px' }}>
          {selectedCompany && isMonitoring ? (
            <iframe
              ref={iframeRef}
              src={selectedCompany.website_url}
              className="w-full h-full border-0"
              title="Live Website"
              sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <Loader className="w-12 h-12 animate-spin text-purple-500" />
            </div>
          )}
        </div>

        {/* Form Preview - Only shows when captured */}
        {formPreview && (
          <div className="bg-gradient-to-br from-green-900/10 to-blue-900/10 border-2 border-green-500/30 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-b border-green-500/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <div className="text-white font-semibold text-lg">Form Preview</div>
                  <div className="text-green-300 text-sm">Verify all fields are filled correctly before submission</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <img 
                src={formPreview} 
                alt="Filled form"
                className="w-full rounded-lg border border-gray-700 shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
