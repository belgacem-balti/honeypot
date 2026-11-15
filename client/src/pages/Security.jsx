import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Globe,
  Brain,
  Activity,
  Search,
  RefreshCw,
  Terminal,
  Radio
} from 'lucide-react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { security } from '../services/api';
import toast from 'react-hot-toast';

export default function Security() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Inspector State
  const [testIp, setTestIp] = useState('118.25.6.39');
  const [testLog, setTestLog] = useState('POST /wp-login.php HTTP/1.1 401 Unauthorized - 15 failed password attempts in 30 seconds');
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);

  const loadData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        security.stats(),
        security.alerts({ limit: 15 })
      ]);
      setStats(statsRes.data?.data || statsRes.data);
      setAlerts(alertsRes.data?.data || alertsRes.data || []);
    } catch (_err) {
      toast.error('Unable to fetch security intelligence data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleInspect = async (e) => {
    if (e) e.preventDefault();
    if (!testIp.trim()) {
      toast.error('Please enter an IP address to inspect');
      return;
    }

    setInspecting(true);
    setInspectionResult(null);

    try {
      const res = await security.analyze({
        ip: testIp.trim(),
        log: testLog.trim(),
        source: 'honeypot-inspector'
      });
      const data = res.data?.data || res.data;
      setInspectionResult(data);
      toast.success('AI & Threat analysis completed');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Threat analysis failed');
    } finally {
      setInspecting(false);
    }
  };

  const applyPreset = (ip, log) => {
    setTestIp(ip);
    setTestLog(log);
    setInspectionResult(null);
  };

  const getThreatBadgeVariant = (level) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'success';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">AI Threat Intelligence & SOC</h1>
            <Badge variant="info" className="flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse text-blue-600" /> Live
            </Badge>
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Automated log inspection combining Groq LLM inference, AbuseIPDB reputation, and AlienVault OTX pulses.
          </p>
        </div>
        <Button variant="secondary" onClick={loadData} disabled={loading} className="self-start sm:self-auto flex items-center gap-2">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 bg-white border border-gray-200">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Events Analyzed</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.totalAnalyzed || alerts.length || 0}</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-white border border-gray-200">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">High / Critical</div>
            <div className="text-2xl font-bold text-red-600">
              {(stats?.threatCounts?.critical || 0) + (stats?.threatCounts?.high || 0)}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-white border border-gray-200">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">AI Reasoning Engine</div>
            <div className="text-sm font-semibold text-gray-900">Groq (GPT-OSS / Llama)</div>
            <div className="text-[11px] text-green-600 font-medium">✓ Active API Key</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-white border border-gray-200">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Threat Feeds</div>
            <div className="text-sm font-semibold text-gray-900">AbuseIPDB & OTX</div>
            <div className="text-[11px] text-emerald-600 font-medium">Dual-Feed Verification</div>
          </div>
        </Card>
      </div>

      {/* Interactive Log Inspector / Simulator */}
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Interactive Threat & Log Inspector</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset('118.25.6.39', 'POST /wp-login.php HTTP/1.1 401 Unauthorized - 15 failed logins in 30s')}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-md transition-colors"
            >
              WP Brute-force
            </button>
            <button
              type="button"
              onClick={() => applyPreset('185.220.101.5', 'GET /index.php?id=1%20UNION%20SELECT%20null,username,password%20FROM%20users-- HTTP/1.1 200')}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-md transition-colors"
            >
              SQL Injection
            </button>
            <button
              type="button"
              onClick={() => applyPreset('8.8.8.8', 'GET /api/health HTTP/1.1 200 OK')}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-md transition-colors"
            >
              Clean Traffic
            </button>
          </div>
        </div>

        <form onSubmit={handleInspect} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Source IP Address</label>
              <input
                type="text"
                value={testIp}
                onChange={(e) => setTestIp(e.target.value)}
                placeholder="e.g. 118.25.6.39"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Raw Log Entry / Honeypot Event</label>
              <input
                type="text"
                value={testLog}
                onChange={(e) => setTestLog(e.target.value)}
                placeholder="e.g. POST /wp-login.php HTTP/1.1 401 Unauthorized"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={inspecting} className="flex items-center gap-2">
              {inspecting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Analyzing via AI & Threat Intel...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Run Live AI Threat Analysis
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Inspection Result Preview */}
        {inspectionResult && (
          <div className="mt-6 border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-600" /> AI SOC Verdict
              </h3>
              <Badge variant={getThreatBadgeVariant(inspectionResult.aiAnalysis?.threat_level)}>
                {inspectionResult.aiAnalysis?.threat_level || 'UNKNOWN'} THREAT
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Attack Category</span>
                <span className="text-sm font-semibold text-gray-900">{inspectionResult.aiAnalysis?.attack_type || 'Unclassified'}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">AbuseIPDB Score</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${inspectionResult.threatIntel?.abuseipdb?.score > 50 ? 'bg-red-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(inspectionResult.threatIntel?.abuseipdb?.score || 0, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-semibold">{inspectionResult.threatIntel?.abuseipdb?.score || 0}%</span>
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">AlienVault OTX Pulses</span>
                <span className="text-sm font-semibold text-gray-900">
                  {inspectionResult.threatIntel?.alienvault_otx?.pulseCount || 0} active pulses
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm bg-slate-900 text-slate-100 p-4 rounded-xl font-mono">
              <div><span className="text-purple-400 font-semibold">AI Summary:</span> {inspectionResult.aiAnalysis?.summary}</div>
              <div><span className="text-cyan-400 font-semibold">Technical Evidence:</span> {inspectionResult.aiAnalysis?.technical_details}</div>
              <div><span className="text-amber-400 font-semibold">Recommended Mitigation:</span> <span className="text-emerald-400 font-bold">{inspectionResult.aiAnalysis?.recommended_action}</span></div>
            </div>
          </div>
        )}
      </Card>

      {/* Recent Alerts Feed Table */}
      <Card className="bg-white border border-gray-200">
        <div className="flex items-center justify-between pb-4 border-b mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Security Alerts & Analyzed Logs</h2>
          <span className="text-xs text-gray-500">Live stream of Wazuh & Honeypot events</span>
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">
            No incidents recorded yet. Use the Inspector above or trigger a honeypot request to generate live alerts.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Source IP</th>
                  <th className="py-3 px-4">Attack Type</th>
                  <th className="py-3 px-4">Threat Level</th>
                  <th className="py-3 px-4">AI Recommendation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-gray-900">
                      {alert.ip}
                      {alert.threatIntel?.abuseipdb?.country && (
                        <span className="text-xs text-gray-400 ml-1">({alert.threatIntel.abuseipdb.country})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-800 font-medium">
                      {alert.aiAnalysis?.attack_type || 'Suspicious Activity'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={getThreatBadgeVariant(alert.aiAnalysis?.threat_level)}>
                        {alert.aiAnalysis?.threat_level || 'LOW'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-600 max-w-xs truncate">
                      {alert.aiAnalysis?.recommended_action || alert.aiAnalysis?.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
