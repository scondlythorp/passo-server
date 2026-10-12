import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  ArrowRight,
  TrendingDown,
  Navigation,
  RefreshCw,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  MapPin,
  Clock,
  Shield,
  Volume2,
  Printer,
  Phone,
  FileText,
  Lock,
  Unlock,
  Download,
  Share2,
  Radio,
  WifiOff
} from 'lucide-react';

import heroTransitImg from './assets/images/hero_gambia_transit_1791772482764.jpg';
import gelegeleVanImg from './assets/images/transit_gelegele_van_1791772494137.jpg';
import routeMapImg from './assets/images/transit_route_map_1791772505004.jpg';

// ── Multi-Lingual Localizations ──
const TRANSLATIONS = {
  en: {
    title: 'PASSO Transport Fare Directory',
    subtitle: 'The Gambia National Passenger Tariffs & Route Network',
    currency: 'Dalasi (GMD / D)',
    dirTab: 'Fares Directory',
    calcTab: 'Route Calculator',
    terminalsTab: 'Car Park Terminals',
    reportsTab: 'Overcharge Reports',
    ussdTab: 'USSD (*144#)',
    revisionsTab: 'Gazette Circulars',
    addFare: '+ Add Route Fare',
    calcTitle: 'Official Route Fare Calculator',
    calcDesc: 'Calculate direct and multi-stage transfer tariffs between Gambian divisions.',
    printSheet: 'Print Official Tariff Sheet',
    speak: 'Listen to Fare',
    adminBadge: 'Ministry Admin',
    commuterBadge: 'Public Commuter',
    loginAdmin: 'Admin Login',
    logoutAdmin: 'Logout',
    reportOvercharge: 'Report Overcharge',
    offlineNotice: 'Offline Mode: Using cached Gambian transport tariff database.',
  },
  wo: {
    title: 'PASSO Dalu Pasu Gambia',
    subtitle: 'Pas yi ci réewum Gambia ak yooni tukki yi',
    currency: 'Dalasi (GMD / D)',
    dirTab: 'Limu Pas yi',
    calcTab: 'Natt Yoon wi',
    terminalsTab: 'Gàjj yi ak Palaas yi',
    reportsTab: 'Yégle Njaay mu Yooy',
    ussdTab: 'USSD (*144#)',
    revisionsTab: 'Kaye Liggéey wi',
    addFare: '+ Yokk Pas bu Bees',
    calcTitle: 'Natt Pasu Yoon bi ci Gambia',
    calcDesc: 'Xamleen pas bu jub ak bu am sàmp ci biir réew mi.',
    printSheet: 'Móol Kayitu Pas yi',
    speak: 'Déglul Pas bi',
    adminBadge: 'Njiitu Njiit yi',
    commuterBadge: 'Tukkikat',
    loginAdmin: 'Dugg Njiit',
    logoutAdmin: 'Génn',
    reportOvercharge: 'Yégle Njaay mu Yooy',
    offlineNotice: 'Amul internet: Dafa jëfandikoo pas yi tegu ci telefòn bi.',
  },
  man: {
    title: 'PASSO Gambiya Taamandi Kodo',
    subtitle: 'Gambiya taamandi kodo doroo ning taa-dulaalu',
    currency: 'Dalasi (GMD / D)',
    dirTab: 'Kodo Kang-wo-Kang',
    calcTab: 'Kodo Danni',
    terminalsTab: 'Gaaraasu Luwaa',
    reportsTab: 'Kodo Baa Jamfa',
    ussdTab: 'USSD (*144#)',
    revisionsTab: 'Marifatabaa Kitaaboo',
    addFare: '+ Kodo Kootoo Ke',
    calcTitle: 'Kodo Danni Ka Taamandi Je',
    calcDesc: 'A fota kodo le la faanoo ning daa-ke-daa la.',
    printSheet: 'Kitaaboo Fannandoo',
    speak: 'Kodo Moyi',
    adminBadge: 'Kuntigi',
    commuterBadge: 'Taamandilaa',
    loginAdmin: 'Kuntigi Dondoo',
    logoutAdmin: 'Buntu',
    reportOvercharge: 'Kodo Baa Jamfa',
    offlineNotice: 'Intaneetoo te jee: Kodo fannanto le be keta la.',
  },
};

