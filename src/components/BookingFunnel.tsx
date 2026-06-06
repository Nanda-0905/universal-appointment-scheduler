/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Clock, DollarSign, User as UserIcon, Mail, Phone, ChevronRight, CheckCircle, Sparkles, Notebook, ArrowLeft } from 'lucide-react';
import { User, Service, Booking } from '../types.js';
import { api } from '../api.js';

interface BookingFunnelProps {
  provider: User;
  services: Service[];
  currentUser: User | null;
  onBackToHome: () => void;
  onBookingSuccess: () => void;
}

export default function BookingFunnel({ provider, services, currentUser, onBackToHome, onBookingSuccess }: BookingFunnelProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [availableSlots, setAvailableSlots] = useState<Array<{ startTime: string; endTime: string }>>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>(''); // HH:MM
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  
  // Client details form
  const [clientName, setClientName] = useState(currentUser?.name || '');
  const [clientEmail, setClientEmail] = useState(currentUser?.email || '');
  const [clientPhone, setClientPhone] = useState(currentUser?.phone || '');
  const [clientNote, setClientNote] = useState('');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [errorSec, setErrorSec] = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Sync user state on load
  useEffect(() => {
    if (currentUser) {
      if (!clientName) setClientName(currentUser.name);
      if (!clientEmail) setClientEmail(currentUser.email);
      if (!clientPhone) setClientPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Generate next 14 booking days
  const getNext14Days = () => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateVal = String(d.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dateVal}`;
      
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const dayOfWeek = d.getDay(); // 0 = Sun, etc.

      const isWorkingDay = provider.providerProfile?.availability.days.includes(dayOfWeek);

      dates.push({
        dateString,
        dayName,
        dayNum,
        monthName,
        isWorkingDay
      });
    }
    return dates;
  };

  const bookingDays = getNext14Days();

  // Load available slots dynamically whenever selectedDate or selectedService changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      setLoadingSlots(true);
      setErrorSec('');
      setIsJoiningWaitlist(false);
      api.getAvailableSlots(provider.id, selectedDate, selectedService.id)
        .then((res) => {
          setAvailableSlots(res.slots);
          // Auto-select first slot if available
          if (res.slots.length > 0) {
            setSelectedSlot(res.slots[0].startTime);
          } else {
            setSelectedSlot('');
          }
        })
        .catch((err) => {
          setErrorSec('Failed to load slots: ' + err.message);
        })
        .finally(() => {
          setLoadingSlots(false);
        });
    }
  }, [selectedDate, selectedService]);

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSec('');
    if (!selectedService || !selectedDate) {
      setErrorSec('Please choose a service and date.');
      return;
    }
    if (!clientName || !clientEmail || !clientPhone) {
      setErrorSec('Please input your name, email, and phone contact details.');
      return;
    }

    setBookingLoading(true);
    try {
      await api.joinWaitlist({
        providerId: provider.id,
        serviceId: selectedService.id,
        clientId: currentUser?.id || null,
        clientName,
        clientEmail,
        clientPhone,
        clientNote,
        date: selectedDate
      });

      setStep(5); // Advance to waitlist success screen!
    } catch (err: any) {
      setErrorSec(err.message || 'Failed to join waitlist. Please check details.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorSec('');
    if (!selectedService || !selectedDate || !selectedSlot) {
      setErrorSec('Please finish choosing a service, date, and shift time.');
      return;
    }
    if (!clientName || !clientEmail || !clientPhone) {
      setErrorSec('Please input your name, email, and phone contact details.');
      return;
    }

    setBookingLoading(true);
    try {
      const booking = await api.createBooking({
        providerId: provider.id,
        serviceId: selectedService.id,
        clientId: currentUser?.id || null,
        clientName,
        clientEmail,
        clientPhone,
        clientNote,
        date: selectedDate,
        startTime: selectedSlot
      });

      setCreatedBooking(booking);
      setStep(4); // Advance to confirmed screen!
    } catch (err: any) {
      setErrorSec(err.message || 'Double Booking Error: The slot you selected is no longer available. Please select another slot.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Human clean time display
  const formatTimeStr = (hhmm: string) => {
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="max-w-2xl mx-auto my-6 bg-white border border-[#E8E6DF] rounded-3xl shadow-[0_12px_40px_rgba(44,51,39,0.04)] overflow-hidden text-left" id="booking-funnel">
      {/* Provider Details Header Hero banner */}
      <div className="bg-[#2C3327] text-white p-8 relative">
        <button
          onClick={onBackToHome}
          className="absolute left-6 top-6 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/10 text-xs flex items-center space-x-1.5 transition-all cursor-pointer font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Catalog</span>
        </button>

        <div className="pt-8">
          <div className="flex items-center space-x-2">
            <span className="bg-[#5F6F52]/60 border border-white/10 rounded-full text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 text-[#F8F7F3]">
              {provider.providerProfile?.industry}
            </span>
          </div>
          <h2 className="text-3xl font-serif font-bold mt-3 text-white tracking-tight">{provider.name}</h2>
          <p className="text-white/80 text-xs max-w-lg mt-2 leading-relaxed">
            {provider.providerProfile?.bio}
          </p>

          {/* Quick timeline layout indicators */}
          {(step === 1 || step === 2 || step === 3) && (
            <div className="flex items-center space-x-2.5 mt-6 border-t border-white/10 pt-5">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center space-x-1.5 text-xs text-white/50">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                    step >= num ? 'bg-[#5F6F52] text-white' : 'bg-white/10 text-white/40'
                  }`}>
                    {num}
                  </div>
                  <span className={step >= num ? 'text-[#F8F7F3] font-medium' : 'text-white/40'}>
                    {num === 1 ? 'Service' : num === 2 ? 'Schedule' : isJoiningWaitlist ? 'Waitlist' : 'Details'}
                  </span>
                  {num < 3 && <ChevronRight className="w-3 h-3 text-white/20" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-8">
        {errorSec && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-700 text-xs flex items-start space-x-2">
            <div className="text-sm">⚠️</div>
            <div>
              <span className="font-bold">Booking Error:</span> {errorSec}
            </div>
          </div>
        )}

        {/* STEP 1: Select Service */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#2C3327]">Step 1: Choose Your Wanted Appointment Service</h3>
              <p className="text-xs text-[#7A8273] mt-0.5">Please choose one of the professional programs offered below:</p>
            </div>

            <div className="space-y-3.5">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSelectedService(s)}
                  className={`p-4 border rounded-2xl text-left cursor-pointer transition-all flex items-start justify-between gap-4 ${
                    selectedService?.id === s.id
                      ? 'border-[#5F6F52] bg-[#F0F2ED]/40 ring-1 ring-[#5F6F52]'
                      : 'border-[#E8E6DF] hover:border-[#7A8273] bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-[#2C3327]">{s.name}</h4>
                    <p className="text-[11px] text-[#7A8273] leading-relaxed max-w-md">{s.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1 text-[10px] font-mono text-[#7A8273] bg-[#F0F2ED] px-2 py-0.5 border border-[#E8E6DF] rounded-md">
                        <Clock className="w-3 h-3 text-[#5F6F52]" />
                        <span>{s.duration} mins</span>
                      </div>
                      
                      <div className="flex items-center space-x-0.5 text-[10px] font-mono text-[#5F6F52] bg-[#F0F2ED] px-2 py-0.5 border border-[#E8E6DF] rounded-md">
                        <DollarSign className="w-3 h-3 text-[#A66E4E]" />
                        <span>{s.price === 0 ? 'Free/No Charge' : `$${s.price}`}</span>
                      </div>
                    </div>
                  </div>

                  <div className={`w-5 h-5 rounded-full flex items-center justify-center border font-semibold flex-shrink-0 mt-0.5 ${
                    selectedService?.id === s.id
                      ? 'border-[#5F6F52] bg-[#5F6F52] text-white'
                      : 'border-[#E8E6DF] bg-white'
                  }`}>
                    {selectedService?.id === s.id && '✓'}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (selectedService) {
                  // Pre-set first working date to make schedule loading fast!
                  const firstWorking = bookingDays.find(d => d.isWorkingDay);
                  if (firstWorking) setSelectedDate(firstWorking.dateString);
                  setStep(2);
                }
              }}
              disabled={!selectedService}
              className="w-full bg-[#5F6F52] hover:bg-[#4d5b43] text-white py-3.5 text-sm font-semibold rounded-xl flex items-center justify-center space-x-1 transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_rgba(95,111,82,0.15)]"
            >
              <span>Continue to Schedule</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Choose Date & Time slot */}
        {step === 2 && selectedService && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#2C3327]">Step 2: Selection Date & Shift Hour</h3>
              <p className="text-xs text-[#7A8273] mt-0.5">Showing slots for service program: <strong className="text-[#5F6F52]">{selectedService.name}</strong></p>
            </div>

            {/* Carousel calendar days block of next 14 days */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273] mb-2">Select Booking Date</label>
              <div className="flex space-x-2.5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin">
                {bookingDays.map((d) => (
                  <button
                    key={d.dateString}
                    type="button"
                    disabled={!d.isWorkingDay}
                    onClick={() => setSelectedDate(d.dateString)}
                    className={`w-14 h-20 rounded-2xl font-sans text-center transition-all flex flex-col justify-center items-center flex-shrink-0 snap-start border cursor-pointer ${
                      !d.isWorkingDay
                        ? 'opacity-30 bg-[#F0F2ED] border-[#E8E6DF] text-[#7A8273] hover:bg-[#F0F2ED]'
                        : selectedDate === d.dateString
                          ? 'border-[#5F6F52] bg-[#5F6F52] text-white shadow-lg shadow-[#5F6F52]/10 ring-2 ring-[#5F6F52] ring-offset-1'
                          : 'border-[#E8E6DF] hover:border-[#7A8273] bg-white text-[#2C3327]'
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider mb-1">{d.dayName}</span>
                    <span className="text-lg font-bold font-sans tracking-tight leading-none">{d.dayNum}</span>
                    <span className="text-[9px] mt-1 font-mono">{d.monthName}</span>
                    {!d.isWorkingDay && <span className="text-[8px] font-bold text-rose-600 mt-0.5">Closed</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Slot chips loading and listing */}
            <div>
              <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273] mb-3.5">Select Time Slot ({availableSlots.length} vacant)</label>

              {loadingSlots ? (
                <div className="p-8 text-center bg-[#F0F2ED]/50 border border-[#E8E6DF] rounded-2xl text-xs text-[#7A8273] flex items-center justify-center space-x-1.5 animate-pulse">
                  <span>Calculating provider working hours slots...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-6 text-left bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-900 text-xs space-y-3">
                  <div className="font-bold flex items-center space-x-1.5 text-[#8F5E24]">
                    <span className="text-sm">⚠️</span>
                    <span>Fully Booked / Unavailable</span>
                  </div>
                  <p className="text-[#4E3F30] leading-relaxed text-[11px]">
                    All standard time slots for <strong className="font-bold text-[#2C3327]">{selectedService.name}</strong> on <strong className="font-bold text-[#2C3327]">{selectedDate}</strong> are currently taken or blocked.
                  </p>
                  <div className="bg-white/90 border border-amber-100 p-4 rounded-xl space-y-2">
                    <span className="font-bold text-[#A66E4E] block text-[11px]">⏳ Join the Waitlist</span>
                    <span className="text-[#7A8273] block text-[10px] leading-relaxed">
                      If an appointment slot opens up on this date due to cancellation or schedule changes, we will instantly notify you so you can book.
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsJoiningWaitlist(true);
                        setStep(3);
                      }}
                      className="bg-[#5F6F52] hover:bg-[#4d5b43] text-white font-semibold rounded-lg px-3 py-1.5 transition-all text-[10px] font-sans inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Join Waitlist for {selectedDate}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => setSelectedSlot(slot.startTime)}
                        className={`py-3 rounded-xl text-xs font-mono font-medium border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#5F6F52] bg-[#5F6F52] text-white shadow-sm'
                            : 'border-[#E8E6DF] hover:border-[#7A8273] bg-white text-[#2C3327] hover:bg-[#F0F2ED]'
                        }`}
                      >
                        {formatTimeStr(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-[#F0F2ED] hover:bg-[#E8E6DF] text-[#2C3327] py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer border border-[#E8E6DF]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedSlot) setStep(3);
                }}
                disabled={!selectedSlot || loadingSlots}
                className="flex-1 bg-[#5F6F52] hover:bg-[#4d5b43] text-white py-3.5 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1 transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_12px_rgba(95,111,82,0.15)]"
              >
                <span>Enter Contact Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Input Client Details Form */}
        {step === 3 && selectedService && (
          <form onSubmit={isJoiningWaitlist ? handleJoinWaitlist : handleCreateBooking} className="space-y-6">
            <div className="border border-[#E8E6DF] bg-[#F0F2ED]/60 rounded-2xl p-4 flex items-center space-x-3 text-left">
              {isJoiningWaitlist ? (
                <>
                  <Clock className="w-5 h-5 text-[#5F6F52] flex-shrink-0" />
                  <div className="text-xs text-[#2C3327] leading-relaxed">
                    <span className="font-bold">Waitlist Registration:</span> You are joining the active waitlist. We will notify you immediately if any booking slot opens up.
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-[#A66E4E] flex-shrink-0 animate-pulse" />
                  <div className="text-xs text-[#2C3327] leading-relaxed">
                    <span className="font-bold">Reservation Lock:</span> Slots are reserved immediately once checked. Finalize details to complete the booking.
                  </div>
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Your Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Michael Scott"
                    className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="email"
                      required
                      placeholder="michael@domain.com"
                      className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Phone Number (Cell)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+1 555-092-2342"
                      className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Additional Inquiry Note (Optional)</label>
                <div className="relative">
                  <Notebook className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <textarea
                    rows={3}
                    placeholder="Provide any specific requests, details, or questions for this program..."
                    className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none resize-none"
                    value={clientNote}
                    onChange={(e) => setClientNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Quick booking program diagnostics */}
            <div className="p-4 bg-[#F0F2ED] border border-[#E8E6DF] rounded-2xl flex items-center justify-between text-xs mt-4">
              <div>
                <div className="font-semibold text-[#2C3327] text-sm">{selectedService.name} {isJoiningWaitlist ? '(Waitlist)' : ''}</div>
                <div className="text-[#7A8273] text-[11px] font-mono mt-0.5">
                  {isJoiningWaitlist ? (
                    <span>📅 {selectedDate} - Any Opening Time ({selectedService.duration}m)</span>
                  ) : (
                    <span>📅 {selectedDate} @ {formatTimeStr(selectedSlot)} ({selectedService.duration}m)</span>
                  )}
                </div>
              </div>
              <div className="font-bold text-[#A66E4E] font-mono text-sm bg-white border border-[#E8E6DF] px-2.5 py-1 rounded-xl">
                {selectedService.price === 0 ? 'Free' : `$${selectedService.price}`}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 bg-[#F0F2ED] hover:bg-[#E8E6DF] text-[#2C3327] py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer border border-[#E8E6DF]"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={bookingLoading}
                className="flex-1 bg-[#5F6F52] hover:bg-[#4d5b43] text-white py-3.5 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-[0_4px_12px_rgba(95,111,82,0.15)]"
              >
                <span>{bookingLoading ? 'Submitting request...' : isJoiningWaitlist ? 'Confirm Waitlist Registration' : 'Confirm Appointment Reservation'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Success confirmation screen */}
        {step === 4 && createdBooking && selectedService && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-6"
          >
            <div className="mx-auto w-16 h-16 bg-[#F0F2ED] border border-[#5F6F52] text-[#5F6F52] rounded-full flex items-center justify-center text-3xl font-bold">
              ✓
            </div>

            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-2xl font-serif font-bold text-[#2C3327] tracking-tight">Appointment Successfully Booked!</h3>
              <p className="text-xs text-[#5F6F52] font-mono bg-[#F0F2ED] max-w-sm mx-auto py-1 rounded-full border border-[#E8E6DF] mt-2.5 font-bold">
                Booking ID: {createdBooking.id}
              </p>
              <p className="text-xs text-[#7A8273] mt-2.5 leading-relaxed">
                We have generated a confirmed and pending-approval notification on our in-app dashboard. The provider will get back to you!
              </p>
            </div>

            {/* Confirmed Details card list */}
            <div className="bg-[#F0F2ED]/50 border border-[#E8E6DF] rounded-2xl p-6 text-left space-y-4 max-w-md mx-auto text-sm">
              <div className="flex justify-between items-start border-b border-[#E8E6DF] pb-3">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-mono text-[#7A8273]">Practitioner</span>
                  <strong className="text-[#2C3327]">{provider.name}</strong>
                  <span className="block text-[11px] text-[#7A8273]">{provider.providerProfile?.industry}</span>
                </div>
                <div className="bg-[#5F6F52] text-white rounded-lg px-2.5 py-1 text-xs font-mono uppercase font-bold">
                  {createdBooking.status}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#E8E6DF]">
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-mono text-[#7A8273]">Date</span>
                  <span className="font-semibold text-[#2C3327]">{selectedDate}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider font-mono text-[#7A8273]">Selected Time</span>
                  <span className="font-semibold text-[#2C3327]">{formatTimeStr(selectedSlot)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="block text-[10px] uppercase tracking-wider font-mono text-[#7A8273]">Requested Service</span>
                <div className="flex justify-between font-semibold text-[#2C3327]">
                  <span>{selectedService.name}</span>
                  <span className="font-mono text-[#A66E4E]">{selectedService.price === 0 ? 'Free' : `$${selectedService.price}`}</span>
                </div>
                <span className="block text-[11px] text-[#7A8273]">{selectedService.duration} minutes core program duration</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={onBackToHome}
                className="w-1/2 bg-[#F0F2ED] hover:bg-[#E8E6DF] text-[#2C3327] py-3 text-xs font-semibold rounded-xl transition-all cursor-pointer border border-[#E8E6DF]"
              >
                Return to Directory
              </button>
              <button
                type="button"
                onClick={onBookingSuccess}
                className="w-1/2 bg-[#5F6F52] hover:bg-[#4d5b43] text-white py-3 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-[0_2px_8px_rgba(95,111,82,0.15)]"
              >
                Go to Bookings
              </button>
            </div>
          </motion.div>
        )}

        {/* STEP 5: Waitlist reservation success */}
        {step === 5 && selectedService && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-6"
          >
            <div className="mx-auto w-16 h-16 bg-[#F0F2ED] border border-[#5F6F52] text-[#5F6F52] rounded-full flex items-center justify-center text-3xl font-bold">
              ⏳
            </div>

            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-2xl font-serif font-bold text-[#2C3327] tracking-tight">Successfully on Waitlist!</h3>
              <p className="text-xs text-[#7A8273] mt-2.5 leading-relaxed">
                You have been registered on the waitlist for <strong className="text-[#2C3327] font-semibold">{selectedService.name}</strong> on <strong className="text-[#2C3327] font-semibold">{selectedDate}</strong>.
              </p>
              <p className="text-xs text-[#7A8273] mt-1 leading-relaxed">
                If an appointment slot opens up on this date, we will immediately send you a notification.
              </p>
            </div>

            <div className="bg-[#F0F2ED]/50 border border-[#E8E6DF] rounded-2xl p-5 text-left max-w-sm mx-auto text-xs space-y-2">
              <span className="block font-bold text-[#202919]">Waitlist Overview:</span>
              <div>
                <span className="text-[#7A8273]">Service Program:</span> <span className="font-semibold text-[#2C3327]">{selectedService.name}</span>
              </div>
              <div>
                <span className="text-[#7A8273]">Wanted Date:</span> <span className="font-semibold text-[#2C3327]">{selectedDate}</span>
              </div>
              <div>
                <span className="text-[#7A8273]">Your Email:</span> <span className="font-semibold text-[#2C3327]">{clientEmail}</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center pt-2 max-w-sm mx-auto">
              <button
                type="button"
                onClick={onBackToHome}
                className="w-full bg-[#5F6F52] hover:bg-[#4d5b43] text-white py-3 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-[0_2px_8px_rgba(95,111,82,0.15)]"
              >
                Return to Directory
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
