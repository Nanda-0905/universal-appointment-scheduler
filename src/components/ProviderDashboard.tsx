/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Clock, DollarSign, PlusCircle, Trash2, Edit3, Check, X, ShieldAlert, Link, Copy, Eye, Calendar, Sparkles, BellRing, ChevronRight, Settings } from 'lucide-react';
import { User, Service, Booking, BlockedTime } from '../types.js';
import { api } from '../api.js';

interface ProviderDashboardProps {
  provider: User;
  onRefreshUser: (updated: User) => void;
}

export default function ProviderDashboard({ provider, onRefreshUser }: ProviderDashboardProps) {
  const [activeTab, setActiveTab] = useState<'calendar' | 'services' | 'bookings' | 'settings' | 'waitlist'>('bookings');

  // Bookings list states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // Waitlist queue states
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  // Services CRUD states
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDur, setNewServiceDur] = useState(30);
  const [newServicePrice, setNewServicePrice] = useState(0);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  // Block periods states
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [blockedDate, setBlockedDate] = useState('');
  const [blockedAllDay, setBlockedAllDay] = useState(true);
  const [blockedStart, setBlockedStart] = useState('09:00');
  const [blockedEnd, setBlockedEnd] = useState('17:00');
  const [blockedLabel, setBlockedLabel] = useState('Medical Break / Personal');

  // Profile management states
  const [providerName, setProviderName] = useState(provider.name);
  const [providerUsername, setProviderUsername] = useState(provider.providerProfile?.username || '');
  const [providerBio, setProviderBio] = useState(provider.providerProfile?.bio || '');
  const [providerIndustry, setProviderIndustry] = useState(provider.providerProfile?.industry || '');

  // Booking action states
  const [cancelRes, setCancelRes] = useState('');
  const [cancelingBookingId, setCancelingBookingId] = useState<string | null>(null);
  const [reschedulingBookingId, setReschedulingBookingId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('09:00');

  // Utility feedback
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [dashboardError, setDashboardError] = useState('');
  const [dashboardSuccess, setDashboardSuccess] = useState('');

  // Calendar render helper state - current month visual
  const [calendarYear, setCalendarYear] = useState(2026);
  const [calendarMonth, setCalendarMonth] = useState(5); // June (0-indexed so 5 = June)
  const [selectedDayObj, setSelectedDayObj] = useState<string>(''); // YYYY-MM-DD

  // Load bookings, services, and blocked actions on load
  const loadDashboardData = async () => {
    setBookingsLoading(true);
    setServicesLoading(true);
    setWaitlistLoading(true);
    setDashboardError('');
    try {
      const bks = await api.getBookings({ userId: provider.id, role: 'provider' });
      setBookings(bks);

      const srvs = await api.getProviderServices(provider.id);
      setServices(srvs);

      const blks = await api.getBlockedTimes(provider.id);
      setBlockedTimes(blks);

      try {
        const wlist = await api.getWaitlist({ providerId: provider.id });
        setWaitlist(wlist);
      } catch (e) {
        console.error("Error fetching waitlist: ", e);
      }
    } catch (err: any) {
      setDashboardError('Failed to sync master dashboard data: ' + err.message);
    } finally {
      setBookingsLoading(false);
      setServicesLoading(false);
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [provider.id]);

  const handleCopyPublicLink = () => {
    const url = `${window.location.origin}/book/${provider.providerProfile?.username}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // 1. SERVICES CRUD
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setDashboardError('');
    setDashboardSuccess('');
    try {
      await api.createService({
        providerId: provider.id,
        name: newServiceName,
        duration: Number(newServiceDur),
        price: Number(newServicePrice),
        description: newServiceDesc
      });
      setShowAddService(false);
      setNewServiceName('');
      setNewServiceDur(30);
      setNewServicePrice(0);
      setNewServiceDesc('');
      setDashboardSuccess('Service created successfully!');
      loadDashboardData();
    } catch (err: any) {
      setDashboardError(err.message || 'Service creation failed.');
    }
  };

  const handleUpdateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    setDashboardError('');
    setDashboardSuccess('');
    try {
      await api.updateService(editingService.id, {
        name: editingService.name,
        duration: Number(editingService.duration),
        price: Number(editingService.price),
        description: editingService.description
      });
      setEditingService(null);
      setDashboardSuccess('Service updated successfully!');
      loadDashboardData();
    } catch (err: any) {
      setDashboardError(err.message || 'Service update failed.');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Delete this service program? This cannot be undone.')) return;
    setDashboardError('');
    setDashboardSuccess('');
    try {
      await api.deleteService(id);
      setDashboardSuccess('Service deleted successfully.');
      loadDashboardData();
    } catch (err: any) {
      setDashboardError(err.message);
    }
  };

  // 2. APPOINTMENTS CONTROL
  const handleBookingStatus = async (id: string, status: 'confirmed' | 'canceled', message?: string) => {
    setDashboardError('');
    setDashboardSuccess('');
    try {
      await api.updateBookingStatus(id, { status, note: message });
      setDashboardSuccess(`Booking marked as ${status}!`);
      setCancelingBookingId(null);
      setCancelRes('');
      loadDashboardData();
    } catch (err: any) {
      setDashboardError(err.message);
    }
  };

  const handleBookingReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingBookingId || !rescheduleDate || !rescheduleTime) return;
    setDashboardError('');
    setDashboardSuccess('');
    try {
      await api.rescheduleBooking(reschedulingBookingId, {
        date: rescheduleDate,
        startTime: rescheduleTime
      });
      setDashboardSuccess('Appointment rescheduled successfully.');
      setReschedulingBookingId(null);
      setRescheduleDate('');
      loadDashboardData();
    } catch (err: any) {
      setDashboardError(err.message || 'Rescheduling overlap detected with another booking.');
    }
  };

  // 3. BLOCKED TIMES
  const handleCreateBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockedDate || !blockedLabel) {
      setDashboardError('Please provide both date and Label for blocked period.');
      return;
    }
    setDashboardError('');
    setDashboardSuccess('');
    try {
      await api.addBlockedTime(provider.id, {
        date: blockedDate,
        allDay: blockedAllDay,
        startTime: blockedStart,
        endTime: blockedEnd,
        label: blockedLabel
      });
      setBlockedDate('');
      setBlockedLabel('Medical Break / Personal');
      setDashboardSuccess('Blocked time added to schedules!');
      loadDashboardData();
    } catch (err: any) {
      setDashboardError(err.message);
    }
  };

  const handleDeleteBlocked = async (id: string) => {
    setDashboardError('');
    try {
      await api.deleteBlockedTime(id);
      setDashboardSuccess('Lock removed from calendar.');
      loadDashboardData();
    } catch (err: any) {
      setDashboardError(err.message);
    }
  };

  // 4. SETTINGS
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setDashboardError('');
    setDashboardSuccess('');
    try {
      const updated = await api.updateProviderProfile(provider.id, {
        name: providerName,
        industry: providerIndustry,
        bio: providerBio,
        username: providerUsername,
        availability: provider.providerProfile?.availability
      });
      setDashboardSuccess('Provider profile updated successfully!');
      onRefreshUser(updated);
    } catch (err: any) {
      setDashboardError(err.message);
    }
  };

  // Human pretty times
  const cleanTime = (tStr: string) => {
    const [h, m] = tStr.split(':').map(Number);
    const pm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${pm}`;
  };

  // Render high-contrast monthly grid calendar
  const getDaysInMonthGrid = (year: number, month: number) => {
    const dates = [];
    const firstDay = new Date(year, month, 1).getDay(); // day of week
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Padding empty days before 1st of month
    for (let i = 0; i < firstDay; i++) {
      dates.push(null);
    }

    // Days in current selection
    for (let d = 1; d <= totalDays; d++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dates.push(dateString);
    }

    return dates;
  };

  const monthlyDays = getDaysInMonthGrid(calendarYear, calendarMonth);
  const selectedDayBookings = bookings.filter(b => b.date === selectedDayObj && b.status !== 'canceled');
  const selectedDayBlocks = blockedTimes.filter(b => b.date === selectedDayObj);

  return (
    <div className="max-w-6xl mx-auto my-6 px-4" id="provider-dashboard">
      
      {/* Banner / Header details */}
      <div className="bg-[#F0F2ED] rounded-3xl p-6 mb-6 border border-[#E8E6DF] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-left">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#5F6F52] text-white font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
              {provider.providerProfile?.industry}
            </span>
            <span className="text-xs text-[#7A8273] font-mono">Merchant Studio</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#2C3327] mt-1">{provider.name} Dashboard</h2>
          <p className="text-xs text-[#7A8273] max-w-sm">Manage your appointment calendars, update your program CRUD listings, block shifts, and accept client slots.</p>
        </div>

        {/* Dashboard shortcut link widgets */}
        <div className="flex items-center bg-white border border-[#E8E6DF] rounded-2xl p-2 shadow-sm space-x-4">
          <div className="text-right">
            <span className="block text-[10px] uppercase font-mono text-gray-400">Shareable URL</span>
            <span className="text-xs font-mono font-medium text-gray-900">/book/{provider.providerProfile?.username}</span>
          </div>

          <div className="flex gap-1.5 border-l border-[#E8E6DF] pl-3">
            <button
              onClick={handleCopyPublicLink}
              className="p-2.5 rounded-xl text-[#7A8273] hover:text-[#5F6F52] bg-[#F0F2ED]/40 hover:bg-[#F0F2ED] border border-[#E8E6DF] transition-all cursor-pointer flex items-center space-x-1"
            >
              {copyFeedback ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-xs font-medium">Copy</span>
                </>
              )}
            </button>

            <a
              href={`/book/${provider.providerProfile?.username}`}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-xl text-[#7A8273] hover:text-[#5F6F52] bg-[#F0F2ED]/40 hover:bg-[#F0F2ED] border border-[#E8E6DF] transition-all flex items-center space-x-1"
            >
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">View</span>
            </a>
          </div>
        </div>
      </div>

      {dashboardError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs text-left">
          ⚠️ {dashboardError}
        </div>
      )}
      {dashboardSuccess && (
        <div className="mb-6 p-4 bg-[#F0F2ED] border border-[#5F6F52]/30 rounded-2xl text-[#2C3327] text-xs text-left font-semibold">
          ✓ {dashboardSuccess}
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex border-b border-[#E8E6DF] mb-6 font-semibold bg-[#F0F2ED]/45 p-1.5 rounded-2xl border">
        <button
          onClick={() => {
            setActiveTab('bookings');
            setDashboardError('');
            setDashboardSuccess('');
          }}
          className={`flex-1 py-3 text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'bookings'
              ? 'bg-[#5F6F52] text-white shadow-sm shadow-[#5F6F52]/10'
              : 'text-[#7A8273] hover:text-[#2C3327]'
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Bookings Inbox ({bookings.filter(b => b.status === 'pending').length} pending)</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('calendar');
            setDashboardError('');
            setDashboardSuccess('');
          }}
          className={`flex-1 py-3 text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'calendar'
              ? 'bg-[#5F6F52] text-white shadow-sm shadow-[#5F6F52]/10'
              : 'text-[#7A8273] hover:text-[#2C3327]'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Agenda & Blockout</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('services');
            setDashboardError('');
            setDashboardSuccess('');
          }}
          className={`flex-1 py-3 text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'services'
              ? 'bg-[#5F6F52] text-white shadow-sm shadow-[#5F6F52]/10'
              : 'text-[#7A8273] hover:text-[#2C3327]'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Service CRUD</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('waitlist');
            setDashboardError('');
            setDashboardSuccess('');
          }}
          className={`flex-1 py-3 text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'waitlist'
              ? 'bg-[#5F6F52] text-white shadow-sm shadow-[#5F6F52]/10'
              : 'text-[#7A8273] hover:text-[#2C3327]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Waitlist Queue ({waitlist.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            setDashboardError('');
            setDashboardSuccess('');
          }}
          className={`flex-1 py-3 text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'settings'
              ? 'bg-[#5F6F52] text-white shadow-sm shadow-[#5F6F52]/10'
              : 'text-[#7A8273] hover:text-[#2C3327]'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Business Info</span>
        </button>
      </div>

      <div className="min-h-[450px]">
        {/* TABS 1: BOOKINGS LIST */}
        {activeTab === 'bookings' && (
          <div className="bg-white border border-gray-150 rounded-2xl p-6 text-left space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
              <div>
                <h3 className="text-base font-bold text-gray-900">Inbox & Pending Requests</h3>
                <p className="text-xs text-gray-400 mt-0.5">Approve, cancel, or reschedule client appointments.</p>
              </div>
              <button
                onClick={loadDashboardData}
                disabled={bookingsLoading}
                className="text-xs bg-white hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 font-semibold text-gray-750 transition-all cursor-pointer"
              >
                {bookingsLoading ? 'Refreshing...' : '🔄 Sync List'}
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <p className="text-4xl mb-2">📅</p>
                <p className="text-sm font-medium">You don't have any client appointments booked yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-sm text-left divide-y divide-gray-100">
                  <thead className="bg-gray-50 text-[10px] uppercase font-mono tracking-wider text-gray-500">
                    <tr>
                      <th className="px-5 py-3">Client details</th>
                      <th className="px-5 py-3">Service program</th>
                      <th className="px-5 py-3">Slot/Date</th>
                      <th className="px-5 py-3">Price</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {bookings.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((b) => {
                      const correlatedService = services.find(s => s.id === b.serviceId);
                      const isCanceling = cancelingBookingId === b.id;
                      const isRescheduling = reschedulingBookingId === b.id;

                      return (
                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <strong className="block text-gray-800 font-semibold">{b.clientName}</strong>
                            <span className="block text-[11px] text-gray-400 font-mono">{b.clientEmail}</span>
                            <span className="block text-[11px] text-gray-400 font-mono">{b.clientPhone}</span>
                            {b.clientNote && (
                              <span className="block text-xs text-[#5F6F52] bg-[#F0F2ED] font-medium p-1.5 rounded-lg border border-[#E8E6DF] mt-1 max-w-xs">
                                💬 Node: "{b.clientNote}"
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-gray-800">{correlatedService?.name || 'Standard Service'}</span>
                            <span className="block text-xs font-mono text-gray-400">{correlatedService?.duration || b.endTime}m program</span>
                          </td>
                          <td className="px-5 py-4 font-mono font-medium text-xs">
                            <span className="block text-gray-900 font-bold">{b.date}</span>
                            <span className="block text-gray-500 mt-0.5">⏱️ {cleanTime(b.startTime)} - {cleanTime(b.endTime)}</span>
                          </td>
                          <td className="px-5 py-4 font-semibold text-xs font-mono text-emerald-700">
                            {correlatedService?.price === 0 ? 'Free' : `$${correlatedService?.price || 0}`}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold tracking-wider inline-block ${
                              b.status === 'confirmed'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : b.status === 'canceled'
                                  ? 'bg-rose-50 text-rose-500 border border-rose-100'
                                  : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {/* Actions block handles confirmations/cancellations inline */}
                            {!isCanceling && !isRescheduling ? (
                              <div className="flex gap-1.5 justify-end">
                                {b.status === 'pending' && (
                                  <button
                                    onClick={() => handleBookingStatus(b.id, 'confirmed')}
                                    className="p-1 px-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center space-x-1 cursor-pointer transition-all"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>
                                )}

                                {b.status !== 'canceled' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setReschedulingBookingId(b.id);
                                        setRescheduleDate(b.date);
                                        setRescheduleTime(b.startTime);
                                      }}
                                      className="p-1 px-2 text-xs bg-white hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg flex items-center space-x-1 cursor-pointer transition-all"
                                    >
                                      <span>Reschedule</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => setCancelingBookingId(b.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-all"
                                      title="Cancel Booking"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            ) : isCanceling ? (
                              <div className="space-y-1.5 max-w-xs ml-auto">
                                <input
                                  type="text"
                                  placeholder="Cancellation reason notes..."
                                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none"
                                  value={cancelRes}
                                  onChange={(e) => setCancelRes(e.target.value)}
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleBookingStatus(b.id, 'canceled', cancelRes)}
                                    className="bg-rose-600 text-white text-[11px] rounded px-2 py-1 font-bold cursor-pointer"
                                  >
                                    Confirm Cancel
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCancelingBookingId(null);
                                      setCancelRes('');
                                    }}
                                    className="bg-gray-100 text-gray-600 text-[11px] rounded px-2 py-1 font-bold cursor-pointer"
                                  >
                                    Dismiss
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // Inline Reschedule picker form
                              <form onSubmit={handleBookingReschedule} className="space-y-2 max-w-xs ml-auto text-left bg-gray-50 p-2 border border-gray-200 rounded-xl">
                                <div>
                                  <label className="block text-[10px] text-gray-500 font-bold">New Date</label>
                                  <input
                                    type="date"
                                    required
                                    className="w-full border border-gray-200 text-xs rounded px-1.5 py-1"
                                    value={rescheduleDate}
                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <div>
                                    <label className="block text-[10px] text-gray-500 font-bold">New Hour</label>
                                    <input
                                      type="time"
                                      required
                                      className="w-full border border-gray-200 text-xs rounded px-1.5 py-1"
                                      value={rescheduleTime}
                                      onChange={(e) => setRescheduleTime(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-1 items-end justify-end">
                                    <button
                                      type="submit"
                                      className="p-1 px-2 text-[11px] bg-[#5F6F52] hover:bg-[#4d5b43] text-white rounded font-bold cursor-pointer"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setReschedulingBookingId(null)}
                                      className="p-1 px-1 text-[11px] bg-gray-200 text-gray-500 rounded font-bold cursor-pointer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              </form>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CALENDAR AGENDA VIEW */}
        {activeTab === 'calendar' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {/* The Monthly agenda selector calendar */}
            <div className="bg-white border border-gray-150 rounded-2xl p-6 md:col-span-2 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="font-bold text-sm text-gray-900">Agenda Picker</h3>
                
                <div className="flex items-center space-x-1 bg-gray-50 p-1 border rounded-lg text-xs font-mono">
                  <button
                    onClick={() => {
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    }}
                    className="p-1.5 rounded hover:bg-white border border-transparent hover:border-gray-150 cursor-pointer"
                  >
                    ◀
                  </button>
                  <span className="px-2 font-bold select-none text-gray-800">
                    {new Date(calendarYear, calendarMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
                      }
                    }}
                    className="p-1.5 rounded hover:bg-white border border-transparent hover:border-gray-150 cursor-pointer"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Day matrix calendar layout */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-gray-400">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {monthlyDays.map((dateStr, idx) => {
                  if (!dateStr) {
                    return <div key={`empty-${idx}`} className="h-14 bg-gray-50/50 rounded-xl" />;
                  }

                  const parts = dateStr.split('-');
                  const dNum = parseInt(parts[2], 10);
                  const isToday = new Date().toISOString().split('T')[0] === dateStr;

                  // Find correlated day details
                  const dBookings = bookings.filter(b => b.date === dateStr && b.status !== 'canceled');
                  const dBlocked = blockedTimes.filter(b => b.date === dateStr);
                  const hasServices = dBookings.length > 0;
                  const isBlocked = dBlocked.length > 0;

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => setSelectedDayObj(dateStr)}
                      className={`h-14 rounded-xl text-left p-1.5 relative transition-all border cursor-pointer ${
                        selectedDayObj === dateStr
                          ? 'border-[#5F6F52] bg-[#F0F2ED]/40 ring-1 ring-[#5F6F52]'
                          : isToday
                            ? 'border-emerald-500 bg-emerald-50/10'
                            : 'border-[#E8E6DF] hover:border-[#7A8273] bg-white'
                      }`}
                    >
                      <span className={`text-xs font-bold leading-none ${isToday ? 'text-emerald-700 font-mono': 'text-[#2C3327]'}`}>{dNum}</span>

                      {/* Small activity indicators */}
                      <div className="absolute bottom-2 left-2 flex gap-1">
                        {hasServices && (
                          <span className="w-1.5 h-1.5 bg-[#5F6F52] rounded-full" title={`${dBookings.length} booking(s)`} />
                        )}
                        {isBlocked && (
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" title={`${dBlocked.length} block(s)`} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar actions: agenda detail OR block custom day out */}
            <div className="space-y-6">
              {/* Day diagnostic agenda details */}
              {selectedDayObj ? (
                <div className="bg-white border border-[#E8E6DF] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-[#7A8273]">📅 {selectedDayObj}</span>
                    <button
                      onClick={() => setSelectedDayObj('')}
                      className="text-xs text-[#5F6F52] hover:text-[#4d5b43] font-bold"
                    >
                      Close details
                    </button>
                  </div>

                  {selectedDayBookings.length === 0 && selectedDayBlocks.length === 0 ? (
                    <p className="text-xs text-[#7A8273] py-4 text-center">No bookings or blocks scheduled on this day.</p>
                  ) : (
                    <div className="space-y-3 max-h-56 overflow-y-auto">
                      {selectedDayBookings.map(b => (
                        <div key={b.id} className="p-2.5 border border-[#E8E6DF] bg-[#F0F2ED]/30 rounded-lg text-xs">
                          <span className="block font-bold text-[#2C3327] font-sans">{b.clientName}</span>
                          <span className="block text-[10px] text-[#7A8273] font-mono mt-0.5">⏱️ {cleanTime(b.startTime)} - {cleanTime(b.endTime)}</span>
                          <span className="block text-[10px] text-[#5F6F52] bg-white px-2 py-0.5 border rounded border-[#E8E6DF] mt-1 inline-block">
                            {services.find(s=>s.id === b.serviceId)?.name || 'Consultation'}
                          </span>
                        </div>
                      ))}

                      {selectedDayBlocks.map(blk => (
                        <div key={blk.id} className="p-2.5 border border-rose-100 bg-rose-50/10 rounded-lg text-xs flex justify-between items-center">
                          <div>
                            <span className="block font-bold text-rose-950">{blk.label}</span>
                            <span className="block text-[10px] text-rose-500 font-mono mt-0.5">
                              {blk.allDay ? 'All Day Locked' : `⏱️ ${blk.startTime} - ${blk.endTime}`}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteBlocked(blk.id)}
                            className="text-rose-600 hover:text-rose-900 border font-mono text-[9px] bg-white rounded p-1"
                          >
                            unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border rounded-2xl text-xs text-center text-gray-400 leading-relaxed">
                  Click on any day card in the monthly grid to inspect active appointments or dismiss localized shift blocks.
                </div>
              )}

              {/* Blockout Form */}
              <form onSubmit={handleCreateBlocked} className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 text-left">
                <div className="flex items-center space-x-2 border-b border-gray-100 pb-2">
                  <div className="p-1 rounded bg-rose-100 text-rose-600">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Lock Calendar Hours</h4>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-gray-400">Locked Date</label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-200 text-xs rounded-xl px-3 py-2"
                    value={blockedDate}
                    onChange={(e) => setBlockedDate(e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] uppercase tracking-wider font-mono text-gray-400">Lock Description / Reason</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-200 text-xs rounded-xl px-3 py-2"
                    placeholder="e.g. Lunch slot / Family Vacation"
                    value={blockedLabel}
                    onChange={(e) => setBlockedLabel(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="font-semibold text-gray-600">Lock entire day?</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 border-gray-300 rounded focus:ring-rose-500"
                    checked={blockedAllDay}
                    onChange={(e) => setBlockedAllDay(e.target.checked)}
                  />
                </div>

                {!blockedAllDay && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="grid grid-cols-2 gap-2"
                  >
                    <div>
                      <label className="block text-[10px] text-gray-400">Start Time</label>
                      <input
                        type="time"
                        className="w-full border border-gray-200 text-xs rounded-lg p-1.5"
                        value={blockedStart}
                        onChange={(e) => setBlockedStart(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400">End Time</label>
                      <input
                        type="time"
                        className="w-full border border-gray-200 text-xs rounded-lg p-1.5"
                        value={blockedEnd}
                        onChange={(e) => setBlockedEnd(e.target.value)}
                      />
                    </div>
                  </motion.div>
                )}

                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl py-2.5 transition-all text-center cursor-pointer"
                >
                  Apply Blockout Lock
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TABS 3: SERVICES CRUD MANAGER */}
        {activeTab === 'services' && (
          <div className="bg-white border border-gray-150 rounded-2xl p-6 text-left space-y-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
              <div>
                <h3 className="text-base font-bold text-gray-900">Manage Your Service Program Portfolio</h3>
                <p className="text-xs text-gray-400 mt-0.5">Define custom service portfolios, durations, descriptions, and fee structures.</p>
              </div>
              <button
                onClick={() => setShowAddService(!showAddService)}
                className="text-xs font-semibold bg-[#5F6F52] hover:bg-[#4d5b43] text-white rounded-lg px-3 py-1.5 flex items-center space-x-1 cursor-pointer transition-all"
              >
                <span>{showAddService ? '✕ Close Form' : '＋ Add Program'}</span>
              </button>
            </div>

            {/* service addition form */}
            {showAddService && (
              <motion.form
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleCreateService}
                className="p-5 border border-[#E8E6DF] rounded-2xl bg-[#F0F2ED]/25 space-y-4 max-w-xl"
              >
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Service Program Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Standard Audit Review"
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:border-[#5F6F52] focus:outline-none"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Duration</label>
                    <select
                      className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:border-[#5F6F52] focus:outline-none"
                      value={newServiceDur}
                      onChange={(e) => setNewServiceDur(Number(e.target.value))}
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes (1 hr)</option>
                      <option value={90}>90 minutes (1.5 hrs)</option>
                      <option value={120}>120 minutes (2 hrs)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Service Fee ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0 for Free"
                      className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:border-[#5F6F52] focus:outline-none"
                      value={newServicePrice === 0 ? '' : newServicePrice}
                      onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Service Scope Description</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Provide details client expects from this service..."
                    className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-xs focus:border-[#5F6F52] focus:outline-none resize-none"
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="bg-[#5F6F52] hover:bg-[#4d5b43] text-white text-xs font-semibold rounded-xl px-4 py-2 text-center inline-block cursor-pointer"
                >
                  Launch Service Program
                </button>
              </motion.form>
            )}

            {/* active listing table */}
            {servicesLoading ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl text-gray-500 font-mono text-xs animate-pulse">
                Syncing active listings...
              </div>
            ) : services.length === 0 ? (
              <div className="p-8 bg-gray-100 rounded-xl text-center text-gray-400">
                You do not offer any services yet. Please click "Add Program" at the top to list your services.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((s) => (
                  <div key={s.id} className="p-5 border border-gray-150 rounded-2xl flex flex-col justify-between hover:border-gray-300 transition-all">
                    {editingService?.id === s.id ? (
                      /* Editing details block inside card */
                      <form onSubmit={handleUpdateService} className="space-y-3.5 text-left">
                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase">Name</label>
                          <input
                            type="text"
                            required
                            className="w-full border rounded px-2 py-1 text-xs"
                            value={editingService.name}
                            onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold uppercase">Duration</label>
                            <input
                              type="number"
                              required
                              className="w-full border rounded px-2 py-1 text-xs"
                              value={editingService.duration}
                              onChange={(e) => setEditingService({ ...editingService, duration: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400 font-bold uppercase">Fee ($)</label>
                            <input
                              type="number"
                              required
                              className="w-full border rounded px-2 py-1 text-xs"
                              value={editingService.price}
                              onChange={(e) => setEditingService({ ...editingService, price: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] text-gray-400 font-bold uppercase">Description</label>
                          <textarea
                            rows={2}
                            className="w-full border rounded px-2 py-1 text-xs"
                            value={editingService.description}
                            onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button type="submit" className="bg-[#5F6F52] hover:bg-[#4d5b43] text-white text-[11px] rounded px-3 py-1 cursor-pointer">Save Changes</button>
                          <button type="button" onClick={() => setEditingService(null)} className="bg-gray-100 text-gray-600 text-[11px] border rounded px-3 py-1 cursor-pointer">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      /* Display standard card details */
                      <>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm text-[#2C3327]">{s.name}</h4>
                            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-100">
                              {s.price === 0 ? 'Free' : `$${s.price}`}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
                          <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 font-mono pt-1">
                            <Clock className="w-3.5 h-3.5 text-[#5F6F52]" />
                            <span>{s.duration} minutes active duration</span>
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5 border-t border-gray-100 pt-3.5 mt-4">
                          <button
                            onClick={() => setEditingService(s)}
                            className="p-1.5 rounded-lg border border-gray-205 text-gray-600 hover:text-[#5F6F52] bg-white hover:bg-gray-50 cursor-pointer flex items-center space-x-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteService(s.id)}
                            className="p-1.5 rounded-lg border border-gray-205 text-rose-650 hover:bg-rose-50 cursor-pointer flex items-center space-x-1"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[11px] text-rose-600">Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TABS: WAITLIST QUEUE LIST */}
        {activeTab === 'waitlist' && (
          <div className="bg-white border border-[#E8E6DF] rounded-2xl p-6 text-left space-y-6">
            <div className="flex justify-between items-center bg-[#F0F2ED] p-4 rounded-xl border border-[#E8E6DF]">
              <div>
                <h3 className="text-base font-serif font-bold text-[#2C3327]">Client Waitlist Queue</h3>
                <p className="text-xs text-[#7A8273] mt-0.5">Tracking clients requesting automated notifications for fully booked dates.</p>
              </div>
              <button
                onClick={loadDashboardData}
                disabled={waitlistLoading}
                className="text-xs bg-white hover:bg-gray-100 border border-gray-250 rounded-lg px-3 py-1.5 font-semibold text-gray-700 transition-all cursor-pointer"
              >
                {waitlistLoading ? 'Refreshing...' : '🔄 Sync Waitlist'}
              </button>
            </div>

            {waitlist.length === 0 ? (
              <div className="p-12 text-center text-[#7A8273] bg-[#F0F2ED]/25 rounded-2xl border border-dashed border-[#E8E6DF]">
                <p className="text-4xl mb-3">⏳</p>
                <p className="text-sm font-medium text-[#2C3327]">Nobody is currently on your schedule's waitlist.</p>
                <p className="text-xs text-[#7A8273] mt-1">When clients find fully booked days on your catalog, they can register waitlist alerts here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E8E6DF] rounded-xl bg-white">
                <table className="w-full text-sm text-left divide-y divide-gray-100">
                  <thead className="bg-[#F0F2ED] text-[10px] uppercase font-mono tracking-wider text-[#7A8273]">
                    <tr>
                      <th className="px-5 py-3">Client Information</th>
                      <th className="px-5 py-3">Wanted Service</th>
                      <th className="px-5 py-3">Date Requested</th>
                      <th className="px-5 py-3">Registered on</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-[#2C3327]">
                    {waitlist.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((w) => {
                      const correlatedService = services.find(s => s.id === w.serviceId);
                      return (
                        <tr key={w.id} className="hover:bg-gray-50/50">
                          <td className="px-5 py-4">
                            <div className="font-semibold">{w.clientName}</div>
                            <div className="text-xs text-gray-400 font-mono">{w.clientEmail}</div>
                            {w.clientPhone && <div className="text-[11px] text-gray-400 font-mono">{w.clientPhone}</div>}
                          </td>
                          <td className="px-5 py-4 font-semibold text-[#5F6F52]">
                            {correlatedService?.name || 'Appointment program'}
                          </td>
                          <td className="px-5 py-4 font-mono font-semibold text-xs">
                            {w.date}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-gray-400">
                            {new Date(w.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4">
                            <span className="bg-amber-50 text-amber-800 border border-amber-100 rounded-full text-[10px] font-mono px-2.5 py-1 uppercase font-bold">
                              Waiting Spot
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TABS 4: BUSINESS PROFILE UPDATE */}
        {activeTab === 'settings' && (
          <div className="bg-white border border-[#E8E6DF] rounded-2xl p-6 text-left max-w-xl mx-auto">
            <h3 className="text-base font-serif font-bold text-[#2C3327] border-b border-gray-100 pb-3 mb-6">Business Profile & Scheduling Configuration</h3>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Business Display Name</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5F6F52]"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Public Share Link URL Username</label>
                <div className="flex border border-gray-200 bg-white rounded-xl overflow-hidden text-sm">
                  <span className="bg-gray-50 text-gray-400 font-mono text-xs px-3.5 py-2.5 border-r">/book/</span>
                  <input
                    type="text"
                    required
                    className="flex-1 w-full px-4 focus:outline-none"
                    value={providerUsername}
                    onChange={(e) => setProviderUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, ''))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Industry / Niche Tag</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5F6F52]"
                  value={providerIndustry}
                  onChange={(e) => setProviderIndustry(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Business Description Bio</label>
                <textarea
                  rows={4}
                  className="w-full border border-gray-200 bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#5F6F52] resize-none"
                  value={providerBio}
                  onChange={(e) => setProviderBio(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#5F6F52] hover:bg-[#4d5b43] text-white rounded-xl py-3 text-xs font-semibold tracking-wide transition-all cursor-pointer"
              >
                Save Business Profile Details
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
