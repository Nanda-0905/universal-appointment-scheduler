/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { User, Service, Booking, AppNotification, BlockedTime, WaitlistEntry } from './src/types.js';

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Interface for database structure
interface Database {
  users: User[];
  services: Service[];
  bookings: Booking[];
  notifications: AppNotification[];
  blockedTimes: BlockedTime[];
  otps: { [phone: string]: { code: string; expiresAt: number } };
  waitlist: WaitlistEntry[];
}

// Ensure database directory and file exist
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initial static seed providers
const SEED_USERS: User[] = [
  {
    id: 'prov-sarah',
    email: 'sarah@jenkins.com',
    phone: '+15551002001',
    role: 'provider',
    name: 'Dr. Sarah Jenkins',
    createdAt: new Date().toISOString(),
    providerProfile: {
      username: 'sarah-jenkins',
      industry: 'Healthcare / Dentist',
      bio: 'Experienced family dentist focused on gentle care, preventative dental health, and cosmetic treatments. Offering pristine oral hygiene services.',
      availability: {
        days: [1, 2, 3, 4, 5], // Monday to Friday
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00'
      }
    }
  },
  {
    id: 'prov-alex',
    email: 'alex@rivera.com',
    phone: '+15551002002',
    role: 'provider',
    name: 'Alex Rivera',
    createdAt: new Date().toISOString(),
    providerProfile: {
      username: 'alex-yoga',
      industry: 'Fitness / Yoga Instructor',
      bio: 'Certified Vinyasa, Hatha, and meditation specialist offering tailored, mindful 1-on-1 flows. Achieve physical alignment and mental calm.',
      availability: {
        days: [1, 3, 5, 6], // Mon, Wed, Fri, Sat
        startTime: '08:00',
        endTime: '16:00',
        breakStartTime: '12:00',
        breakEndTime: '12:30'
      }
    }
  },
  {
    id: 'prov-emily',
    email: 'emily@chen.com',
    phone: '+15551002003',
    role: 'provider',
    name: 'Emily Chen',
    createdAt: new Date().toISOString(),
    providerProfile: {
      username: 'emily-dev',
      industry: 'Consulting / Freelance Developer',
      bio: 'Pragmatic full-stack architect specialized in React, Node.js, and Cloud deployments. Let\'s optimize your codebase, build APIs, or debug bottlenecks.',
      availability: {
        days: [2, 4, 5], // Tue, Thu, Fri
        startTime: '10:00',
        endTime: '18:00',
        breakStartTime: '13:00',
        breakEndTime: '14:00'
      }
    }
  }
];

const SEED_SERVICES: Service[] = [
  // Dr. Sarah Jenkins services
  {
    id: 'ser-clean',
    providerId: 'prov-sarah',
    name: 'General Dental Clean & Checkup',
    duration: 45,
    price: 90,
    description: 'Thorough cleaning, tartar removal, scaling, and general health review with cosmetic advice.'
  },
  {
    id: 'ser-whitening',
    providerId: 'prov-sarah',
    name: 'Teeth Whitening Consultation',
    duration: 30,
    price: 0,
    description: 'Free evaluation of custom tray options, whitening potential, and shade matching.'
  },
  {
    id: 'ser-filling',
    providerId: 'prov-sarah',
    name: 'Emergency Dental Filling',
    duration: 60,
    price: 180,
    description: 'Relief from acute cavities using composite white fillings. Includes anesthetic support.'
  },
  // Alex Rivera services
  {
    id: 'ser-yoga-1on1',
    providerId: 'prov-alex',
    name: 'Personalized 1-on-1 Vinyasa Class',
    duration: 60,
    price: 65,
    description: 'A dynamic flow session built for your physical flexibility goals. Includes alignment correction.'
  },
  {
    id: 'ser-yoga-med',
    providerId: 'prov-alex',
    name: 'Pranayama & Sound Meditation',
    duration: 45,
    price: 40,
    description: 'Calming breathwork combined with ambient acoustic bowls to release deep-seated stress.'
  },
  {
    id: 'ser-yoga-therapy',
    providerId: 'prov-alex',
    name: 'Integrative Yoga Therapy',
    duration: 90,
    price: 100,
    description: 'Deep postural therapy targeting Chronic body pain, joints, and muscular tensions.'
  },
  // Emily Chen services
  {
    id: 'ser-dev-consult',
    providerId: 'prov-emily',
    name: 'Technical Consultation / Strategy',
    duration: 30,
    price: 0,
    description: 'Free session reviewing architecture strategy, database layouts, or framework selection.'
  },
  {
    id: 'ser-dev-review',
    providerId: 'prov-emily',
    name: 'Full Stack Code & Architecture Review',
    duration: 60,
    price: 120,
    description: 'We sit down, parse your Github repo, address scaling risks, and refactor bottlenecks.'
  },
  {
    id: 'ser-dev-debug',
    providerId: 'prov-emily',
    name: 'Interactive Live Debugging Session',
    duration: 120,
    price: 220,
    description: 'Direct collaboration to identify, trace, and repair stubborn runtime errors or memory leaks.'
  }
];

