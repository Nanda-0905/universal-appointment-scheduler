/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, Check, MailOpen, Calendar, Circle, Sparkles } from 'lucide-react';
import { AppNotification } from '../types.js';
import { api } from '../api.js';

interface NotificationPanelProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onRefresh: () => void;
}

export default function NotificationPanel({ notifications, onMarkRead, onRefresh }: NotificationPanelProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (let u of unread) {
      await api.markNotificationRead(u.id);
      onMarkRead(u.id);
    }
    onRefresh();
  };

  return (
    <div className="bg-white border border-[#E8E6DF] rounded-3xl shadow-[0_10px_30px_rgba(44,51,39,0.03)] overflow-hidden max-w-lg mx-auto my-6" id="notification-panel">
      {/* Mini Title bar Header */}
      <div className="bg-[#2C3327] px-6 py-5 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-[#F8F7F3]" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm">Notification Panel</h3>
            <p className="text-[10px] text-white/70 font-mono text-left">Live booking status updates</p>
          </div>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="text-[11px] font-mono text-[#F8F7F3] hover:text-white transition-all bg-white/10 border border-white/10 rounded-lg px-2.5 py-1.5 cursor-pointer font-bold"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter and Tab section */}
      <div className="border-b border-[#E8E6DF] px-6 py-2.5 flex items-center justify-between bg-[#F0F2ED]/50">
        <div className="flex bg-[#F0F2ED]/60 p-0.5 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'all' ? 'bg-white text-[#2C3327] shadow-sm' : 'text-[#7A8273]'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'unread' ? 'bg-white text-[#2C3327] shadow-sm' : 'text-[#7A8273]'
            }`}
          >
            Unread ({notifications.filter(u => !u.read).length})
          </button>
        </div>

        <button
          onClick={onRefresh}
          className="text-[11px] font-medium text-[#7A8273] hover:text-[#5F6F52] transition-all cursor-pointer"
        >
          🔄 Refresh Feed
        </button>
      </div>

      {/* Inbox details list */}
      <div className="max-h-96 overflow-y-auto divide-y divide-[#E8E6DF]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[#7A8273] text-sm">
            <div className="text-3xl mb-1">📭</div>
            <p>Your notification feed is empty.</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`p-4 transition-all flex items-start space-x-3 text-left ${
                n.read ? 'bg-white' : 'bg-[#F0F2ED]/40'
              }`}
            >
              {n.read ? (
                <MailOpen className="w-4 h-4 text-[#7A8273]/50 mt-1 flex-shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-[#5F6F52] fill-[#5F6F52] mt-1 flex-shrink-0" />
              )}

              <div className="flex-1 space-y-0.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs text-[#2C3327]">{n.title}</span>
                  <span className="text-[9px] font-mono text-[#7A8273]/80">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-[#7A8273] leading-relaxed">{n.message}</p>

                {!n.read && (
                  <button
                    onClick={async () => {
                      await api.markNotificationRead(n.id);
                      onMarkRead(n.id);
                      onRefresh();
                    }}
                    className="mt-1.5 flex items-center space-x-1 text-[10px] text-[#5F6F52] hover:text-[#4d5b43] font-bold cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Dismiss alert</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
