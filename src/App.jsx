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
  Bus,
  Car,
  MapPin,
  ChevronRight,
  Code2,
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';

import heroTransitImg from './assets/images/hero_gambia_transit_1791772482764.jpg';
import gelegeleVanImg from './assets/images/transit_gelegele_van_1791772494137.jpg';
import routeMapImg from './assets/images/transit_route_map_1791772505004.jpg';

export default function App() {
  // Data state
  const [fares, setFares] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'calculator' | 'corridors' | 'api'

  // Route calculator state
  const [calcFrom, setCalcFrom] = useState('');
  const [calcTo, setCalcTo] = useState('');
  const [calcVehicle, setCalcVehicle] = useState('All');

  // Search & Filter state for Directory
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleFilter, setSelectedVehicleFilter] = useState('All');
  const [sortBy, setSortBy] = useState('id-asc'); // 'id-asc' | 'price-asc' | 'price-desc' | 'from-asc'

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingFare, setEditingFare] = useState(null);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    vehicleType: 'Taxi',
    price: '',
  });
  const [formErrors, setFormErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

  // Fetch initial data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [faresRes, localitiesRes, vehicleTypesRes, statsRes] = await Promise.all([
        fetch('/api/fares'),
        fetch('/api/localities'),
        fetch('/api/vehicle-types'),
        fetch('/api/stats'),
      ]);

      if (!faresRes.ok) throw new Error(`Fares API returned status ${faresRes.status}`);

      const faresData = await faresRes.json();
      const localitiesData = await localitiesRes.json();
      const vehicleTypesData = await vehicleTypesRes.json();
      const statsData = await statsRes.json();

      setFares(faresData.fares || []);
      setLocalities(localitiesData.localities || []);
      setVehicleTypes(vehicleTypesData.vehicleTypes || ['Taxi', 'Bus', 'Gelegele', '7-Seater']);
      setStats(statsData);

      // Prepopulate calculator defaults if available
      if (localitiesData.localities && localitiesData.localities.length >= 2) {
        if (!calcFrom) setCalcFrom(localitiesData.localities[0]);
        if (!calcTo) setCalcTo(localitiesData.localities[1]);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load transit fare records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered & Sorted Fares
  const processedFares = useMemo(() => {
    let result = [...fares];

    // Filter by search query
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

    // Filter by vehicle type
    if (selectedVehicleFilter !== 'All') {
      result = result.filter((f) => f.vehicleType === selectedVehicleFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'from-asc') return a.from.localeCompare(b.from);
      return a.id - b.id;
    });

    return result;
  }, [fares, searchQuery, selectedVehicleFilter, sortBy]);

  // Route matches for Calculator
  const routeMatches = useMemo(() => {
    if (!calcFrom || !calcTo) return [];
    return fares.filter((f) => {
      const originMatch = f.from.toLowerCase() === calcFrom.toLowerCase();
      const destMatch = f.to.toLowerCase() === calcTo.toLowerCase();
      const reverseMatch = f.from.toLowerCase() === calcTo.toLowerCase() && f.to.toLowerCase() === calcFrom.toLowerCase();
      const vehicleMatch = calcVehicle === 'All' || f.vehicleType === calcVehicle;
      return (originMatch && destMatch || reverseMatch) && vehicleMatch;
    });
  }, [fares, calcFrom, calcTo, calcVehicle]);

  // Handlers for Add / Edit
  const openCreateModal = () => {
    setModalMode('create');
    setEditingFare(null);
    setFormData({
      from: localities[0] || 'Banjul',
      to: localities[1] || 'Serekunda',
      vehicleType: vehicleTypes[0] || 'Taxi',
      price: '',
    });
    setFormErrors([]);
    setIsModalOpen(true);
  };

  const openEditModal = (fare) => {
    setModalMode('edit');
    setEditingFare(fare);
    setFormData({
      from: fare.from,
      to: fare.to,
      vehicleType: fare.vehicleType,
      price: String(fare.price),
    });
    setFormErrors([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingFare(null);
    setFormErrors([]);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormErrors([]);
    setIsSubmitting(true);

    const priceNum = Number(formData.price);
    const errors = [];

    if (!formData.from || !formData.from.trim()) errors.push('Departure locality is required.');
    if (!formData.to || !formData.to.trim()) errors.push('Destination locality is required.');
    if (formData.from && formData.to && formData.from.trim().toLowerCase() === formData.to.trim().toLowerCase()) {
      errors.push('Departure and destination localities cannot be identical.');
    }
    if (!formData.vehicleType) errors.push('Vehicle type is required.');
    if (isNaN(priceNum) || priceNum <= 0) errors.push('Fare price must be a positive number.');

    if (errors.length > 0) {
      setFormErrors(errors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (modalMode === 'create') {
        const res = await fetch('/api/fares', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: formData.from.trim(),
            to: formData.to.trim(),
            vehicleType: formData.vehicleType,
            price: priceNum,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || (data.messages && data.messages.join(', ')) || 'Failed to create fare');
        }
        setActionNotice({ type: 'success', text: `Route fare #${data.id} registered successfully.` });
      } else {
        const res = await fetch(`/api/fares/${editingFare.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: formData.from.trim(),
            to: formData.to.trim(),
            vehicleType: formData.vehicleType,
            price: priceNum,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || (data.messages && data.messages.join(', ')) || 'Failed to update fare');
        }
        setActionNotice({ type: 'success', text: `Route fare #${editingFare.id} updated to D${priceNum}.` });
      }

      closeModal();
      await loadData();
    } catch (err) {
      setFormErrors([err.message || 'Network request failed.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFare = async (id) => {
    if (!window.confirm(`Are you sure you want to delete fare #${id}?`)) return;

    try {
      const res = await fetch(`/api/fares/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete fare');
      }
      setActionNotice({ type: 'success', text: `Fare #${id} removed from registry.` });
      await loadData();
    } catch (err) {
      setActionNotice({ type: 'error', text: err.message || 'Deletion failed' });
    }
  };

  // Helper for vehicle badge styles
  const getVehicleMeta = (type) => {
    switch (type) {
      case 'Gelegele':
        return { label: 'Gelegele Van', desc: 'High-frequency yellow minibus', bg: 'bg-amber-100 text-amber-900' };
      case 'Taxi':
        return { label: 'Town Taxi', desc: 'Direct urban street cab', bg: 'bg-emerald-100 text-emerald-900' };
      case 'Bus':
        return { label: 'GTSC Bus', desc: 'Regional express coach', bg: 'bg-sky-100 text-sky-900' };
      case '7-Seater':
        return { label: '7-Seater', desc: 'Inter-division Peugeot station wagon', bg: 'bg-stone-200 text-stone-900' };
      default:
        return { label: type, desc: 'Public transit vehicle', bg: 'bg-stone-100 text-stone-800' };
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-amber-200 selection:text-stone-900">
      {/* ── TOP BAR CONTRACT (Strict 3-zone contract) ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-stone-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setActiveTab('directory'); }}
            className="text-xl font-extrabold tracking-tight text-stone-900 hover:text-amber-600 transition-colors whitespace-nowrap shrink-0"
          >
            PASSO
          </a>

          {/* Zone 2: 4 single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
            <button
              onClick={() => setActiveTab('directory')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'directory' ? 'text-stone-900 border-b-2 border-stone-900 font-semibold' : ''
              }`}
            >
              Fares Directory
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'calculator' ? 'text-stone-900 border-b-2 border-stone-900 font-semibold' : ''
              }`}
            >
              Route Calculator
            </button>
            <button
              onClick={() => setActiveTab('corridors')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'corridors' ? 'text-stone-900 border-b-2 border-stone-900 font-semibold' : ''
              }`}
            >
              Transit Corridors
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                activeTab === 'api' ? 'text-stone-900 border-b-2 border-stone-900 font-semibold' : ''
              }`}
            >
              API Explorer
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 active:scale-95 transition-all whitespace-nowrap shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Route Fare</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Toast Notice */}
      {actionNotice && (
        <div
          className={`px-4 py-2 text-xs font-medium border-b flex items-center justify-between ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>{actionNotice.text}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="p-1 hover:opacity-75 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* ── HERO SECTION & SYSTEM CONTEXT ── */}
        <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            {/* Left Content */}
            <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-2">
                  <span>The Gambia Transport Fare System</span>
                  <span aria-hidden="true">·</span>
                  <span>Currency: Dalasi (GMD / D)</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 text-balance leading-tight">
                  Official Gambian passenger transit fares &amp; route network
                </h1>
                <p className="text-stone-600 text-base leading-relaxed max-w-xl">
                  Explore regulated fares between Greater Banjul Area, West Coast, and Lower River Divisions.
                  Compare town taxis, Gelegele minibuses, 7-seaters, and regional GTSC express coaches.
                </p>
              </div>

              {/* Quick calculator jump or metric summary */}
              <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-4 text-xs text-stone-500">
                <span className="font-semibold text-stone-900 font-mono tabular-nums">{fares.length} Verified Fares</span>
                <span aria-hidden="true">·</span>
                <span>{localities.length} Major Terminals</span>
                <span aria-hidden="true">·</span>
                <span>4 Vehicle Classes</span>
                <span aria-hidden="true">·</span>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="inline-flex items-center gap-1 text-stone-700 hover:text-stone-900 font-medium ml-auto"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  <span>Refresh Data</span>
                </button>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full bg-stone-100 border-t lg:border-t-0 lg:border-l border-stone-200">
              <img
                src={heroTransitImg}
                alt="Transit hub in Banjul, The Gambia with yellow and green commercial vehicles"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-xs text-stone-100 text-[11px] px-2.5 py-1 rounded-md">
                Banjul &amp; Serekunda Transit Corridors
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        {stats && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-stone-500 font-medium block">Total Registered Fares</span>
              <div className="mt-2 text-2xl font-bold text-stone-900 font-mono tabular-nums">
                {stats.totalFares}
              </div>
              <span className="text-xs text-stone-400 mt-1 block">Active corridor tariffs</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-stone-500 font-medium block">Average Single Fare</span>
              <div className="mt-2 text-2xl font-bold text-stone-900 font-mono tabular-nums">
                D{stats.averagePrice}
              </div>
              <span className="text-xs text-stone-400 mt-1 block">Across all 4 vehicle types</span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-stone-500 font-medium block">Most Expensive Route</span>
              <div className="mt-2 text-xl font-bold text-stone-900 truncate">
                {stats.mostExpensiveRoute ? `${stats.mostExpensiveRoute.from} → ${stats.mostExpensiveRoute.to}` : 'N/A'}
              </div>
              <span className="text-xs text-stone-500 font-mono tabular-nums mt-1 block">
                {stats.mostExpensiveRoute ? `D${stats.mostExpensiveRoute.price} (${stats.mostExpensiveRoute.vehicleType})` : ''}
              </span>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
              <span className="text-xs text-stone-500 font-medium block">Most Economical Class</span>
              <div className="mt-2 text-xl font-bold text-stone-900 truncate">
                {stats.cheapestVehicle ? stats.cheapestVehicle.type : 'Gelegele'}
              </div>
              <span className="text-xs text-stone-500 font-mono tabular-nums mt-1 block">
                {stats.cheapestVehicle ? `D${stats.cheapestVehicle.avgPrice} avg fare` : ''}
              </span>
            </div>
          </section>
        )}

        {/* ── VIEWPORT TABS / SEGMENTED CONTROLS ── */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="inline-flex p-1 bg-stone-100 rounded-lg">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'directory'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Fares Directory
            </button>
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'calculator'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Route Calculator
            </button>
            <button
              onClick={() => setActiveTab('corridors')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'corridors'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Corridors &amp; Fleet
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'api'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Backend API Explorer
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
            <MapPin className="w-3.5 h-3.5 text-stone-400" />
            <span>Coverage: Banjul · Serekunda · Brikama · Soma · Farafenni · Lamin</span>
          </div>
        </div>

        {/* ── TAB 1: FARES DIRECTORY ── */}
        {activeTab === 'directory' && (
          <section className="space-y-6">
            {/* Filter & Search Toolbar */}
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by locality, vehicle type, or price..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all text-stone-900 placeholder:text-stone-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Segmented Vehicle Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                <span className="text-xs text-stone-400 mr-1 hidden sm:inline">Vehicle:</span>
                {['All', 'Taxi', 'Bus', 'Gelegele', '7-Seater'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setSelectedVehicleFilter(v)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                      selectedVehicleFilter === v
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400 whitespace-nowrap">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-xs font-medium bg-stone-50 border border-stone-200 rounded-lg text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900"
                >
                  <option value="id-asc">ID (Default)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                  <option value="from-asc">Origin Locality</option>
                </select>
              </div>
            </div>

            {/* Error or Empty State */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs hover:bg-rose-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Fares Table */}
            <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 font-semibold w-16">#</th>
                      <th className="py-3 px-4 font-semibold">Origin</th>
                      <th className="py-3 px-2 font-semibold w-8"></th>
                      <th className="py-3 px-4 font-semibold">Destination</th>
                      <th className="py-3 px-4 font-semibold">Vehicle Class</th>
                      <th className="py-3 px-4 font-semibold text-right">Fare (GMD)</th>
                      <th className="py-3 px-4 font-semibold text-right w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-stone-400 text-sm">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-stone-400" />
                          Loading fare registry from server...
                        </td>
                      </tr>
                    ) : processedFares.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-stone-500 text-sm">
                          <div className="max-w-sm mx-auto space-y-3">
                            <p className="font-semibold text-stone-800">No route fares match your criteria.</p>
                            <p className="text-xs text-stone-400">
                              Try clearing filters or search queries, or register a new route fare.
                            </p>
                            <button
                              onClick={openCreateModal}
                              className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                            >
                              Add First Custom Route
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      processedFares.map((fare) => {
                        const meta = getVehicleMeta(fare.vehicleType);
                        return (
                          <tr
                            key={fare.id}
                            className="hover:bg-stone-50/75 transition-colors group"
                          >
                            <td className="py-3.5 px-4 font-mono tabular-nums text-xs text-stone-400">
                              {fare.id}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-stone-900">
                              {fare.from}
                            </td>
                            <td className="py-3.5 px-2 text-stone-300">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-stone-900">
                              {fare.to}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded font-medium ${meta.bg}`}>
                                  {fare.vehicleType}
                                </span>
                                <span className="text-xs text-stone-400 hidden xl:inline">
                                  {meta.desc}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-stone-900 text-base">
                              D{fare.price}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => openEditModal(fare)}
                                  title="Edit Fare"
                                  className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200 rounded transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteFare(fare.id)}
                                  title="Delete Fare"
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="px-4 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                <div>
                  Showing <span className="font-semibold text-stone-900 font-mono tabular-nums">{processedFares.length}</span> of{' '}
                  <span className="font-semibold text-stone-900 font-mono tabular-nums">{fares.length}</span> fares
                </div>
                <div className="flex items-center gap-3">
                  <span>Standard regulated passenger rates</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 2: ROUTE CALCULATOR ── */}
        {activeTab === 'calculator' && (
          <section className="space-y-8">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="max-w-2xl">
                <span className="text-xs font-semibold text-amber-700 tracking-wider uppercase">Interactive Fare Finder</span>
                <h2 className="text-2xl font-bold text-stone-900 mt-1">Calculate route cost &amp; vehicle options</h2>
                <p className="text-stone-600 text-sm mt-2">
                  Select your departure locality and destination to view all direct transport tariffs and find the most economical option.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Departure Locality</label>
                  <select
                    value={calcFrom}
                    onChange={(e) => setCalcFrom(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 font-medium focus:ring-1 focus:ring-stone-900 focus:bg-white"
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
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 font-medium focus:ring-1 focus:ring-stone-900 focus:bg-white"
                  >
                    {localities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">Preferred Vehicle</label>
                  <select
                    value={calcVehicle}
                    onChange={(e) => setCalcVehicle(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 font-medium focus:ring-1 focus:ring-stone-900 focus:bg-white"
                  >
                    <option value="All">All Vehicle Types</option>
                    {vehicleTypes.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const temp = calcFrom;
                    setCalcFrom(calcTo);
                    setCalcTo(temp);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Swap Origin &amp; Destination</span>
                </button>

                <span className="text-xs text-stone-500 font-mono tabular-nums">
                  {routeMatches.length} available service{routeMatches.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-stone-900 flex items-center justify-between">
                <span>Available Fares for {calcFrom} ↔ {calcTo}</span>
                {routeMatches.length > 0 && (
                  <span className="text-xs text-stone-500 font-normal">
                    Lowest fare: <strong className="text-stone-900 font-mono tabular-nums">D{Math.min(...routeMatches.map(m => m.price))}</strong>
                  </span>
                )}
              </h3>

              {calcFrom === calcTo ? (
                <div className="p-8 bg-amber-50 border border-amber-200 rounded-xl text-center space-y-2">
                  <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                  <p className="font-semibold text-amber-900">Origin and Destination are identical</p>
                  <p className="text-xs text-amber-700">Please choose distinct departure and arrival points.</p>
                </div>
              ) : routeMatches.length === 0 ? (
                <div className="p-10 bg-white border border-stone-200 rounded-xl text-center space-y-4">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-500">
                    <Navigation className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-stone-900">No direct recorded fare between {calcFrom} and {calcTo}</h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                      Transit on this corridor may require connecting through Serekunda or Brikama terminals, or you can register a new direct fare.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setFormData({
                        from: calcFrom,
                        to: calcTo,
                        vehicleType: 'Taxi',
                        price: '',
                      });
                      setModalMode('create');
                      setIsModalOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                  >
                    Register This Route Fare
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {routeMatches.map((match) => {
                    const meta = getVehicleMeta(match.vehicleType);
                    const isCheapest = match.price === Math.min(...routeMatches.map((m) => m.price));
                    return (
                      <div
                        key={match.id}
                        className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all ${
                          isCheapest ? 'border-amber-400 ring-1 ring-amber-400/20' : 'border-stone-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs px-2.5 py-0.5 rounded font-medium ${meta.bg}`}>
                              {match.vehicleType}
                            </span>
                            {isCheapest && (
                              <span className="text-[10px] font-bold tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                BEST VALUE
                              </span>
                            )}
                          </div>

                          <div className="mt-4">
                            <div className="text-3xl font-extrabold text-stone-900 font-mono tabular-nums">
                              D{match.price}
                            </div>
                            <span className="text-xs text-stone-400">Single Passenger Fare</span>
                          </div>

                          <div className="mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600 space-y-1">
                            <p className="font-medium text-stone-800">{meta.desc}</p>
                            <p className="text-stone-500">{match.from} to {match.to}</p>
                          </div>
                        </div>

                        <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                          <span className="font-mono">Fare #{match.id}</span>
                          <button
                            onClick={() => openEditModal(match)}
                            className="text-stone-700 hover:text-stone-900 font-medium underline"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── TAB 3: CORRIDORS & FLEET ── */}
        {activeTab === 'corridors' && (
          <section className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Gelegele & Minibus Showcase */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
                <div className="h-64 sm:h-72 overflow-hidden bg-stone-100 relative">
                  <img
                    src={gelegeleVanImg}
                    alt="Yellow Gelegele minivan at Serekunda terminal in The Gambia"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-stone-100 text-xs px-2.5 py-1 rounded">
                    Public Passenger Minibus Fleet
                  </div>
                </div>
                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Gelegele &amp; Town Taxis</h3>
                    <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                      Gelegeles are the lifeblood of urban transit in the Greater Banjul Area, running high-frequency routes
                      between coastal terminals, Westfield junction, and bustling market centers.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-4 text-xs text-stone-500">
                    <div>
                      <strong className="text-stone-900 block font-mono">D8 – D30</strong>
                      <span>Average urban segment</span>
                    </div>
                    <div>
                      <strong className="text-stone-900 block font-mono">14 – 18 Seats</strong>
                      <span>Standard vehicle capacity</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transit Map Showcase */}
              <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
                <div className="h-64 sm:h-72 overflow-hidden bg-stone-100 relative">
                  <img
                    src={routeMapImg}
                    alt="Schematic map of The Gambia transit corridor"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-stone-100 text-xs px-2.5 py-1 rounded">
                    River &amp; Highway Corridors
                  </div>
                </div>
                <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-stone-900">Trans-Gambia Highway Network</h3>
                    <p className="text-stone-600 text-sm mt-2 leading-relaxed">
                      Connecting Banjul via the south bank highway to Brikama, Soma, and the Senegambia Bridge crossing at Farafenni.
                      Inter-division journeys rely on robust 7-seaters and GTSC long-distance bus coaches.
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-100 grid grid-cols-2 gap-4 text-xs text-stone-500">
                    <div>
                      <strong className="text-stone-900 block font-mono">Brikama ↔ Soma</strong>
                      <span>D75 Bus / D400 Taxi</span>
                    </div>
                    <div>
                      <strong className="text-stone-900 block font-mono">Soma ↔ Farafenni</strong>
                      <span>D30 Gelegele / D40 Bus</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Type Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs">
                  GL
                </div>
                <h4 className="font-bold text-stone-900 mt-3 text-base">Gelegele</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Shared minibuses for short, medium, and inter-town routes. Most economical option for daily commuters.
                </p>
                <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] font-mono text-stone-600">
                  Regulated flat fare
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs">
                  TX
                </div>
                <h4 className="font-bold text-stone-900 mt-3 text-base">Town Taxi</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Yellow cabs offering direct chartered or shared door-to-door trips throughout municipal districts.
                </p>
                <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] font-mono text-stone-600">
                  Direct express travel
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-900 flex items-center justify-center font-bold text-xs">
                  BS
                </div>
                <h4 className="font-bold text-stone-900 mt-3 text-base">GTSC Bus</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Government Transport Service Company coaches with fixed stops, scheduled departures, and comfortable transit.
                </p>
                <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] font-mono text-stone-600">
                  Air-conditioned coaches
                </div>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-900 flex items-center justify-center font-bold text-xs">
                  7S
                </div>
                <h4 className="font-bold text-stone-900 mt-3 text-base">7-Seater</h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Fast inter-provincial station wagons for medium to long-distance highway travel across divisions.
                </p>
                <div className="mt-3 pt-2 border-t border-stone-100 text-[11px] font-mono text-stone-600">
                  Fixed luggage capacity
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── TAB 4: API EXPLORER ── */}
        {activeTab === 'api' && (
          <section className="space-y-6">
            <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">REST Architecture</span>
              <h2 className="text-2xl font-bold text-stone-900 mt-1">Live Backend Endpoints &amp; Integration</h2>
              <p className="text-stone-600 text-sm mt-2 max-w-2xl leading-relaxed">
                The Express backend provides clean REST endpoints with full input validation and structured error handling.
                All data displayed in this application is live and persisted via the Node.js backend.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      GET /api/fares
                    </span>
                    <a
                      href="/api/fares"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                    >
                      <span>Open JSON</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-stone-600">
                    Retrieves full list of fares with count and metadata.
                  </p>
                </div>

                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      GET /api/stats
                    </span>
                    <a
                      href="/api/stats"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                    >
                      <span>Open JSON</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-stone-600">
                    Calculates average price, cheapest vehicle class, and highest tariff.
                  </p>
                </div>

                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      GET /api/localities
                    </span>
                    <a
                      href="/api/localities"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                    >
                      <span>Open JSON</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-stone-600">
                    Returns dynamically computed unique list of all connected hubs.
                  </p>
                </div>

                <div className="border border-stone-200 rounded-xl p-4 bg-stone-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      GET /api/vehicle-types
                    </span>
                    <a
                      href="/api/vehicle-types"
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-stone-500 hover:text-stone-900 inline-flex items-center gap-1"
                    >
                      <span>Open JSON</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-xs text-stone-600">
                    Returns valid vehicle classes supported by the tariff authority.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer className="mt-16 border-t border-stone-200 bg-white py-8 px-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900">PASSO Transport Directory</span>
            <span aria-hidden="true">·</span>
            <span>The Gambia</span>
            <span aria-hidden="true">·</span>
            <span>All tariffs in Gambian Dalasis (GMD)</span>
          </div>
          <div>
            <span>Connected to Express API running on port 3000</span>
          </div>
        </div>
      </footer>

      {/* ── CREATE / EDIT FARE MODAL ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">
                  {modalMode === 'create' ? 'Register New Route Fare' : `Update Fare #${editingFare?.id}`}
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Enter official passenger tariff details
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formErrors.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                {formErrors.map((err, i) => (
                  <p key={i} className="text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{err}</span>
                  </p>
                ))}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Departure Locality (From)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Banjul, Serekunda, Brikama"
                  value={formData.from}
                  onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white text-stone-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Destination Locality (To)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Serekunda, Lamin, Soma"
                  value={formData.to}
                  onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white text-stone-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Vehicle Type
                  </label>
                  <select
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white text-stone-900"
                  >
                    {vehicleTypes.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Fare Price (GMD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-stone-500">
                      D
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 25"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white text-stone-900 font-mono tabular-nums"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : modalMode === 'create' ? 'Register Fare' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
