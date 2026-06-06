/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, Lock, User as UserIcon, Sparkles, AlertCircle, ArrowRight, Smartphone } from 'lucide-react';
import { User } from '../types.js';
import { api, setToken } from '../api.js';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [method, setMethod] = useState<'email' | 'otp'>('email');
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<'client' | 'provider'>('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Email form fields
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState(''); // Simulated password

  // OTP/Phone fields
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [devOtpNotification, setDevOtpNotification] = useState(''); // Visual mock SMS alert

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.registerLogin({
        email,
        name: isRegister ? name : undefined,
        role,
        isRegister
      });
      setToken(response.token);
      onAuthSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError('');
    if (!phone) {
      setError('Phone number is required.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.sendOTP(phone);
      if (response.success) {
        setOtpSent(true);
        // Display the OTP code in a glowing developer SMS sandbox banner so the tester doesn't have to look at terminal!
        setDevOtpNotification(`[MOCK SMS SENDER] To: ${phone} - "Your booking verification code is: ${response.otp}"`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!otpCode) {
      setError('Please input the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.verifyOTP({
        phone,
        code: otpCode,
        name: isRegister ? name : undefined,
        role,
        isRegister
      });
      setToken(response.token);
      onAuthSuccess(response.user);
    } catch (err: any) {
      setError(err.message || 'Invalid verification OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-[#E8E6DF] shadow-[0_10px_35px_rgba(44,51,39,0.04)] overflow-hidden" id="auth-screen">
      {/* Dev OTP SMS simulation alert banner */}
      {devOtpNotification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#2C3327] text-white font-mono text-[11px] px-6 py-3.5 border-b border-[#1f241c] flex items-start space-x-2 relative"
        >
          <div className="flex-1">
            <span className="font-bold text-emerald-400">💬 SIMULATED PHONE SMS:</span> {devOtpNotification}
          </div>
          <button
            onClick={() => setDevOtpNotification('')}
            className="text-gray-400 hover:text-white font-sans text-xs inline-block ml-2 cursor-pointer"
          >
            ✕
          </button>
        </motion.div>
      )}

      {/* Card Header visual layout */}
      <div className="p-8 text-center bg-[#F0F2ED] border-b border-[#E8E6DF] relative">
        <div className="mx-auto w-12 h-12 bg-[#5F6F52] rounded-2xl flex items-center justify-center text-white text-xl mb-4 font-mono font-bold">
          🌿
        </div>
        <h2 className="text-xl font-serif font-bold text-[#2C3327]">
          {isRegister ? 'Create Your Account' : 'Welcome to Universal Booking'}
        </h2>
        <p className="text-xs text-[#7A8273] mt-1">
          {isRegister ? 'Register your workspace profile in seconds' : 'Access client schedules & merchant dashboards'}
        </p>

        {/* Multi-role Register switch */}
        {isRegister && (
          <div className="flex bg-white rounded-xl p-1 border border-[#E8E6DF] mt-5 w-4/5 mx-auto">
            <button
              onClick={() => setRole('client')}
              className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                role === 'client' ? 'bg-[#5F6F52] text-white shadow-sm' : 'text-[#7A8273] hover:text-[#2C3327]'
              }`}
            >
              Client / End-User
            </button>
            <button
              onClick={() => setRole('provider')}
              className={`flex-1 text-xs py-2 rounded-lg font-semibold transition-all cursor-pointer ${
                role === 'provider' ? 'bg-[#5F6F52] text-white shadow-sm' : 'text-[#7A8273] hover:text-[#2C3327]'
              }`}
            >
              Merchant / Provider
            </button>
          </div>
        )}
      </div>

      <div className="p-8">
        {/* Method Toggler buttons */}
        <div className="flex bg-[#F0F2ED] rounded-xl p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              method === 'email' ? 'bg-white text-[#2C3327] shadow-sm' : 'text-[#7A8273] hover:text-[#2C3327]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod('otp');
              setError('');
            }}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              method === 'otp' ? 'bg-white text-[#2C3327] shadow-sm' : 'text-[#7A8273] hover:text-[#2C3327]'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Phone OTP Verification</span>
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-xl flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* EMAIL & PASSWORD AUTH FLOW */}
        {method === 'email' ? (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div className="space-y-1">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Your Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="email"
                  required
                  placeholder="e.g. john@domain.com"
                  className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Secure Password</label>
                {!isRegister && (
                  <span className="text-[10px] text-[#5F6F52] hover:underline cursor-pointer">Forgot password?</span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5F6F52] hover:bg-[#4d5b43] text-white text-sm font-semibold rounded-xl py-3 flex items-center justify-center space-x-1 transition-all cursor-pointer disabled:opacity-50 mt-6 shadow-[0_2px_8px_rgba(95,111,82,0.15)]"
            >
              <span>{loading ? 'Processing...' : isRegister ? 'Create Secure Account' : 'Secure Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* PHONE OTP FLOW */
          <div className="space-y-4">
            {isRegister && !otpSent && (
              <div className="space-y-1">
                <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Your Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">Phone Number</label>
              <div className="relative">
                <Smartphone className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="tel"
                  required
                  disabled={otpSent}
                  placeholder="e.g. +1 555-019-2834"
                  className="w-full border border-[#E8E6DF] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#2C3327] focus:border-[#5F6F52] focus:ring-1 focus:ring-[#5F6F52] focus:outline-none disabled:bg-[#F0F2ED] disabled:text-[#7A8273]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {otpSent ? (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleVerifyOTP}
                className="space-y-4 pt-2"
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs uppercase font-mono tracking-wider text-[#7A8273]">6-Digit Verification Code</label>
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-[10px] text-[#5F6F52] hover:underline cursor-pointer"
                    >
                      Resend SMS Code
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="e.g. 123456"
                    className="w-full text-center tracking-[0.4em] font-mono border border-[#E8E6DF] rounded-xl py-3 text-lg focus:border-[#5F6F52] focus:outline-none focus:ring-1 focus:ring-[#5F6F52]"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="w-1/3 bg-[#F0F2ED] hover:bg-[#E8E6DF] text-[#2C3327] text-sm font-semibold rounded-xl py-2.5 transition-all cursor-pointer"
                  >
                    Edit Phone
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#5F6F52] hover:bg-[#4d5b43] text-white text-sm font-semibold rounded-xl py-2.5 flex items-center justify-center space-x-1 transition-all cursor-pointer shadow-[0_2px_8px_rgba(95,111,82,0.15)]"
                  >
                    <span>{loading ? 'Verifying OTP...' : 'Verify & Login'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.form>
            ) : (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full bg-[#5F6F52] hover:bg-[#4d5b43] text-white text-sm font-semibold rounded-xl py-3 flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 mt-6 shadow-[0_2px_8px_rgba(95,111,82,0.15)]"
              >
                <Phone className="w-4 h-4" />
                <span>{loading ? 'Sending code...' : 'Send Verification OTP'}</span>
              </button>
            )}
          </div>
        )}

        {/* Login vs Register Toggler */}
        <div className="mt-8 text-center border-t border-[#E8E6DF] pt-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs font-serif font-bold text-[#5F6F52] hover:text-[#4d5b43] transition-all cursor-pointer"
          >
            {isRegister
              ? 'Already registered? Clear here to sign in'
              : 'New provider or client? Register here in 10 seconds'}
          </button>
        </div>
      </div>
    </div>
  );
}