const SEED_BOOKINGS: Booking[] = [
  {
    id: 'book-1',
    providerId: 'prov-sarah',
    serviceId: 'ser-clean',
    clientId: null,
    clientName: 'Michael Scott',
    clientEmail: 'michael@dundermifflin.com',
    clientPhone: '+15559990111',
    clientNote: 'I am highly sensitive to dentist tools. Please be extra gentle with me!',
    date: '2026-06-08',
    startTime: '10:00',
    endTime: '10:45',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  },
  {
    id: 'book-2',
    providerId: 'prov-emily',
    serviceId: 'ser-dev-review',
    clientId: null,
    clientName: 'Jim Halpert',
    clientEmail: 'jim@dundermifflin.com',
    clientPhone: '+15559990222',
    clientNote: 'Need an urgent review of our custom inventory management dashboard.',
    date: '2026-06-09',
    startTime: '14:00',
    endTime: '15:00',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  },
  {
    id: 'book-3',
    providerId: 'prov-alex',
    serviceId: 'ser-yoga-1on1',
    clientId: null,
    clientName: 'Pam Beesly',
    clientEmail: 'pam@dundermifflin.com',
    clientPhone: '+15559990333',
    clientNote: 'Beginner practitioner. Looking to focus on deep breathing and steady movements.',
    date: '2026-06-10',
    startTime: '09:00',
    endTime: '10:00',
    status: 'pending',
    createdAt: new Date().toISOString()
  }
];

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    userId: 'prov-sarah',
    userEmail: 'sarah@jenkins.com',
    title: 'New Booking Request',
    message: 'Michael Scott requested a "General Dental Clean & Checkup" on 2026-06-08 at 10:00 AM.',
    read: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif-2',
    userId: 'prov-emily',
    userEmail: 'emily@chen.com',
    title: 'New Booking Request',
    message: 'Jim Halpert requested a "Full Stack Code & Architecture Review" on 2026-06-09 at 14:00 PM.',
    read: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'notif-3',
    userId: 'prov-alex',
    userEmail: 'alex@rivera.com',
    title: 'Appointments Awaiting Approval',
    message: 'You have a pending slot review from Pam Beesly on 2026-06-10 at 09:00 AM.',
    read: false,
    createdAt: new Date().toISOString()
  }
];

// Read database
const readDB = (): Database => {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB: Database = {
      users: SEED_USERS,
      services: SEED_SERVICES,
      bookings: SEED_BOOKINGS,
      notifications: SEED_NOTIFICATIONS,
      blockedTimes: [],
      otps: {},
      waitlist: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), 'utf-8');
    return initialDB;
  }
  try {
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(content) as Database;
    // Sync seeds if they contain missing initial users/services on disk
    let modified = false;
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = SEED_USERS;
      modified = true;
    }
    if (!parsed.services || parsed.services.length === 0) {
      parsed.services = SEED_SERVICES;
      modified = true;
    }
    if (!parsed.bookings) {
      parsed.bookings = [];
      modified = true;
    }
    if (!parsed.notifications) {
      parsed.notifications = [];
      modified = true;
    }
    if (!parsed.blockedTimes) {
      parsed.blockedTimes = [];
      modified = true;
    }
    if (!parsed.otps) {
      parsed.otps = {};
      modified = true;
    }
    if (!parsed.waitlist) {
      parsed.waitlist = [];
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (e) {
    console.error("Error reading db.json, returning seeded state.", e);
    return {
      users: SEED_USERS,
      services: SEED_SERVICES,
      bookings: SEED_BOOKINGS,
      notifications: SEED_NOTIFICATIONS,
      blockedTimes: [],
      otps: {},
      waitlist: []
    };
  }
};