export default function App() {
  // Navigation & Language
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'calculator' | 'terminals' | 'reports' | 'ussd' | 'revisions'
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Data states
  const [fares, setFares] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [activeNotice, setActiveNotice] = useState(null);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Auth / RBAC State
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('passo_admin_token') || '');
  const [isAdmin, setIsAdmin] = useState(() => !!localStorage.getItem('passo_admin_token'));
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState('');

  // Route Calculator State (Bidirectional & Multi-stage)
  const [calcFrom, setCalcFrom] = useState('Banjul');
  const [calcTo, setCalcTo] = useState('Serekunda');
  const [calcVehicle, setCalcVehicle] = useState('All');
  const [calcResult, setCalcResult] = useState({ direct: [], multiStage: [] });
  const [isCalculating, setIsCalculating] = useState(false);

  // Directory Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id-asc');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingFare, setEditingFare] = useState(null);
  const [formData, setFormData] = useState({ from: '', to: '', vehicleType: 'Taxi', price: '' });
  const [formErrors, setFormErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Overcharge Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFormData, setReportFormData] = useState({
    route: '',
    vehicleType: 'Taxi',
    officialPrice: '',
    priceCharged: '',
    plateNumber: '',
    notes: '',
  });
  const [reportSubmitting, setReportSubmitting] = useState(false);

  // USSD Simulator State
  const [ussdInput, setUssdInput] = useState('*144#');
  const [ussdScreen, setUssdScreen] = useState('Dial *144# to start PASSO Gambia transit services.');
  const [ussdHistory, setUssdHistory] = useState([]);
  const [ussdLoading, setUssdLoading] = useState(false);

  // Toast Notice
  const [actionNotice, setActionNotice] = useState(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Fetch all data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [faresRes, localitiesRes, vehicleTypesRes, statsRes, terminalsRes, revisionsRes, reportsRes] =
        await Promise.all([
          fetch('/api/fares'),
          fetch('/api/localities'),
          fetch('/api/vehicle-types'),
          fetch('/api/stats'),
          fetch('/api/terminals'),
          fetch('/api/revisions'),
          fetch('/api/reports'),
        ]);

      const faresData = await faresRes.json();
      const localitiesData = await localitiesRes.json();
      const vehicleTypesData = await vehicleTypesRes.json();
      const statsData = await statsRes.json();
      const terminalsData = await terminalsRes.json();
      const revisionsData = await revisionsRes.json();
      const reportsData = await reportsRes.json();

      setFares(faresData.fares || []);
      setLocalities(localitiesData.localities || []);
      setVehicleTypes(vehicleTypesData.vehicleTypes || ['Taxi', 'Bus', 'Gelegele', '7-Seater']);
      setStats(statsData);
      setTerminals(terminalsData.terminals || []);
      setRevisions(revisionsData.revisions || []);
      setActiveNotice(revisionsData.activeNotice || null);
      setReports(reportsData.reports || []);

      // Cache locally for offline resiliency
      try {
        localStorage.setItem('passo_cached_fares', JSON.stringify(faresData.fares || []));
        localStorage.setItem('passo_cached_terminals', JSON.stringify(terminalsData.terminals || []));
      } catch (_) {}
    } catch (err) {
      console.warn('Network fetch error, attempting offline cache:', err);
      // Offline fallback
      try {
        const cachedFares = JSON.parse(localStorage.getItem('passo_cached_fares') || '[]');
        const cachedTerminals = JSON.parse(localStorage.getItem('passo_cached_terminals') || '[]');
        if (cachedFares.length > 0) {
          setFares(cachedFares);
          setTerminals(cachedTerminals);
          setActionNotice({ type: 'warning', text: 'Offline mode active: Displaying saved local tariff cache.' });
        } else {
          setError('Failed to reach server. Please check internet connection.');
        }
      } catch (_) {
        setError(err.message || 'Error loading fares data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run Route Calculator Query
  const runRouteCalculation = async (from, to, vehicle) => {
    if (!from || !to) return;
    setIsCalculating(true);
    try {
      const res = await fetch(`/api/fares/calculate?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&vehicleType=${encodeURIComponent(vehicle)}`);
      if (res.ok) {
        const data = await res.json();
        setCalcResult(data);
      }
    } catch (err) {
      console.error('Calculation error:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  useEffect(() => {
    if (calcFrom && calcTo) {
      runRouteCalculation(calcFrom, calcTo, calcVehicle);
    }
  }, [calcFrom, calcTo, calcVehicle, fares]);

  // Filtered Fares for Directory
  const processedFares = useMemo(() => {
    let result = [...fares];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.from.toLowerCase().includes(q) ||
          f.to.toLowerCase().includes(q) ||
          f.vehicleType.toLowerCase().includes(q) ||
          String(f.price).includes(q) ||
          String(f.id).includes(q)
      );
    }

    if (selectedVehicleFilter !== 'All') {
      result = result.filter((f) => f.vehicleType === selectedVehicleFilter);
    }

    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'from-asc') return a.from.localeCompare(b.from);
      return a.id - b.id;
    });

    return result;
  }, [fares, searchQuery, selectedVehicleFilter, sortBy]);

  // Admin Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkeyInput }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      setAdminToken(data.token);
      setIsAdmin(true);
      localStorage.setItem('passo_admin_token', data.token);
      setIsAdminModalOpen(false);
      setPasskeyInput('');
      setActionNotice({ type: 'success', text: `Authorized as ${data.user.name} (${data.user.department})` });
    } catch (err) {
      setAuthError(err.message || 'Invalid passkey.');
    }
  };

  const handleAdminLogout = () => {
    setAdminToken('');
    setIsAdmin(false);
    localStorage.removeItem('passo_admin_token');
    setActionNotice({ type: 'success', text: 'Logged out. Returned to Commuter read-only mode.' });
  };

  // Create / Edit Fare Submit
  const handleFareFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    setIsSubmitting(true);

    const priceNum = Number(formData.price);
    const errors = [];
    if (!formData.from.trim()) errors.push('Departure locality is required.');
    if (!formData.to.trim()) errors.push('Destination locality is required.');
    if (formData.from.trim().toLowerCase() === formData.to.trim().toLowerCase()) {
      errors.push('Departure and destination cannot be identical.');
    }
    if (isNaN(priceNum) || priceNum <= 0) errors.push('Price must be a positive number.');

    if (errors.length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const url = modalMode === 'create' ? '/api/fares' : `/api/fares/${editingFare.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken || 'passo-admin-2026'}`,
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          from: formData.from.trim(),
          to: formData.to.trim(),
          vehicleType: formData.vehicleType,
          price: priceNum,
          revisionRef: activeNotice ? activeNotice.revisionRef : 'MOTWI-2026-A',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || 'Operation failed');

      setIsModalOpen(false);
      setActionNotice({
        type: 'success',
        text: modalMode === 'create' ? `Fare #${data.id} published to registry.` : `Fare #${editingFare.id} tariff updated.`,
      });
      await loadData();
    } catch (err) {
      setFormErrors([err.message || 'Server rejected modification.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Fare
  const handleDeleteFare = async (id) => {
    if (!isAdmin) {
      setActionNotice({ type: 'error', text: 'Only authorized Ministry officials can delete tariffs.' });
      setIsAdminModalOpen(true);
      return;
    }
    if (!window.confirm(`Are you sure you want to delete tariff #${id}?`)) return;

    try {
      const res = await fetch(`/api/fares/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken || 'passo-admin-2026'}` },
      });
      if (!res.ok) throw new Error('Deletion rejected');
      setActionNotice({ type: 'success', text: `Tariff #${id} removed.` });
      await loadData();
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message });
    }
  };

  // Overcharge Report Submit
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportFormData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Report submission failed');

      setIsReportModalOpen(false);
      setReportFormData({
        route: '',
        vehicleType: 'Taxi',
        officialPrice: '',
        priceCharged: '',
        plateNumber: '',
        notes: '',
      });
      setActionNotice({ type: 'success', text: 'Overcharge incident submitted to Transport Union compliance desk.' });
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  // Resolve Overcharge Report
  const handleResolveReport = async (reportId) => {
    if (!isAdmin) {
      setIsAdminModalOpen(true);
      return;
    }
    const note = prompt('Enter resolution details (e.g. Driver cautioned at terminal, refund processed):');
    if (!note) return;

    try {
      const res = await fetch(`/api/reports/${reportId}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken || 'passo-admin-2026'}`,
        },
        body: JSON.stringify({ resolutionNote: note }),
      });
      if (!res.ok) throw new Error('Update failed');
      setActionNotice({ type: 'success', text: `Incident #${reportId} marked resolved.` });
      await loadData();
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message });
    }
  };

  // USSD Dial Action
  const handleUssdDial = async (textToDial = null) => {
    const cmd = textToDial !== null ? textToDial : ussdInput;
    setUssdLoading(true);
    try {
      const res = await fetch('/api/ussd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cmd }),
      });
      const text = await res.text();
      setUssdScreen(text);
      setUssdHistory((prev) => [...prev, { dialed: cmd, response: text }]);
    } catch (err) {
      setUssdScreen('Connection error with Gambian telecom gateway.');
    } finally {
      setUssdLoading(false);
    }
  };

  // Voice / Audio Accessibility (Speak Fare)
  const speakFare = (fare) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis not supported on this browser.');
      return;
    }

    let speechText = `The official fare from ${fare.from} to ${fare.to} by ${fare.vehicleType} is ${fare.price} Dalasis.`;
    if (lang === 'wo') {
      speechText = `${fare.from} ba ${fare.to} ci ${fare.vehicleType}: pas bi ${fare.price} dalasi la.`;
    } else if (lang === 'man') {
      speechText = `${fare.from} fo ${fare.to} ${fare.vehicleType} kono: kodo mu ${fare.price} dalasi le ti.`;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
    setActionNotice({ type: 'success', text: `Playing audio announcement: "${speechText}"` });
  };

  // Printable Official Tariff Trigger
  const handlePrintTariff = () => {
    window.print();
  };

  // PWA Install Click
  const handlePwaInstall = async () => {
    if (!deferredPrompt) {
      alert('App is already installed or your browser supports installing from the address bar.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-amber-200 selection:text-stone-900 font-sans">
      {/* ── TOP BAR CONTRACT (Strict 3-zone contract) ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200 px-4 sm:px-6 py-3.5 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Wordmark Brand */}
          <div className="flex items-center gap-3">
            <a
              href="/"
              onClick={(e) => { e.preventDefault(); setActiveTab('directory'); }}
              className="text-xl font-extrabold tracking-tight text-stone-900 hover:text-amber-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
            >
              <span>PASSO</span>
              <span className="text-[10px] bg-stone-900 text-stone-100 px-1.5 py-0.5 rounded font-mono font-medium">
                GM
              </span>
            </a>
          </div>

          {/* Zone 2: Navigation Links (Single-line) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-stone-600">
            <button
              onClick={() => setActiveTab('directory')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'directory' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : ''
              }`}
            >
              {t.dirTab}
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'calculator' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : ''
              }`}
            >
              {t.calcTab}
            </button>
            <button
              onClick={() => setActiveTab('terminals')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'terminals' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : ''
              }`}
            >
              {t.terminalsTab}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'reports' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : ''
              }`}
            >
              {t.reportsTab}
            </button>
            <button
              onClick={() => setActiveTab('ussd')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'ussd' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : ''
              }`}
            >
              {t.ussdTab}
            </button>
            <button
              onClick={() => setActiveTab('revisions')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-1 ${
                activeTab === 'revisions' ? 'text-stone-900 border-b-2 border-stone-900 font-bold' : ''
              }`}
            >
              {t.revisionsTab}
            </button>
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Language Switcher */}
            <div className="flex items-center bg-stone-100 rounded-lg p-0.5 text-[11px] font-semibold text-stone-600">
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded transition-colors ${lang === 'en' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLang('wo')}
                className={`px-2 py-1 rounded transition-colors ${lang === 'wo' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'}`}
              >
                Wolof
              </button>
              <button
                onClick={() => setLang('man')}
                className={`px-2 py-1 rounded transition-colors ${lang === 'man' ? 'bg-white text-stone-900 shadow-xs' : 'hover:text-stone-900'}`}
              >
                Mandinka
              </button>
            </div>

            {/* Print Tariff Button */}
            <button
              onClick={handlePrintTariff}
              title={t.printSheet}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            {/* In-App PWA Install */}
            {isInstallable && (
              <button
                onClick={handlePwaInstall}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install PWA</span>
              </button>
            )}

            {/* Role Authentication Badge & Switcher */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold bg-amber-500 text-stone-950 px-2 py-1 rounded-md flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span className="hidden md:inline">MOTWI Admin</span>
                </span>
                <button
                  onClick={handleAdminLogout}
                  title="Logout"
                  className="p-1.5 text-stone-400 hover:text-stone-900 rounded-md hover:bg-stone-100"
                >
                  <Unlock className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Lock className="w-3 h-3 text-stone-400" />
                <span className="hidden sm:inline">Officer Login</span>
              </button>
            )}

            {/* Primary Action Button */}
            <button
              onClick={() => {
                if (!isAdmin) {
                  setIsAdminModalOpen(true);
                  return;
                }
                setModalMode('create');
                setEditingFare(null);
                setFormData({
                  from: localities[0] || 'Banjul',
                  to: localities[1] || 'Serekunda',
                  vehicleType: 'Taxi',
                  price: '',
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-all whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addFare}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Offline Status Alert */}
      {!isOnline && (
        <div className="bg-amber-500 text-stone-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 print:hidden">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t.offlineNotice}</span>
        </div>
      )}

      {/* Action Toast Notice */}
      {actionNotice && (
        <div
          className={`px-4 py-2 text-xs font-semibold border-b flex items-center justify-between print:hidden ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : actionNotice.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-amber-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{actionNotice.text}</span>
            </div>
            <button onClick={() => setActionNotice(null)} className="p-1 hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── PRINT-ONLY OFFICIAL HEADER (Appears only on window.print) ── */}
      <div className="hidden print:block p-8 border-b-2 border-stone-900 space-y-3">
        <div className="text-center space-y-1">
          <div className="text-xs uppercase tracking-widest font-bold text-stone-600">Republic of The Gambia</div>
          <h1 className="text-2xl font-black uppercase text-stone-900">Ministry of Transport, Works &amp; Infrastructure</h1>
          <div className="text-sm font-semibold text-stone-700">Official Commercial Passenger Transport Tariff Schedule</div>
          <div className="text-xs font-mono text-stone-500">
            Gazette Ref: {activeNotice?.gazetteNotice || 'MOTWI-2026-A'} · Effective Date: {activeNotice?.effectiveDate || '2026-01-15'}
          </div>
        </div>
        <p className="text-xs text-stone-600 text-justify pt-2">
          Notice is hereby given under Section 42 of the Road Traffic Regulations that the transport tariffs below
          are legally binding on all commercial drivers (Gelegele, Taxi, 7-Seater, and Bus) operating across Greater Banjul,
          West Coast, and Lower River Divisions. Overcharging is punishable by fine or impoundment.
        </p>
      </div>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* ── HERO BANNER & REGULATORY STATUS ── */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs print:hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  <span className="text-amber-700 font-bold">{activeNotice?.revisionRef || 'MOTWI-2026-A'}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeNotice?.gazetteNotice || 'Gazette Vol. 143 No. 02'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-bold">Legally Binding</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 text-balance leading-snug">
                  {t.subtitle}
                </h1>
                <p className="text-stone-600 text-sm leading-relaxed max-w-xl">
                  Official fares established jointly by the Ministry of Transport, Works and Infrastructure (MOTWI)
                  and The Gambia Transport Union (GTU). Supports multi-stage stage hops, terminal hubs, and passenger protection.
                </p>
              </div>

              {/* Fast Action Buttons Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-stone-100">
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span>{t.reportOvercharge}</span>
                </button>
                <button
                  onClick={() => setActiveTab('terminals')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-stone-500" />
                  <span>View 6 Terminal Hubs</span>
                </button>
                <button
                  onClick={() => setActiveTab('ussd')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-stone-500" />
                  <span>Feature Phone (*144#)</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative min-h-[220px] lg:min-h-full bg-stone-100 border-t lg:border-t-0 lg:border-l border-stone-200">
              <img
                src={heroTransitImg}
                alt="Banjul transit hub in The Gambia"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-stone-900/85 backdrop-blur-xs text-stone-100 text-[11px] px-2.5 py-1 rounded">
                Banjul Commercial Car Park &amp; Ferry Link
              </div>
            </div>
          </div>
        </section>

        {/* ── KEY AGGREGATED METRICS STRIP ── */}
        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4 print:hidden">
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-stone-500 font-medium block">Active Route Tariffs</span>
              <div className="mt-1 text-2xl font-bold text-stone-900 font-mono tabular-nums">{fares.length}</div>
              <span className="text-[11px] text-stone-400 mt-0.5 block">Stored in persistent JSON DB</span>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-stone-500 font-medium block">Average Passenger Fare</span>
              <div className="mt-1 text-2xl font-bold text-stone-900 font-mono tabular-nums">D{stats.averagePrice}</div>
              <span className="text-[11px] text-stone-400 mt-0.5 block">Across 4 vehicle categories</span>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-stone-500 font-medium block">Longest Highway Route</span>
              <div className="mt-1 text-base font-bold text-stone-900 truncate">
                {stats.mostExpensiveRoute?.from} → {stats.mostExpensiveRoute?.to}
              </div>
              <span className="text-[11px] text-stone-500 font-mono tabular-nums mt-0.5 block">
                D{stats.mostExpensiveRoute?.price} ({stats.mostExpensiveRoute?.vehicleType})
              </span>
            </div>
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
              <span className="text-xs text-stone-500 font-medium block">Most Economical Class</span>
              <div className="mt-1 text-base font-bold text-stone-900">
                {stats.cheapestVehicle?.type || 'Gelegele'}
              </div>
              <span className="text-[11px] text-stone-500 font-mono tabular-nums mt-0.5 block">
                D{stats.cheapestVehicle?.avgPrice} average single seat
              </span>
            </div>
          </section>
        )}

        {/* ── TAB 1: FARES DIRECTORY ── */}
        {activeTab === 'directory' && (
          <section className="space-y-6">
            {/* Toolbar */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by locality, vehicle, or price (e.g. Serekunda, Bus, 15)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white text-stone-900"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                {['All', 'Taxi', 'Bus', 'Gelegele', '7-Seater'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVehicleFilter(v)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                      selectedVehicleFilter === v ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
                >
                  <option value="id-asc">Sort: Tariff ID</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="from-asc">Origin: Alphabetical</option>
                </select>
              </div>
            </div>

            {/* Fares Table */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold w-14">#</th>
                      <th className="py-3 px-4 font-semibold">Origin Locality</th>
                      <th className="py-3 px-2 font-semibold w-6"></th>
                      <th className="py-3 px-4 font-semibold">Destination Locality</th>
                      <th className="py-3 px-4 font-semibold">Vehicle Class</th>
                      <th className="py-3 px-4 font-semibold text-right">Official Tariff</th>
                      <th className="py-3 px-4 font-semibold text-right print:hidden w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-stone-400 text-sm">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                          Loading official tariff schedule...
                        </td>
                      </tr>
                    ) : processedFares.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-stone-500 text-sm">
                          No tariff records match your query.
                        </td>
                      </tr>
                    ) : (
                      processedFares.map((fare) => (
                        <tr key={fare.id} className="hover:bg-stone-50/75 transition-colors group">
                          <td className="py-3 px-4 font-mono tabular-nums text-xs text-stone-400">{fare.id}</td>
                          <td className="py-3 px-4 font-semibold text-stone-900">{fare.from}</td>
                          <td className="py-3 px-2 text-stone-300">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-900">{fare.to}</td>
                          <td className="py-3 px-4">
                            <span className="text-xs px-2 py-0.5 rounded font-medium bg-stone-100 text-stone-800">
                              {fare.vehicleType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-stone-900 text-base">
                            D{fare.price}
                          </td>
                          <td className="py-3 px-4 text-right print:hidden">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Audio Speak */}
                              <button
                                onClick={() => speakFare(fare)}
                                title={t.speak}
                                className="p-1.5 text-stone-500 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                              >
                                <Volume2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Overcharge report quick jump */}
                              <button
                                onClick={() => {
                                  setReportFormData({
                                    route: `${fare.from} → ${fare.to}`,
                                    vehicleType: fare.vehicleType,
                                    officialPrice: fare.price,
                                    priceCharged: '',
                                    plateNumber: '',
                                    notes: '',
                                  });
                                  setIsReportModalOpen(true);
                                }}
                                title="Report overcharge on this route"
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <AlertCircle className="w-3.5 h-3.5" />
                              </button>

                              {/* Admin edit/delete */}
                              {isAdmin && (
                                <>
                                  <button
                                    onClick={() => {
                                      setModalMode('edit');
                                      setEditingFare(fare);
                                      setFormData({
                                        from: fare.from,
                                        to: fare.to,
                                        vehicleType: fare.vehicleType,
                                        price: String(fare.price),
                                      });
                                      setIsModalOpen(true);
                                    }}
                                    title="Edit Tariff"
                                    className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFare(fare.id)}
                                    title="Delete Tariff"
                                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 2: ROUTE & STAGE CALCULATOR ── */}
        {activeTab === 'calculator' && (
          <section className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="max-w-2xl space-y-1">
                <span className="text-xs font-bold text-amber-700 tracking-wider uppercase">
                  {t.calcTitle}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900">{t.calcDesc}</h2>
                <p className="text-xs text-stone-500">
                  Automatic bidirectional search and multi-stage corridor connection finder.
                </p>
              </div>

              {/* Input Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Departure Locality</label>
                  <select
                    value={calcFrom}
                    onChange={(e) => setCalcFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-900"
                  >
                    {localities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Destination Locality</label>
                  <select
                    value={calcTo}
                    onChange={(e) => setCalcTo(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-900"
                  >
                    {localities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Vehicle Class</label>
                  <select
                    value={calcVehicle}
                    onChange={(e) => setCalcVehicle(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-semibold text-stone-900"
                  >
                    <option value="All">All Vehicle Classes</option>
                    {vehicleTypes.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Swap Button */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const temp = calcFrom;
                    setCalcFrom(calcTo);
                    setCalcTo(temp);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-semibold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Swap Direction ({calcTo} ↔ {calcFrom})</span>
                </button>
                <span className="text-xs text-stone-400 font-mono">
                  {calcResult.direct.length} direct options · {calcResult.multiStage.length} transfer routes
                </span>
              </div>
            </div>

            {/* Results: Direct Options */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span>Direct Route Tariffs: {calcFrom} ↔ {calcTo}</span>
              </h3>

              {calcResult.direct.length === 0 ? (
                <div className="p-6 bg-white border border-stone-200 rounded-xl text-center text-xs text-stone-500">
                  No direct vehicle service recorded for this pair. Check transfer stage options below.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {calcResult.direct.map((item) => {
                    const isLowest = item.price === Math.min(...calcResult.direct.map((m) => m.price));
                    return (
                      <div
                        key={item.id}
                        className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between ${
                          isLowest ? 'border-amber-400 ring-1 ring-amber-400/20' : 'border-stone-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-0.5 rounded font-bold bg-stone-100 text-stone-800">
                              {item.vehicleType}
                            </span>
                            {isLowest && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                                BEST VALUE
                              </span>
                            )}
                          </div>
                          <div className="mt-4">
                            <div className="text-3xl font-extrabold text-stone-900 font-mono tabular-nums">
                              D{item.price}
                            </div>
                            <span className="text-[11px] text-stone-400">Fixed Passenger Tariff</span>
                          </div>
                          {item.isBidirectional && (
                            <span className="mt-2 text-[10px] text-stone-400 block">
                              Reverse tariff match
                            </span>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                          <button
                            onClick={() => speakFare(item)}
                            className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Audio</span>
                          </button>
                          <button
                            onClick={() => {
                              setReportFormData({
                                route: `${item.from} → ${item.to}`,
                                vehicleType: item.vehicleType,
                                officialPrice: item.price,
                                priceCharged: '',
                                plateNumber: '',
                                notes: '',
                              });
                              setIsReportModalOpen(true);
                            }}
                            className="text-xs text-rose-600 hover:underline"
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Results: Intermediate Multi-Stage Route Options */}
            {calcResult.multiStage.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <h3 className="text-base font-bold text-stone-900">
                  Multi-Stage Transfer Options (via Intermediate Car Park Hubs)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {calcResult.multiStage.map((stage, idx) => (
                    <div key={idx} className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded">
                          Transfer at {stage.transferHub} Garage
                        </span>
                        <span className="text-xl font-bold font-mono tabular-nums text-stone-900">
                          Total D{stage.totalPrice}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs text-stone-600">
                        {stage.legs.map((leg, lIdx) => (
                          <div key={lIdx} className="flex items-center justify-between bg-stone-50 p-2 rounded">
                            <span>
                              Leg {lIdx + 1}: {leg.from} → {leg.to} ({leg.vehicleType})
                            </span>
                            <span className="font-mono font-bold text-stone-900">D{leg.price}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px] text-stone-400 italic">{stage.notes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── TAB 3: CAR PARK & TERMINAL DIRECTORY ── */}
        {activeTab === 'terminals' && (
          <section className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Major Car Parks &amp; Transport Hubs</h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xl">
                  Official garages, vehicle terminals, operating schedules, and facilities across The Gambia.
                </p>
              </div>
              <span className="text-xs font-mono font-bold bg-stone-100 text-stone-700 px-3 py-1.5 rounded-lg">
                6 Regulated Hubs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {terminals.map((term) => (
                <div key={term.id} className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">{term.region}</span>
                      <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Active Terminal
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-stone-900">{term.name}</h3>
                    <p className="text-xs text-stone-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-stone-400" />
                      <span>{term.address}</span>
                    </p>

                    <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>Peak: {term.peakHours}</span>
                      </div>
                      <div className="text-[11px] text-stone-500">
                        Hours: <strong>{term.operatingHours}</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100">
                      <span className="text-[11px] font-semibold text-stone-500 block mb-1">Key Corridors:</span>
                      <div className="flex flex-wrap gap-1">
                        {term.connections.map((c, i) => (
                          <span key={i} className="text-[11px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setCalcFrom(term.town);
                        setActiveTab('calculator');
                      }}
                      className="text-xs font-semibold text-stone-900 hover:text-amber-700 flex items-center gap-1"
                    >
                      <span>Check Fares from here</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── TAB 4: OVERCHARGE REPORTS FEED ── */}
        {activeTab === 'reports' && (
          <section className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-stone-900">Fare Overcharge &amp; Compliance Log</h2>
                <p className="text-xs text-stone-500 mt-1 max-w-xl">
                  Community reports submitted by passengers against unauthorized pricing and baggage surcharges.
                </p>
              </div>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" />
                <span>File New Complaint</span>
              </button>
            </div>

            <div className="space-y-4">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-400">Incident #{rep.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-xs font-bold text-stone-900">{rep.route}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-800">{rep.vehicleType}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          rep.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {rep.status}
                      </span>
                    </div>

                    <div className="text-xs text-stone-600 flex flex-wrap items-center gap-3">
                      <span>Vehicle Plate: <strong className="font-mono text-stone-900">{rep.plateNumber}</strong></span>
                      <span aria-hidden="true">·</span>
                      <span>Price Charged: <strong className="font-mono text-rose-700">D{rep.priceCharged}</strong></span>
                      {rep.officialPrice && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Official Tariff: <strong className="font-mono text-stone-800">D{rep.officialPrice}</strong></span>
                          <span aria-hidden="true">·</span>
                          <span>Overcharge: <strong className="font-mono text-rose-700">+D{rep.overchargeAmount || (rep.priceCharged - rep.officialPrice)}</strong></span>
                        </>
                      )}
                    </div>

                    {rep.notes && <p className="text-xs text-stone-500 italic mt-1">"{rep.notes}"</p>}
                    {rep.resolutionNote && (
                      <p className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded mt-2">
                        <strong>Resolution Note:</strong> {rep.resolutionNote}
                      </p>
                    )}
                  </div>

                  {isAdmin && rep.status !== 'Resolved' && (
                    <button
                      onClick={() => handleResolveReport(rep.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors shrink-0"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── TAB 5: USSD SIMULATOR (*144#) ── */}
        {activeTab === 'ussd' && (
          <section className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
              <h2 className="text-xl font-bold text-stone-900">Feature Phone USSD Simulator (*144#)</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-xl">
                Test how commuters without smartphones look up tariffs on standard 2G/GSM feature phones via telecom USSD menus.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Retro Phone Display */}
              <div className="bg-stone-900 rounded-3xl p-6 text-stone-100 shadow-xl max-w-sm mx-auto w-full space-y-4">
                <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                  <span>GAMCEL / AFRICELL</span>
                  <span>4G / 2G USSD</span>
                </div>

                {/* LCD Screen */}
                <div className="bg-emerald-950/90 border border-emerald-800 rounded-xl p-4 min-h-[170px] font-mono text-xs text-emerald-300 whitespace-pre-line flex flex-col justify-between">
                  <div>{ussdScreen}</div>
                  <div className="text-[10px] text-emerald-500 border-t border-emerald-900 pt-1 mt-2">
                    Press send / reply
                  </div>
                </div>

                {/* Input and Keypad */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={ussdInput}
                      onChange={(e) => setUssdInput(e.target.value)}
                      placeholder="e.g. *144#, 1*1*2"
                      className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none"
                    />
                    <button
                      onClick={() => handleUssdDial()}
                      disabled={ussdLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-bold rounded-lg text-xs"
                    >
                      {ussdLoading ? '...' : 'SEND'}
                    </button>
                  </div>

                  {/* Preset Shortcuts */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-mono">
                    <button
                      onClick={() => handleUssdDial('*144#')}
                      className="p-2 bg-stone-800 hover:bg-stone-700 rounded text-center text-stone-200"
                    >
                      Dial *144#
                    </button>
                    <button
                      onClick={() => handleUssdDial('1*1*2')}
                      className="p-2 bg-stone-800 hover:bg-stone-700 rounded text-center text-stone-200"
                    >
                      Banjul → Ser.
                    </button>
                    <button
                      onClick={() => handleUssdDial('1*2*3')}
                      className="p-2 bg-stone-800 hover:bg-stone-700 rounded text-center text-stone-200"
                    >
                      Ser. → Brikama
                    </button>
                  </div>
                </div>
              </div>

              {/* USSD Architecture Explanation */}
              <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
                <h3 className="text-base font-bold text-stone-900">How USSD Inclusion Works in The Gambia</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Over 40% of public transport passengers and commercial vehicle drivers in provincial areas use basic feature phones.
                  The PASSO API powers telecom gateway integration so dialing <strong>*144#</strong> returns the exact gazetted tariff
                  in under 2 seconds without requiring an internet data bundle.
                </p>
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs space-y-1 font-mono">
                  <div>POST /api/ussd</div>
                  <div className="text-stone-500">Payload: {`{ text: "*144*1*2#" }`}</div>
                  <div className="text-emerald-700">Output: Official Fares Banjul to Serekunda: Bus D15, Gelegele D12, Taxi D100</div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 6: GAZETTE REVISIONS & CIRCULARS ── */}
        {activeTab === 'revisions' && (
          <section className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
              <h2 className="text-xl font-bold text-stone-900">Official Regulatory Circulars &amp; Gazette Revisions</h2>
              <p className="text-xs text-stone-500 mt-1 max-w-xl">
                Legal instruments and joint transport union agreements establishing commercial passenger tariffs.
              </p>
            </div>

            <div className="space-y-4">
              {revisions.map((rev) => (
                <div key={rev.id} className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                      {rev.revisionRef}
                    </span>
                    <span className="text-xs font-semibold text-stone-500">Effective: {rev.effectiveDate}</span>
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">{rev.title}</h3>
                  <div className="text-xs text-stone-600">
                    Authority: <strong>{rev.issuingAuthority}</strong>
                  </div>
                  <p className="text-xs text-stone-600 leading-relaxed">{rev.summary}</p>
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                    <span className="font-mono text-stone-500">{rev.gazetteNotice}</span>
                    <span className="text-emerald-700 font-bold">{rev.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-16 border-t border-stone-200 bg-white py-8 px-6 text-xs text-stone-500 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">PASSO Gambia Transit</span>
            <span aria-hidden="true">·</span>
            <span>MOTWI Regulated Tariffs</span>
            <span aria-hidden="true">·</span>
            <span>All figures in Gambian Dalasis (GMD)</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handlePrintTariff} className="hover:underline flex items-center gap-1">
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4 Tariff Sheet</span>
            </button>
            <span>Express Backend Port 3000</span>
          </div>
        </div>
      </footer>

      {/* ── MODAL 1: ADD / EDIT FARE (Admin Protected) ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">
                {modalMode === 'create' ? 'Register New Route Tariff' : `Update Tariff #${editingFare?.id}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                {formErrors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}

            <form onSubmit={handleFareFormSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Departure Locality (From)</label>
                <input
                  type="text"
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  placeholder="e.g. Banjul, Serekunda"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Destination Locality (To)</label>
                <input
                  type="text"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  placeholder="e.g. Serekunda, Brikama"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Vehicle Class</label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    {vehicleTypes.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Price (GMD)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-stone-400">
                      D
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-7 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold"
                      placeholder="e.g. 25"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg"
                >
                  {isSubmitting ? 'Saving...' : 'Publish Tariff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: ADMIN PASSKEY LOGIN ── */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-700" />
                <h3 className="text-base font-bold text-stone-900">Officer Passkey Login</h3>
              </div>
              <button onClick={() => setIsAdminModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Enter official Ministry / GTU authority passkey to unlock tariff editing and complaint resolution privileges.
            </p>

            {authError && <div className="p-2 bg-rose-50 text-rose-700 text-xs rounded border border-rose-200">{authError}</div>}

            <form onSubmit={handleAdminLogin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Passkey</label>
                <input
                  type="password"
                  value={passkeyInput}
                  onChange={(e) => setPasskeyInput(e.target.value)}
                  placeholder="passo-admin-2026 or gambia2026"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  required
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Default passkey: passo-admin-2026</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: REPORT OVERCHARGE ── */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-stone-900">Report Fare Overcharge</h3>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-500">
              Submit overcharging incidents directly to the Transport Union and MOTWI Traffic Inspection Desk.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Route Taken</label>
                <input
                  type="text"
                  value={reportFormData.route}
                  onChange={(e) => setReportFormData({ ...reportFormData, route: e.target.value })}
                  placeholder="e.g. Serekunda to Brikama"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Vehicle Type</label>
                  <select
                    value={reportFormData.vehicleType}
                    onChange={(e) => setReportFormData({ ...reportFormData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    {vehicleTypes.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Plate Number</label>
                  <input
                    type="text"
                    value={reportFormData.plateNumber}
                    onChange={(e) => setReportFormData({ ...reportFormData, plateNumber: e.target.value })}
                    placeholder="e.g. BJL 1234 A"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Official Tariff (GMD)</label>
                  <input
                    type="number"
                    value={reportFormData.officialPrice}
                    onChange={(e) => setReportFormData({ ...reportFormData, officialPrice: e.target.value })}
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Price Charged (GMD)</label>
                  <input
                    type="number"
                    value={reportFormData.priceCharged}
                    onChange={(e) => setReportFormData({ ...reportFormData, priceCharged: e.target.value })}
                    placeholder="e.g. 25"
                    className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg font-mono font-bold text-rose-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Incident Notes</label>
                <textarea
                  value={reportFormData.notes}
                  onChange={(e) => setReportFormData({ ...reportFormData, notes: e.target.value })}
                  placeholder="Describe location, rain surcharge, or baggage dispute..."
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded-lg"
                >
                  {reportSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
