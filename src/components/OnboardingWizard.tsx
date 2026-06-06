/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, Clock, DollarSign, ArrowRight, Briefcase } from 'lucide-react';
import { User, Availability } from '../types.js';
import { api } from '../api.js';

interface OnboardingWizardProps {
  user: User;
  onComplete: (updatedUser: User) => void;
}

const NICHES = [
  { id: 'healthcare', label: 'Healthcare & Dentistry', icon: '🩺' },
  { id: 'fitness', label: 'Fitness & Yoga', icon: '🧘' },
  { id: 'tech', label: 'Tech & Consulting', icon: '💻' },
  { id: 'beauty', label: 'Barber & Salon', icon: '✂️' },
  { id: 'tutoring', label: 'Education & Tutoring', icon: '🎓' },
  { id: 'other', label: 'Custom Business Niche', icon: '✨' },
];

const DAYS_OF_WEEK = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
];

export default function OnboardingWizard({ user, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Industry / Bio
  const [selectedNiche, setSelectedNiche] = useState('healthcare');
  const [customIndustry, setCustomIndustry] = useState('');
  const [bio, setBio] = useState('');
  const [customUrl, setCustomUrl] = useState(
    user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  );

  // Step 2: Availability
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [hasBreak, setHasBreak] = useState(true);
  const [breakStartTime, setBreakStartTime] = useState('12:00');
  const [breakEndTime, setBreakEndTime] = useState('13:00');

  // Step 3: Service
  const [serviceName, setServiceName] = useState('Initial Consultation');
  const [serviceDur, setServiceDur] = useState(30);
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceDesc, setServiceDesc] = useState('Our kickoff onboarding and strategy alignment session.');

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setError('');
    try {
      const finalIndustry = selectedNiche === 'other' ? customIndustry : NICHES.find(n => n.id === selectedNiche)?.label || 'Consulting';
      const availability: Availability = {
        days: selectedDays,
        startTime,
        endTime,
        ...(hasBreak ? { breakStartTime, breakEndTime } : {}),
      };

      // 1. Update Profile info
      const updatedUser = await api.updateProviderProfile(user.id, {
        name: user.name,
        industry: finalIndustry,
        bio: bio || `Elite certified professional in ${finalIndustry}`,
        availability,
        username: customUrl || user.id.slice(-6),
      });

      // 2. Create Their First Service
      await api.createService({
        providerId: user.id,
        name: serviceName,
        duration: Number(serviceDur),
        price: Number(servicePrice),
        description: serviceDesc,
      });

      onComplete(updatedUser);
    } catch (err: any) {
      setError(err.message || 'Onboarding failed to save. Please review input options.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-8 bg-white border border-[#E8E6DF] rounded-3xl shadow-[0_12px_40px_rgba(44,51,39,0.04)] overflow-hidden" id="onboarding-wizard">
      {/* Header and indicator */}
      <div className="bg-[#2C3327] px-8 py-8 text-white relative text-left">
        <div className="absolute top-4 right-4 flex items-center bg-white/10 border border-white/10 rounded-full px-3 py-1 text-xs text-[#F8F7F3] font-mono">
          <Sparkles className="w-3.5 h-3.5 mr-1 animate-pulse text-[#A66E4E]" />
          Setup Wizard
        </div>
        <h2 className="text-3xl font-serif tracking-tight font-bold text-white">Business Onboarding</h2>
        <p className="text-white/80 text-sm mt-1">Configure your booking links in just three steps.</p>

        {/* Level meter */}
        <div className="flex items-center space-x-2 mt-6">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step >= num ? 'bg-[#5F6F52] w-12' : 'bg-white/10 w-4'
              }`}
            />
          ))}
          <span className="text-xs text-white/45 font-mono ml-auto">Step {step} of 3</span>
        </div>
      </div>

      <div className="p-8 text-left">
        {error && (
          <div className="mb-6 p-4 bg-rose-50 text-rose-700 text-sm rounded-xl border border-rose-100 flex items-center space-x-2">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Step 1: Industry / Username */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider mb-2">Select Your Specialization</label>
              <div className="grid grid-cols-2 gap-3">
                {NICHES.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      setSelectedNiche(n.id);
                      if (n.id !== 'other') setCustomIndustry('');
                    }}
                    className={`flex items-center space-x-3 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedNiche === n.id
                        ? 'border-[#5F6F52] bg-[#F0F2ED]/60 text-[#2C3327] ring-1 ring-[#5F6F52]'
                        : 'border-[#E8E6DF] hover:border-[#7A8273] bg-white text-[#7A8273]'
                    }`}
                  >
                    <span className="text-2xl">{n.icon}</span>
                    <span className="text-sm font-bold">{n.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedNiche === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider">Custom Industry Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pet Groomer, Mobile Car Detailer"
                  className="w-full border border-[#E8E6DF] rounded-xl px-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                />
              </motion.div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider">Public Username URL</label>
              <div className="flex rounded-xl overflow-hidden border border-[#E8E6DF]">
                <span className="bg-[#F0F2ED] text-[#7A8273] text-xs px-3 py-2.5 flex items-center font-mono border-r border-[#E8E6DF]">
                  /book/
                </span>
                <input
                  type="text"
                  placeholder="custom-username"
                  className="flex-1 w-full px-4 py-2 text-sm text-[#2C3327] focus:outline-none"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, ''))}
                />
              </div>
              <p className="text-[11px] text-[#7A8273]">This forms your unique shareable appointment link.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider">Short Biography / Pitch</label>
              <textarea
                rows={3}
                placeholder="Help clients know what sets you apart..."
                className="w-full border border-[#E8E6DF] rounded-xl px-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={selectedNiche === 'other' && !customIndustry}
              className="w-full bg-[#5F6F52] hover:bg-[#4d5b43] text-white text-sm font-semibold rounded-xl py-3 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_4px_12px_rgba(95,111,82,0.15)]"
            >
              <span>Continue Setup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* Step 2: Working Hours availability setup */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider mb-2">Select Active Weekdays</label>
              <div className="flex justify-between items-center bg-[#F0F2ED]/50 p-2 rounded-2xl border border-[#E8E6DF]">
                {DAYS_OF_WEEK.map((d) => {
                  const isActive = selectedDays.includes(d.value);
                  return (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDay(d.value)}
                      className={`w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#5F6F52] text-white shadow-md shadow-[#5F6F52]/10'
                          : 'bg-white border border-[#E8E6DF] text-[#7A8273] hover:bg-[#F0F2ED]'
                      }`}
                    >
                      {d.label[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider mb-1.5">Shift Starts</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="time"
                    className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none bg-white"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider mb-1.5">Shift Ends</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
                  <input
                    type="time"
                    className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none bg-white"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="border border-[#E8E6DF] rounded-2xl p-4 bg-[#F0F2ED]/40 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-[#5F6F52]" />
                  <span className="text-sm font-semibold text-[#2C3327]">Middle Break Hours</span>
                </div>
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#5F6F52] border-[#E8E6DF] rounded focus:ring-[#5F6F52] focus:outline-none cursor-pointer"
                  checked={hasBreak}
                  onChange={(e) => setHasBreak(e.target.checked)}
                />
              </div>

              {hasBreak && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="grid grid-cols-2 gap-4 pt-1"
                >
                  <div>
                    <label className="block text-[11px] uppercase font-mono text-[#7A8273] tracking-wider mb-1">Break Start</label>
                    <input
                      type="time"
                      className="w-full border border-[#E8E6DF] rounded-xl px-3 py-2 text-sm bg-white text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                      value={breakStartTime}
                      onChange={(e) => setBreakStartTime(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-mono text-[#7A8273] tracking-wider mb-1">Break End</label>
                    <input
                      type="time"
                      className="w-full border border-[#E8E6DF] rounded-xl px-3 py-2 text-sm bg-white text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                      value={breakEndTime}
                      onChange={(e) => setBreakEndTime(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="w-1/3 bg-[#F0F2ED] hover:bg-[#E8E6DF] text-[#2C3327] text-sm font-semibold rounded-xl py-3 transition-all cursor-pointer border border-[#E8E6DF]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-[#5F6F52] hover:bg-[#4d5b43] text-white text-sm font-semibold rounded-xl py-3 flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(95,111,82,0.15)]"
              >
                <span>Define First Service</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Create Service Item to bind booking slots */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider">Service Name</label>
              <input
                type="text"
                placeholder="e.g. Initial Consultation, Custom Haircut"
                className="w-full border border-[#E8E6DF] rounded-xl px-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider mb-1.5">Duration</label>
                <select
                  className="w-full border border-[#E8E6DF] bg-white rounded-xl px-3 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none cursor-pointer"
                  value={serviceDur}
                  onChange={(e) => setServiceDur(Number(e.target.value))}
                >
                  <option value={15}>15 mins</option>
                  <option value={30}>30 mins</option>
                  <option value={45}>45 mins</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider mb-1.5">Service Fee ($)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for Free"
                    className="w-full border border-[#E8E6DF] rounded-xl pl-8 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none bg-white"
                    value={servicePrice === 0 ? '' : servicePrice}
                    onChange={(e) => setServicePrice(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs uppercase font-mono text-[#7A8273] tracking-wider">Brief Description</label>
              <textarea
                rows={3}
                placeholder="Describe what is involved in this service for clients..."
                className="w-full border border-[#E8E6DF] rounded-xl px-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none resize-none"
                value={serviceDesc}
                onChange={(e) => setServiceDesc(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="w-1/3 bg-[#F0F2ED] hover:bg-[#E8E6DF] text-[#2C3327] text-sm font-semibold rounded-xl py-3 transition-all cursor-pointer border border-[#E8E6DF]"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={loading || !serviceName}
                className="flex-1 bg-[#5F6F52] hover:bg-[#4d5b43] text-white text-sm font-semibold rounded-xl py-3 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_4px_12px_rgba(95,111,82,0.15)]"
              >
                {loading ? 'Creating business profile...' : 'Launch Booking Page!'}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