// Write database
const writeDB = (db: Database): void => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error("Error writing db.json", e);
  }
};

// Helper to notify waitlisted clients when a slot opens up
function triggerWaitlistNotification(providerId: string, date: string): void {
  const db = readDB();
  const entries = (db.waitlist || []).filter(w => w.providerId === providerId && w.date === date);
  if (entries.length === 0) return;

  const provider = db.users.find(u => u.id === providerId);
  const providerName = provider ? provider.name : 'Your scheduled provider';

  entries.forEach(entry => {
    const service = db.services.find(s => s.id === entry.serviceId);
    const serviceName = service ? service.name : 'appointment';

    const notif: AppNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      userId: entry.clientId,
      userEmail: entry.clientEmail,
      title: '🔔 Booking Slot Opened!',
      message: `Good news! An appointment slot has opened up with ${providerName} for "${serviceName}" on ${date}. Book now before it gets filled!`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(notif);
  });

  writeDB(db);
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- API ROUTES ---

  // Auth: Email/Password login or registration
  app.post('/api/auth/register-login', (req, res) => {
    const { email, name, role, isRegister, companyName } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const db = readDB();
    const cleanEmail = email.trim().toLowerCase();
    let existingUser = db.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (isRegister) {
      if (existingUser) {
        // Just log them in as a fallback or return error
        return res.status(200).json({
          message: 'LoggedIn (Email already exists)',
          user: existingUser,
          token: `token-${existingUser.id}`
        });
      }

      // Generate a new user
      const isProvider = role === 'provider';
      const newUserId = `user-${Math.random().toString(36).substr(2, 9)}`;
      const newUser: User = {
        id: newUserId,
        email: cleanEmail,
        phone: req.body.phone || '',
        role: isProvider ? 'provider' : 'client',
        name: name || email.split('@')[0],
        createdAt: new Date().toISOString()
      };

      if (isProvider) {
        newUser.providerProfile = {
          username: (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          industry: req.body.industry || 'Healthcare / Consulting',
          bio: `Professional service provider in the ${req.body.industry || 'Consulting'} sector.`,
          availability: {
            days: [1, 2, 3, 4, 5], // default Mon-Fri
            startTime: '09:00',
            endTime: '17:00',
            breakStartTime: '12:00',
            breakEndTime: '13:00'
          }
        };
      }

      db.users.push(newUser);
      writeDB(db);

      return res.status(201).json({
        message: 'Successfully registered!',
        user: newUser,
        token: `token-${newUser.id}`
      });
    } else {
      // Login flow
      if (!existingUser) {
        return res.status(404).json({ error: 'User account not found with this email. Please register.' });
      }
      return res.status(200).json({
        message: 'Logoing was successful!',
        user: existingUser,
        token: `token-${existingUser.id}`
      });
    }
  });

  // Auth: Send Phone OTP
  app.post('/api/auth/otp/send', (req, res) => {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const cleanPhone = phone.trim();
    // Generate a simple 6 digit Code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 mins match

    const db = readDB();
    db.otps[cleanPhone] = { code, expiresAt };
    writeDB(db);

    // Provide code back in response so the end-user can test instantly!
    console.log(`[SMS-MOCK] Sending OTP code ${code} to phone ${cleanPhone}`);
    return res.status(200).json({
      success: true,
      message: `Verification code sent via SMS.`,
      otp: code // Exposed for easy browser UI developer testing!
    });
  });

  // Auth: Verify Phone OTP
  app.post('/api/auth/otp/verify', (req, res) => {
    const { phone, code, name, role, isRegister } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and verification code are required.' });
    }

    const db = readDB();
    const cleanPhone = phone.trim();
    const record = db.otps[cleanPhone];

    if (!record) {
      return res.status(400).json({ error: 'No verification request found for this phone number.' });
    }
    if (Date.now() > record.expiresAt) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }
    if (record.code !== code && code !== '123456') { // Allow "123456" as universal developer fallback override
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // OTP succeeded! Cleanup
    delete db.otps[cleanPhone];

    // Find or create user
    let user = db.users.find(u => u.phone === cleanPhone);
    if (!user) {
      const isProvider = role === 'provider';
      const userId = `user-${Math.random().toString(36).substr(2, 9)}`;
      user = {
        id: userId,
        email: `${cleanPhone.replace(/[^0-9]/g, '')}@phone-user.com`,
        phone: cleanPhone,
        role: isProvider ? 'provider' : 'client',
        name: name || `Client ${cleanPhone.substr(-4)}`,
        createdAt: new Date().toISOString()
      };

      if (isProvider) {
        user.providerProfile = {
          username: `provider-${cleanPhone.substr(-4)}`,
          industry: req.body.industry || 'Health Wellness',
          bio: 'Our team delivers elite custom workspace wellness treatments.',
          availability: {
            days: [1, 2, 3, 4, 5],
            startTime: '09:00',
            endTime: '17:00',
            breakStartTime: '12:00',
            breakEndTime: '13:00'
          }
        };
      }
      db.users.push(user);
    }

    writeDB(db);

    return res.status(200).json({
      message: 'OTP verified successfully!',
      user,
      token: `token-${user.id}`
    });
  });

  // Providers List
  app.get('/api/providers', (req, res) => {
    const db = readDB();
    const providers = db.users.filter(u => u.role === 'provider');
    return res.json(providers);
  });

  // Provider details by shareable username
  app.get('/api/providers/:username', (req, res) => {
    const { username } = req.params;
    const db = readDB();
    const provider = db.users.find(u => u.providerProfile?.username?.toLowerCase() === username.toLowerCase());

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found with this custom link.' });
    }

    // Get services offered by this provider
    const services = db.services.filter(s => s.providerId === provider.id);

    return res.json({ provider, services });
  });

  // Get Services for a specific provider
  app.get('/api/providers/:providerId/services', (req, res) => {
    const { providerId } = req.params;
    const db = readDB();
    const services = db.services.filter(s => s.providerId === providerId);
    return res.json(services);
  });

  // Service CRUD
  app.post('/api/services', (req, res) => {
    const { providerId, name, duration, price, description } = req.body;
    if (!providerId || !name || !duration) {
      return res.status(400).json({ error: 'Provider, Name, and Duration are required.' });
    }

    const db = readDB();
    const newService: Service = {
      id: `ser-${Math.random().toString(36).substr(2, 9)}`,
      providerId,
      name,
      duration: Number(duration),
      price: Number(price || 0),
      description: description || ''
    };

    db.services.push(newService);
    writeDB(db);

    return res.status(201).json(newService);
  });

  app.put('/api/services/:id', (req, res) => {
    const { id } = req.params;
    const { name, duration, price, description } = req.body;

    const db = readDB();
    const idx = db.services.findIndex(s => s.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    db.services[idx] = {
      ...db.services[idx],
      name: name || db.services[idx].name,
      duration: duration ? Number(duration) : db.services[idx].duration,
      price: price !== undefined ? Number(price) : db.services[idx].price,
      description: description !== undefined ? description : db.services[idx].description
    };

    writeDB(db);
    return res.json(db.services[idx]);
  });

  app.delete('/api/services/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.services = db.services.filter(s => s.id !== id);
    writeDB(db);
    return res.json({ success: true, message: 'Service deleted.' });
  });

  // Update Provider profile & general availability
  app.put('/api/providers/:id/profile', (req, res) => {
    const { id } = req.params;
    const { name, industry, bio, availability, username } = req.body;

    const db = readDB();
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Provider not found.' });
    }

    const user = db.users[idx];
    if (user.role !== 'provider') {
      return res.status(400).json({ error: 'User is not an authorized provider.' });
    }

    const updatedProfile = {
      username: username?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || user.providerProfile?.username || `provider-${user.id.substr(-4)}`,
      industry: industry || user.providerProfile?.industry || 'Services',
      bio: bio || user.providerProfile?.bio || '',
      availability: availability || user.providerProfile?.availability || {
        days: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '17:00',
        breakStartTime: '12:00',
        breakEndTime: '13:00'
      }
    };

    // Check if username unique
    const duplicate = db.users.find(u => u.id !== id && u.providerProfile?.username?.toLowerCase() === updatedProfile.username);
    if (duplicate) {
      return res.status(400).json({ error: 'This custom booking link username is already taken. Please select another.' });
    }

    db.users[idx] = {
      ...user,
      name: name || user.name,
      providerProfile: updatedProfile
    };

    writeDB(db);
    return res.json(db.users[idx]);
  });

  // Block out times APIs (vacation/breaks)
  app.get('/api/providers/:providerId/blocked-times', (req, res) => {
    const { providerId } = req.params;
    const db = readDB();
    return res.json(db.blockedTimes.filter(b => b.providerId === providerId));
  });

  app.post('/api/providers/:providerId/blocked-times', (req, res) => {
    const { providerId } = req.params;
    const { date, startTime, endTime, allDay, label } = req.body;
    if (!date || !label) {
      return res.status(400).json({ error: 'Date and labeling are required.' });
    }

    const db = readDB();
    const newBlocked: BlockedTime = {
      id: `block-${Math.random().toString(36).substr(2, 9)}`,
      providerId,
      date,
      startTime: allDay ? undefined : startTime,
      endTime: allDay ? undefined : endTime,
      allDay: !!allDay,
      label
    };

    db.blockedTimes.push(newBlocked);
    writeDB(db);
    return res.status(201).json(newBlocked);
  });

  app.delete('/api/providers/blocked-times/:id', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const foundBlock = db.blockedTimes.find(b => b.id === id);
    db.blockedTimes = db.blockedTimes.filter(b => b.id !== id);
    writeDB(db);
    if (foundBlock) {
      triggerWaitlistNotification(foundBlock.providerId, foundBlock.date);
    }
    return res.json({ success: true, message: 'Blocked time slot removed' });
  });

  // Block/Slot availability calculator solver
  app.get('/api/providers/:providerId/slots', (req, res) => {
    const { providerId } = req.params;
    const { date, serviceId } = req.query;

    if (!date || !serviceId) {
      return res.status(400).json({ error: 'Both date (YYYY-MM-DD) and serviceId are required' });
    }

    const db = readDB();
    const provider = db.users.find(u => u.id === providerId);
    const service = db.services.find(s => s.id === serviceId);

    if (!provider || !provider.providerProfile) {
      return res.status(404).json({ error: 'Provider not found' });
    }
    if (!service) {
      return res.status(404).json({ error: 'Standard service not found' });
    }

    const availability = provider.providerProfile.availability;
    const blockedTimes = db.blockedTimes.filter(b => b.providerId === providerId);
    const bookings = db.bookings.filter(b => b.providerId === providerId);

    // Parse date safely
    const parts = (date as string).split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const dateObj = new Date(year, month, day);
    const dayOfWeek = dateObj.getDay();

    // Check if provider functions on this day of week
    if (!availability.days.includes(dayOfWeek)) {
      return res.json({ slots: [], message: 'Provider does not work on this day of the week.' });
    }

    const slots = [];
    const [startH, startM] = availability.startTime.split(':').map(Number);
    const [endH, endM] = availability.endTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    let breakStartMin = -1;
    let breakEndMin = -1;
    if (availability.breakStartTime && availability.breakEndTime) {
      const [bsh, bsm] = availability.breakStartTime.split(':').map(Number);
      const [beh, bem] = availability.breakEndTime.split(':').map(Number);
      breakStartMin = bsh * 60 + bsm;
      breakEndMin = beh * 60 + bem;
    }

    const serviceDuration = service.duration;

    // Standard timezone check vs Server Current clock
    // Convert current time to a virtual comparative local value matching provider timezone
    const now = new Date();
    // Simple today matching
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    for (let current = startMinutes; current + serviceDuration <= endMinutes; current += 30) {
      const slotStartMin = current;
      const slotEndMin = current + serviceDuration;

      // Overlaps break?
      if (breakStartMin !== -1 && breakEndMin !== -1) {
        if (slotStartMin < breakEndMin && slotEndMin > breakStartMin) {
          continue; // skip
        }
      }

      // Check blocked / vacations
      const isBlocked = blockedTimes.some(b => {
        if (b.date !== date) return false;
        if (b.allDay) return true;
        if (b.startTime && b.endTime) {
          const [bsh, bsm] = b.startTime.split(':').map(Number);
          const [beh, bem] = b.endTime.split(':').map(Number);
          const bmStart = bsh * 60 + bsm;
          const bmEnd = beh * 60 + bem;
          return slotStartMin < bmEnd && slotEndMin > bmStart;
        }
        return false;
      });

      if (isBlocked) continue;

      // Overlaps existing active bookings?
      const isBooked = bookings.some(b => {
        if (b.status === 'canceled') return false;
        if (b.date !== date) return false;
        const [bsh, bsm] = b.startTime.split(':').map(Number);
        const [beh, bem] = b.endTime.split(':').map(Number);
        const bkStart = bsh * 60 + bsm;
        const bkEnd = beh * 60 + bem;
        return slotStartMin < bkEnd && slotEndMin > bkStart;
      });

      if (isBooked) continue;

      // Filter past time-slots if booking for today
      if (date === todayStr) {
        const curMin = now.getHours() * 60 + now.getMinutes();
        if (slotStartMin <= curMin) {
          continue;
        }
      }

      const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      slots.push({
        startTime: formatTime(slotStartMin),
        endTime: formatTime(slotEndMin)
      });
    }

    return res.json({ slots });
  });

  // Bookings CRUD: Get booking lists
  app.get('/api/bookings', (req, res) => {
    const { userId, role, email } = req.query;
    const db = readDB();

    let list = db.bookings;

    if (role === 'provider' && userId) {
      list = list.filter(b => b.providerId === userId);
    } else if (role === 'client' && userId) {
      list = list.filter(b => b.clientId === userId);
    } else if (email) {
      // Allow searching guest bookings or client lookup via email
      const cleanEmail = (email as string).trim().toLowerCase();
      list = list.filter(b => b.clientEmail.toLowerCase() === cleanEmail);
    }

    return res.json(list);
  });

  // Booking Create: strict slot solver check on server prevents double bookings
  app.post('/api/bookings', (req, res) => {
    const { providerId, serviceId, clientId, clientName, clientEmail, clientPhone, clientNote, date, startTime } = req.body;

    if (!providerId || !serviceId || !clientName || !clientEmail || !clientPhone || !date || !startTime) {
      return res.status(400).json({ error: 'All primary booking fields match required values (provider, service, client info, date, startTime).' });
    }

    const db = readDB();
    const provider = db.users.find(u => u.id === providerId);
    const service = db.services.find(s => s.id === serviceId);

    if (!provider || !provider.providerProfile) {
      return res.status(404).json({ error: 'Provider not found.' });
    }
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    // Solve exact end-time duration
    const [startH, startM] = startTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = startMinutes + service.duration;
    const formatTime = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const endTime = formatTime(endMinutes);

    // --- DOUBLE-BOOKING SERVER-SIDE VALIDATION GUARD ---
    const overlapsBooking = db.bookings.some(b => {
      if (b.providerId !== providerId || b.date !== date || b.status === 'canceled') return false;
      const [bsh, bsm] = b.startTime.split(':').map(Number);
      const [beh, bem] = b.endTime.split(':').map(Number);
      const bStart = bsh * 60 + bsm;
      const bEnd = beh * 60 + bem;
      return startMinutes < bEnd && endMinutes > bStart;
    });

    if (overlapsBooking) {
      return res.status(400).json({ error: 'Double Booking Error: The selected time slot overlaps with another active appointment. Please choose a different slot.' });
    }

    // Overlaps with Blocked Times/Vacations?
    const overlapsBlocked = db.blockedTimes.some(b => {
      if (b.providerId !== providerId || b.date !== date) return false;
      if (b.allDay) return true;
      if (b.startTime && b.endTime) {
        const [bsh, bsm] = b.startTime.split(':').map(Number);
        const [beh, bem] = b.endTime.split(':').map(Number);
        const bStart = bsh * 60 + bsm;
        const bEnd = beh * 60 + bem;
        return startMinutes < bEnd && endMinutes > bStart;
      }
      return false;
    });

    if (overlapsBlocked) {
      return res.status(400).json({ error: 'Double Booking Error: The provider is unavailable during this specific time slot.' });
    }

    // Success: Create new booking
    const newBooking: Booking = {
      id: `book-${Math.random().toString(36).substr(2, 9)}`,
      providerId,
      serviceId,
      clientId: clientId || null,
      clientName,
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone,
      clientNote: clientNote || '',
      date,
      startTime,
      endTime,
      status: 'pending', // Awaiting provider confirmation or auto-confirmed
      createdAt: new Date().toISOString()
    };

    db.bookings.push(newBooking);

    // Trigger instant Mock In-App Notifications
    const providerNotif: AppNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      userId: providerId,
      userEmail: provider.email,
      title: '📅 New Booking Requested',
      message: `${clientName} has requested ${service.name} on ${date} at ${startTime}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(providerNotif);

    if (clientId) {
      const clientNotif: AppNotification = {
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        userId: clientId,
        userEmail: clientEmail,
        title: '📆 Appointment Request Placed',
        message: `Your request for ${service.name} with ${provider.name} sits at pending approval. Check status here.`,
        read: false,
        createdAt: new Date().toISOString()
      };
      db.notifications.push(clientNotif);
    }

    writeDB(db);
    return res.status(210).json(newBooking);
  });

  // Waitlist endpoints
  app.get('/api/waitlist', (req, res) => {
    const { providerId, email } = req.query;
    const db = readDB();
    let list = db.waitlist || [];
    if (providerId) {
      list = list.filter(w => w.providerId === providerId);
    }
    if (email) {
      const cleanEmail = (email as string).trim().toLowerCase();
      list = list.filter(w => w.clientEmail.toLowerCase() === cleanEmail);
    }
    return res.json(list);
  });

  app.post('/api/waitlist', (req, res) => {
    const { providerId, serviceId, clientId, clientName, clientEmail, clientPhone, clientNote, date } = req.body;

    if (!providerId || !serviceId || !clientName || !clientEmail || !clientPhone || !date) {
      return res.status(400).json({ error: 'All primary fields are required to join the waitlist.' });
    }

    const db = readDB();
    const provider = db.users.find(u => u.id === providerId);
    const service = db.services.find(s => s.id === serviceId);

    if (!provider) {
      return res.status(404).json({ error: 'Provider not found.' });
    }
    if (!service) {
      return res.status(404).json({ error: 'Service not found.' });
    }

    // Check if the client is already waitlisted for this day and service
    const duplicate = (db.waitlist || []).some(w => 
      w.providerId === providerId && 
      w.date === date && 
      w.clientEmail.toLowerCase() === clientEmail.trim().toLowerCase() &&
      w.serviceId === serviceId
    );

    if (duplicate) {
      return res.status(400).json({ error: 'You are already registered on the waitlist for this service and date.' });
    }

    const newWait: WaitlistEntry = {
      id: `wait-${Math.random().toString(36).substr(2, 9)}`,
      providerId,
      serviceId,
      clientId: clientId || null,
      clientName,
      clientEmail: clientEmail.trim().toLowerCase(),
      clientPhone,
      clientNote: clientNote || '',
      date,
      createdAt: new Date().toISOString()
    };

    if (!db.waitlist) {
      db.waitlist = [];
    }
    db.waitlist.push(newWait);

    // Create notifications for both provider and client
    const providerNotif: AppNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      userId: providerId,
      userEmail: provider.email,
      title: '⏳ New Waitlist Spot Joined',
      message: `${clientName} has joined the waitlist for "${service.name}" on ${date}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(providerNotif);

    if (clientId) {
      const clientNotif: AppNotification = {
        id: `notif-${Math.random().toString(36).substr(2, 9)}`,
        userId: clientId,
        userEmail: clientEmail,
        title: '⏳ Waitlist Joined Successfully',
        message: `You joined the waitlist with ${provider.name} for "${service.name}" on ${date}. We will alert you if a spot opens up!`,
        read: false,
        createdAt: new Date().toISOString()
      };
      db.notifications.push(clientNotif);
    }

    writeDB(db);
    return res.status(201).json(newWait);
  });

  // Get in-app notifications
  app.get('/api/notifications', (req, res) => {
    const { userId, email } = req.query;
    const db = readDB();

    let list = db.notifications;
    if (userId) {
      list = list.filter(n => n.userId === userId);
    } else if (email) {
      const cleanEmail = (email as string).trim().toLowerCase();
      list = list.filter(n => n.userEmail?.toLowerCase() === cleanEmail);
    }

    return res.json(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  });

  app.post('/api/notifications/:id/read', (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const idx = db.notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
      db.notifications[idx].read = true;
      writeDB(db);
    }
    return res.json({ success: true });
  });

  // Edit Booking Status (Accept, Cancel, Reschedule)
  app.post('/api/bookings/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, note } = req.body; // 'confirmed' or 'canceled'

    if (!['confirmed', 'canceled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status update action.' });
    }

    const db = readDB();
    const idx = db.bookings.findIndex(b => b.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Booking order not found.' });
    }

    const booking = db.bookings[idx];
    const oldStatus = booking.status;
    db.bookings[idx].status = status;

    const provider = db.users.find(u => u.id === booking.providerId);
    const service = db.services.find(s => s.id === booking.serviceId);

    // Create a client notification
    const clientNotif: AppNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      userId: booking.clientId,
      userEmail: booking.clientEmail,
      title: status === 'confirmed' ? '✅ Booking Confirmed!' : '❌ Booking Canceled',
      message: status === 'confirmed'
        ? `Your appointment with ${provider?.name || 'Provider'} for ${service?.name || 'Service'} on ${booking.date} at ${booking.startTime} was confirmed!`
        : `Your appointment with ${provider?.name || 'Provider'} for ${service?.name || 'Service'} on ${booking.date} at ${booking.startTime} has been canceled. ${note ? 'Reason: ' + note : ''}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(clientNotif);

    writeDB(db);

    if (status === 'canceled' && oldStatus !== 'canceled') {
      triggerWaitlistNotification(booking.providerId, booking.date);
    }

    return res.json(db.bookings[idx]);
  });

  // Booking Reschedule endpoint
  app.post('/api/bookings/:id/reschedule', (req, res) => {
    const { id } = req.params;
    const { date, startTime } = req.body;

    if (!date || !startTime) {
      return res.status(400).json({ error: 'Rescheduling requires both date and startTime.' });
    }

    const db = readDB();
    const idx = db.bookings.findIndex(b => b.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Booking appointment not found.' });
    }

    const booking = db.bookings[idx];
    const service = db.services.find(s => s.id === booking.serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Associated service not found.' });
    }

    // Solve end time
    const [startH, startM] = startTime.split(':').map(Number);
    const endMinutes = (startH * 60 + startM) + service.duration;
    const formatTime = (minutes: number) => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };
    const endTime = formatTime(endMinutes);

    // Check overlaps
    const startMinutes = startH * 60 + startM;
    const overlaps = db.bookings.some(b => {
      if (b.id === id || b.providerId !== booking.providerId || b.date !== date || b.status === 'canceled') return false;
      const [bsh, bsm] = b.startTime.split(':').map(Number);
      const [beh, bem] = b.endTime.split(':').map(Number);
      const bkStart = bsh * 60 + bsm;
      const bkEnd = beh * 60 + bem;
      return startMinutes < bkEnd && endMinutes > bkStart;
    });

    if (overlaps) {
      return res.status(400).json({ error: 'Double Booking Error: The rescheduled slot overlaps with an existing appointment.' });
    }

    // Update
    const originalDate = booking.date;
    booking.date = date;
    booking.startTime = startTime;
    booking.endTime = endTime;
    booking.status = 'confirmed'; // auto verify rescheduled appointments

    // Add notification
    const clientNotif: AppNotification = {
      id: `notif-${Math.random().toString(36).substr(2, 9)}`,
      userId: booking.clientId,
      userEmail: booking.clientEmail,
      title: '🔄 Appointment Rescheduled',
      message: `Your appointment with ${db.users.find(u => u.id === booking.providerId)?.name || 'Provider'} was rescheduled to ${date} at ${startTime}.`,
      read: false,
      createdAt: new Date().toISOString()
    };
    db.notifications.push(clientNotif);

    writeDB(db);

    if (originalDate !== date) {
      triggerWaitlistNotification(booking.providerId, originalDate);
    }

    return res.json(booking);
  });

  // --- VITE DEV OR STATIC SERVER MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.url.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not matched' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server compiled and starting up on http://localhost:${PORT}`);
  });
}

startServer();
