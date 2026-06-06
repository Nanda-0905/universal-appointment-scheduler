/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Briefcase, BookOpen, Clock, Layers, Sparkles, User as UserIcon, Bell, LogOut, ArrowRight, Clipboard, ChevronRight } from 'lucide-react';
import { User, Service, Booking, AppNotification } from './types.js';
import { api, setToken, getToken } from './api.js';
import AuthScreen from './components/AuthScreen.js';
import OnboardingWizard from './components/OnboardingWizard.js';
import BookingFunnel from './components/BookingFunnel.js';
import ProviderDashboard from './components/ProviderDashboard.js';
import NotificationPanel from './components/NotificationPanel.js';

export default function App() {
  // Global session state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Directory / Explorer states
  const [providers, setProviders] = useState<User[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');

  // Multi-view router states
  // Views: 'explorer' | 'booking-tunnel' | 'dashboard' | 'auth' | 'my-bookings'
  const [view, setView] = useState<'explorer' | 'booking-tunnel' | 'dashboard' | 'auth' | 'my-bookings'>('explorer');
  const [activeProvider, setActiveProvider] = useState<User | null>(null);
  const [activeServices, setActiveServices] = useState<Service[]>([]);

  // Client-bookings list state
  const [clientBookings, setClientBookings] = useState<Booking[]>([]);
  const [clientBookingsLoading, setClientBookingsLoading] = useState(false);

  // In-app notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Filter Categories
  const INDUSTRIES = ['all', 'Healthcare / Dentist', 'Fitness / Yoga', 'Consulting / Developer'];

  // Load master catalog list of providers
  const loadProvidersCatalog = async () => {
    try {
      const data = await api.getProviders();
      setProviders(data);
      setFilteredProviders(data);
    } catch (e) {
      console.error('Failed to load professional providers list', e);
    }
  };

  // Sync session on mount
  useEffect(() => {
    // Check if token exists in localStorage, look up active logged in state
    const token = getToken();
    if (token) {
      // Find user from providers lists, or if not found, we fetch providers first to sync session
      api.getProviders().then((data) => {
        setProviders(data);
        setFilteredProviders(data);
        
        // Find user by token id
        const userId = token.replace('token-', '');
        const found = data.find((u) => u.id === userId);
        if (found) {
          setCurrentUser(found);
          // If they are a provider, route them to dashboard!
          if (found.role === 'provider') {
            setView('dashboard');
          }
        } else {
          // Check if custom guest or other registered user exists on server
          // Fetch guest bookings or general user mapping
          setToken(''); // Reset invalid token
        }
        setUserLoading(false);
      }).catch(() => {
        setUserLoading(false);
      });
    } else {
      loadProvidersCatalog();
      setUserLoading(false);
    }
  }, []);

  // Set up periodic notifications poller
  const fetchNotificationsFeed = async () => {
    if (!currentUser) return;
    try {
      const notifs = await api.getNotifications({ userId: currentUser.id });
      setNotifications(notifs);
    } catch (e) {
      console.error('Error listing live alerts', e);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotificationsFeed();
      const interval = setInterval(fetchNotificationsFeed, 10000); // 10s polling
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
    }
  }, [currentUser]);

  // Load client bookings list if Client is logged
  const loadClientBookings = async () => {
    if (!currentUser || currentUser.role !== 'client') return;
    setClientBookingsLoading(true);
    try {
      const list = await api.getBookings({ userId: currentUser.id, role: 'client' });
      setClientBookings(list);
    } catch (e) {
      console.error('Failed syncing client bookings calendar', e);
    } finally {
      setClientBookingsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser && currentUser.role === 'client') {
      loadClientBookings();
    }
  }, [currentUser, view]);

  // Handle shareable URLs: parse /book/:username
  useEffect(() => {
    const parseUrlRoute = async () => {
      const parts = window.location.pathname.split('/');
      if (parts[1] === 'book' && parts[2]) {
        const username = parts[2];
        try {
          const res = await api.getProviderByUsername(username);
          setActiveProvider(res.provider);
          setActiveServices(res.services);
          setView('booking-tunnel');
        } catch (e) {
          console.error('No provider matched username sharing URL', e);
          setView('explorer');
        }
      }
    };
    parseUrlRoute();
  }, []);

  // Filter providers logic
  useEffect(() => {
    let result = providers;
    if (selectedIndustry !== 'all') {
      result = result.filter((u) => u.providerProfile?.industry?.includes(selectedIndustry.split(' / ')[0]));
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.providerProfile?.bio?.toLowerCase().includes(q) ||
          u.providerProfile?.industry?.toLowerCase().includes(q)
      );
    }
    setFilteredProviders(result);
  }, [searchQuery, selectedIndustry, providers]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'provider') {
      setView('dashboard');
    } else {
      setView('explorer');
    }
    loadProvidersCatalog();
  };

  const handleLogout = () => {
    setToken('');
    setCurrentUser(null);
    setView('explorer');
    setShowNotifications(false);
  };

  const startBookingProcess = async (prov: User) => {
    setActiveProvider(prov);
    try {
      const services = await api.getProviderServices(prov.id);
      setActiveServices(services);
      setView('booking-tunnel');
      // Push virtual share state into window history
      window.history.pushState({}, '', `/book/${prov.providerProfile?.username}`);
    } catch (e) {
      console.error('Error fetching services roster list', e);
    }
  };

  const handleReturnToCatalogClean = () => {
    setView('explorer');
    setActiveProvider(null);
    window.history.pushState({}, '', '/');
  };

  return (
    <div className="min-h-screen bg-[#F8F7F3] text-[#2C3327] flex flex-col font-sans" id="app-root">
      
      {/* Visual Navigation Bar */}
      <nav className="bg-white border-b border-[#E8E6DF] sticky top-0 z-50 shadow-[0_2px_12px_rgba(44,51,39,0.02)] px-6 py-4 flex items-center justify-between">
        <button
          onClick={handleReturnToCatalogClean}
          className="flex items-center space-x-2.5 text-left cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 rounded-xl bg-[#5F6F52] flex items-center justify-center font-mono font-bold text-white text-lg">
            🌿
          </div>
          <div>
            <h1 className="font-serif font-bold text-base text-[#2C3327] tracking-tight">Universal Scheduling Hub</h1>
            <p className="text-[10px] text-[#7A8273] font-mono uppercase tracking-wider">White-Label Booking Suite</p>
          </div>
        </button>

        <div className="flex items-center space-x-3.5">
          {currentUser ? (
            <>
              {/* Notification Alarm Icon */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-xl border border-[#E8E6DF] transition-all cursor-pointer flex items-center justify-center relative ${
                    showNotifications ? 'bg-[#F0F2ED] border-[#7A8273] text-[#5F6F52]' : 'bg-white hover:bg-[#F0F2ED] text-[#2C3327]'
                  }`}
                >
                  <Bell className="w-4 h-4" />
                  {notifications.some((n) => !n.read) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#A66E4E] rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>

                {/* Abs panel popover */}
                <AnimatePresence>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2.5 w-80 max-w-sm z-50">
                      <NotificationPanel
                        notifications={notifications}
                        onMarkRead={(id) => {
                          setNotifications(
                            notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
                          );
                        }}

                        onRefresh={fetchNotificationsFeed}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>

              {/* View Dashboard / Explorer Shortcuts */}
              {currentUser.role === 'provider' ? (
                <button
                  onClick={() => setView('dashboard')}
                  className="px-4 py-2 bg-[#5F6F52] hover:bg-[#4d5b43] text-white rounded-xl text-xs font-semibold shadow-[0_2px_8px_rgba(95,111,82,0.15)] transition-all cursor-pointer"
                >
                  Merchant Dashboard
                </button>
              ) : (
                <button
                  onClick={() => setView('my-bookings')}
                  className="px-4 py-2 border border-[#E8E6DF] text-[#5F6F52] rounded-xl text-xs font-semibold hover:bg-[#F0F2ED] transition-all cursor-pointer bg-white"
                >
                  My Scheduled Slots
                </button>
              )}

              {/* Logged in avatar */}
              <div className="flex items-center space-x-2 pl-2 border-l border-[#E8E6DF]">
                <div className="hidden sm:block text-right">
                  <span className="block text-xs font-bold text-[#2C3327]">{currentUser.name}</span>
                  <span className="block text-[9px] uppercase tracking-wider font-mono text-[#7A8273]">
                    {currentUser.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-2 bg-[#F0F2ED] hover:bg-rose-50 hover:text-rose-600 text-[#7A8273] rounded-lg border border-[#E8E6DF] transition-all cursor-pointer"
                  title="Sign out of account"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setView('auth')}
              className="px-4.5 py-2.5 bg-[#2C3327] hover:bg-[#1f241c] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
            >
              <span>Login / Register</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      {/* Main Container screen slots */}
      <main className="flex-grow py-8 px-4 max-w-7xl mx-auto w-full">
        {userLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-10 h-10 border-4 border-[#F0F2ED] border-t-[#5F6F52] rounded-full animate-spin" />
            <span className="text-xs font-mono text-[#7A8273]">Decrypting workspace session signatures...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* 1. DIRECTORY / EXPLORER VIEW */}
            {view === 'explorer' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-10"
              >
                {/* Hero visual header */}
                <div className="text-center space-y-4 max-w-2xl mx-auto py-6">
                  <div className="inline-flex items-center space-x-1.5 bg-[#F0F2ED] border border-[#E8E6DF] rounded-full px-3.5 py-1 text-xs text-[#5F6F52] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#A66E4E] animate-pulse" />
                    <span>Pragmatic Booking Solutions for Any Industry</span>
                  </div>

                  <h2 className="text-3xl sm:text-5xl font-serif tracking-tight text-[#2C3327] leading-tight">
                    Schedule Appointments with Specialists Instantly
                  </h2>
                  <p className="text-[#7A8273] text-sm max-w-lg mx-auto leading-relaxed">
                    Browse services, select real-time vacant shift slots, and receive instant confirmation updates without double-booking overlaps.
                  </p>
                </div>

                {/* Filter and search utilities rail */}
                <div className="bg-white border border-[#E8E6DF] p-4.5 rounded-2xl max-w-4xl mx-auto flex flex-col sm:flex-row gap-3.5 shadow-[0_4px_20px_rgba(44,51,39,0.02)]">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="w-full bg-[#F0F2ED]/50 border border-[#E8E6DF] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none rounded-xl pl-4 pr-4 py-2.5 text-sm text-[#2C3327] placeholder-[#7A8273]/70"
                      placeholder="Search practitioners by name, specialties, or biography details..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    {INDUSTRIES.map((ind) => {
                      const isActive = selectedIndustry === ind;
                      return (
                        <button
                          key={ind}
                          type="button"
                          onClick={() => setSelectedIndustry(ind)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-[#5F6F52] border-[#5F6F52] text-white shadow-sm'
                              : 'bg-white hover:bg-[#F0F2ED] text-[#7A8273] border-[#E8E6DF]'
                          }`}
                        >
                          {ind === 'all' ? 'All Niches' : ind.replace(' / ', ' • ')}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid List of Seed Providers */}
                {filteredProviders.length === 0 ? (
                  <div className="py-12 text-center bg-[#F0F2ED]/50 border border-[#E8E6DF] rounded-3xl max-w-md mx-auto text-[#7A8273] text-xs">
                    ⚠️ No registered practitioners matched your query parameters. Try a different search!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {filteredProviders.map((prov) => {
                      // Custom brand icons matching specialized niches
                      let emoji = '💼';
                      if (prov.providerProfile?.industry?.includes('Dentist') || prov.providerProfile?.industry?.includes('Health')) emoji = '🩺';
                      if (prov.providerProfile?.industry?.includes('Yoga') || prov.providerProfile?.industry?.includes('Fitness')) emoji = '🧘';
                      if (prov.providerProfile?.industry?.includes('Developer') || prov.providerProfile?.industry?.includes('Tech')) emoji = '💻';

                      return (
                        <div
                          key={prov.id}
                          className="bg-white border border-[#E8E6DF] rounded-3xl p-6 hover:border-[#5F6F52] hover:shadow-[0_12px_40px_rgba(95,111,82,0.06)] transition-all flex flex-col justify-between text-left relative overflow-hidden group"
                        >
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="w-12 h-12 rounded-2xl bg-[#F0F2ED] border border-[#E8E6DF] flex items-center justify-center text-2xl font-mono">
                                {emoji}
                              </div>
                              <span className="bg-[#F0F2ED] border border-[#E8E6DF] rounded-full text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 text-[#5F6F52]">
                                {prov.providerProfile?.industry}
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <h3 className="font-serif font-bold text-lg text-[#2C3327] group-hover:text-[#5F6F52] transition-colors">
                                {prov.name}
                              </h3>
                              <p className="text-[#7A8273]/80 text-[11px] font-mono leading-none">
                                link: book/{prov.providerProfile?.username}
                              </p>
                              <p className="text-xs text-[#7A8273] leading-relaxed line-clamp-3 pt-1">
                                {prov.providerProfile?.bio}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-[#E8E6DF] pt-4 mt-6 flex justify-between items-center">
                            <span className="text-[10px] uppercase font-mono text-[#7A8273]/80">
                              Weekdays: Mon-Fri
                            </span>
                            <button
                              onClick={() => startBookingProcess(prov)}
                              className="px-4 py-2 bg-[#2C3327] hover:bg-[#5F6F52] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1"
                            >
                              <span>Book Slot</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. AUTH SCREEN */}
            {view === 'auth' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <AuthScreen onAuthSuccess={handleAuthSuccess} />
                <div className="text-center mt-4">
                  <button
                    onClick={() => setView('explorer')}
                    className="text-xs font-semibold text-[#7A8273] hover:text-[#5F6F52] transition-all cursor-pointer"
                  >
                    ← Back to Catalog Directory
                  </button>
                </div>
              </motion.div>
            )}

            {/* 3. BOOKING CHECKOUT FUNNEL */}
            {view === 'booking-tunnel' && activeProvider && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <BookingFunnel
                  provider={activeProvider}
                  services={activeServices}
                  currentUser={currentUser}
                  onBackToHome={handleReturnToCatalogClean}
                  onBookingSuccess={() => setView('my-bookings')}
                />
              </motion.div>
            )}

            {/* 4. PROVIDER DASHBOARD */}
            {view === 'dashboard' && currentUser && currentUser.role === 'provider' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Onboarding Wizard setup logic block (only prompts if provider lacks initial custom fields) */}
                {!currentUser.providerProfile?.bio || currentUser.providerProfile?.bio.includes('Professional service provider') ? (
                  <OnboardingWizard
                    user={currentUser}
                    onComplete={(updated) => {
                      setCurrentUser(updated);
                      // Onboarding completes successfully, reload directory lists
                      loadProvidersCatalog();
                      fetchNotificationsFeed();
                    }}
                  />
                ) : (
                  <ProviderDashboard
                    provider={currentUser}
                    onRefreshUser={(updated) => setCurrentUser(updated)}
                  />
                )}
              </motion.div>
            )}

            {/* 5. CLIENT BOOKINGS INVENTORY VIEW */}
            {view === 'my-bookings' && currentUser && currentUser.role === 'client' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-4xl mx-auto space-y-6 text-left"
              >
                <div className="bg-white border border-[#E8E6DF] p-6 rounded-3xl text-left shadow-[0_4px_20px_rgba(44,51,39,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-base font-bold text-[#2C3327]">Your Scheduled Appointments</h3>
                    <p className="text-xs text-[#7A8273] mt-0.5">Below is a list of your past and upcoming session slots.</p>
                  </div>
                  <button
                    onClick={handleReturnToCatalogClean}
                    className="text-xs bg-[#2C3327] hover:bg-[#1f241c] text-white font-semibold rounded-xl px-4 py-2.5 transition-all cursor-pointer"
                  >
                    ← Browse more Practitioners
                  </button>
                </div>

                {clientBookingsLoading ? (
                  <div className="p-8 text-center bg-[#F0F2ED]/50 rounded-xl text-[#7A8273] font-mono text-xs animate-pulse">
                    Retrieving scheduled sessions...
                  </div>
                ) : clientBookings.length === 0 ? (
                  <div className="p-12 text-center bg-white border border-[#E8E6DF] rounded-3xl text-[#7A8273]">
                    <p className="text-4xl mb-2">📅</p>
                    <p className="text-sm font-semibold">You don't have any scheduled appointments.</p>
                    <button
                      onClick={handleReturnToCatalogClean}
                      className="mt-4 text-xs font-bold text-[#5F6F52] hover:underline cursor-pointer"
                    >
                      Book your first slot in directory catalog
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {clientBookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((b) => {
                      const matchProvider = providers.find((p) => p.id === b.providerId);
                      
                      return (
                        <div
                          key={b.id}
                          className="bg-white border border-[#E8E6DF] rounded-2xl p-5 hover:border-[#7A8273] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-xs text-[#7A8273] font-mono">ID: {b.id}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-mono font-bold tracking-wider ${
                                b.status === 'confirmed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : b.status === 'canceled'
                                    ? 'bg-rose-50 text-rose-500 border border-rose-100'
                                    : 'bg-amber-50 text-amber-600 border border-amber-200'
                              }`}>
                                {b.status}
                              </span>
                            </div>

                            <div className="space-y-0.5">
                              <h4 className="font-bold text-base text-[#2C3327]">
                                {matchProvider?.name || 'Professional Service Practitioner'}
                              </h4>
                              <p className="text-xs text-[#5F6F52] font-medium">
                                Niche: {matchProvider?.providerProfile?.industry || 'Service'}
                              </p>
                            </div>

                            <div className="flex items-center space-x-3 text-xs text-[#7A8273] font-mono pt-1">
                              <span>📅 Date: {b.date}</span>
                              <span>⏱️ Time: {cleanTime(b.startTime)} - {cleanTime(b.endTime)}</span>
                            </div>
                          </div>

                          {/* Cancellation Note feedback banner */}
                          <div className="text-right flex flex-col items-start sm:items-end justify-between gap-2.5">
                            {b.status === 'canceled' && (
                              <span className="max-w-xs text-left sm:text-right text-[11px] bg-rose-50 border border-rose-100 rounded-lg p-2 text-rose-700 font-medium leading-relaxed block">
                                Canceled reason details: "Our schedule shifted due to an emergent calendar block."
                              </span>
                            )}

                            <span className="text-xs font-mono font-semibold text-[#7A8273] block">
                              Booked on: {new Date(b.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </main>

      {/* Footer credits and fast developer diagnostic sandbox switcher */}
      <footer className="bg-white border-t border-[#E8E6DF] py-6 text-center text-xs text-[#7A8273] mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span>Universal Appointment Booking Web Application © 2026.</span>
            <span className="block sm:inline sm:ml-2 text-[10px] text-[#7A8273]/80 font-mono">Strict Double-Booking Isolation Engine Enabled</span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono bg-[#F0F2ED] p-2 border border-[#E8E6DF] rounded-2xl">
            <span className="font-bold text-[#5F6F52]">🔑 DEMO LOGINS:</span>
            <button
              onClick={async () => {
                const response = await api.registerLogin({ email: 'sarah@jenkins.com', role: 'provider', isRegister: false });
                setToken(response.token);
                handleAuthSuccess(response.user);
              }}
              className="text-[#2C3327] hover:text-white border border-[#E8E6DF] px-1.5 py-0.5 rounded cursor-pointer hover:bg-[#5F6F52]"
            >
              Dentist (Sarah)
            </button>
            <button
              onClick={async () => {
                const response = await api.registerLogin({ email: 'alex@rivera.com', role: 'provider', isRegister: false });
                setToken(response.token);
                handleAuthSuccess(response.user);
              }}
              className="text-[#2C3327] hover:text-white border border-[#E8E6DF] px-1.5 py-0.5 rounded cursor-pointer hover:bg-[#5F6F52]"
            >
              Yoga (Alex)
            </button>
            <button
              onClick={async () => {
                const response = await api.registerLogin({ email: 'emily@chen.com', role: 'provider', isRegister: false });
                setToken(response.token);
                handleAuthSuccess(response.user);
              }}
              className="text-[#2C3327] hover:text-white border border-[#E8E6DF] px-1.5 py-0.5 rounded cursor-pointer hover:bg-[#5F6F52]"
            >
              Dev (Emily)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );

  // Helper clean times
  function cleanTime(tStr: string) {
    const [h, m] = tStr.split(':').map(Number);
    const pm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${pm}`;
  }
}

