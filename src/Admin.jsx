import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Users, CheckCircle, Activity, Building2, Search, History, Download, TrendingUp, ChevronDown, ChevronUp, Lock, Target, Trash2, RefreshCw, Baby, UserRound, ArrowUpDown, X, AlertTriangle, RotateCcw, Unlock, ChevronLeft, ChevronRight, MapPin, Star, ShieldCheck, ShieldOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { QRCodeCanvas } from 'qrcode.react';
import { supabase } from './utils/supabase';

const MODULE_NAMES = {
  1: 'Kit & Postazione', 2: 'Accensione & Stand-by', 3: 'Posizionamento & Ricarica',
  4: 'Sanificazione', 5: 'Menu & Click', 6: 'Posizionamento sul Paziente',
  7: 'Rabbits', 8: 'Telly', 9: 'Simulazione',
};
const ITEMS_PER_PAGE = 20;

const ConfirmModal = ({ open, title, message, onConfirm, onCancel, danger = true }) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} className="relative z-10 bg-slate-900 border border-slate-700 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${danger ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
            <AlertTriangle className={`w-7 h-7 ${danger ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          <h3 className="text-xl font-black text-white text-center mb-2">{title}</h3>
          <p className="text-slate-400 text-center text-sm font-medium mb-8 leading-relaxed">{message}</p>
          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-colors border border-slate-700">
              Cancel
            </button>
            <button onClick={onConfirm} className={`flex-1 py-3.5 rounded-2xl font-bold transition-all text-white ${danger ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20' : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/20'}`}>
              Confirm
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const EMAIL_FILTERS = [
  { key: 'all',      label: 'All',       color: 'text-slate-300' },
  { key: 'accepted', label: 'Subscribed', color: 'text-emerald-400' },
  { key: 'refused',  label: 'Declined',  color: 'text-red-400' },
  { key: 'pending',  label: 'Pending',   color: 'text-slate-500' },
];

const EmailSection = ({ allUsers }) => {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const rows = allUsers
    .filter(u => u.email)
    .map(u => ({
      name: u.name,
      email: u.email,
      phone: u.phone,
      hospital: u.hospital,
      status: u.newsletterOptIn === true ? 'accepted' : u.newsletterOptIn === false ? 'refused' : 'pending',
      lastLogin: u.lastLogin,
    }))
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => !search || r.email.includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase()));

  const counts = {
    all: allUsers.filter(u => u.email).length,
    accepted: allUsers.filter(u => u.newsletterOptIn === true).length,
    refused: allUsers.filter(u => u.newsletterOptIn === false).length,
    pending: allUsers.filter(u => u.email && u.newsletterOptIn == null).length,
  };

  const exportCSV = () => {
    const csv = 'Name,Email,Phone,Hospital,Newsletter,Last Login\n' + rows.map(r =>
      `"${r.name}","${r.email}","${r.phone || ''}","${r.hospital || ''}","${r.status === 'accepted' ? 'Subscribed' : r.status === 'refused' ? 'Declined' : 'Pending'}","${r.lastLogin ? new Date(r.lastLogin).toLocaleDateString('en-GB') : '—'}"`
    ).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `email-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden mb-20">
      <div className="p-8 border-b border-slate-800">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-2xl font-black text-white">Email & Newsletter</h3>
            <p className="text-sm text-slate-500 font-medium mt-1">{counts.all} emails collected · {counts.accepted} subscribed · {counts.refused} declined · {counts.pending} pending</p>
          </div>
          <button onClick={exportCSV} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="flex items-center gap-3 mt-5 flex-wrap">
          {EMAIL_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all border ${filter === f.key ? 'bg-[#FF8731] text-white border-transparent shadow-lg shadow-[#FF8731]/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              {f.label} <span className="opacity-60 ml-1 text-xs">({counts[f.key]})</span>
            </button>
          ))}
          <input
            type="text"
            placeholder="Search email or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ml-auto px-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium placeholder-slate-600 outline-none focus:border-[#FF8731]/50 transition-all"
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="p-12 text-center text-slate-600 font-medium">No results.</div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Name</th>
              <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Email</th>
              <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Phone</th>
              <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Hospital</th>
              <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Newsletter</th>
              <th className="px-8 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Last login</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.email + i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-4 text-white font-bold text-sm">{row.name}</td>
                <td className="px-8 py-4 text-slate-300 font-semibold text-sm">{row.email}</td>
                <td className="px-8 py-4 text-slate-500 text-sm">{row.phone || '—'}</td>
                <td className="px-8 py-4 text-slate-500 text-sm">{row.hospital || '—'}</td>
                <td className="px-8 py-4">
                  {row.status === 'accepted' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">Subscribed ✓</span>}
                  {row.status === 'refused'  && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">Declined</span>}
                  {row.status === 'pending'  && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700 border border-slate-600 text-slate-500 text-xs font-bold">Pending</span>}
                </td>
                <td className="px-8 py-4 text-slate-500 text-sm">{row.lastLogin ? new Date(row.lastLogin).toLocaleDateString('en-GB') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const Admin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [allUsersList, setAllUsersList] = useState([]);
  const [searchTerm, setSearchParams] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [sortBy, setSortBy] = useState('lastLogin');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedUser, setExpandedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null, danger: true });
  const [newsletterList, setNewsletterList] = useState([]);
  const navigate = useNavigate();

  const getTotalLessons = (pt) => pt === 'pediatria' ? 9 : 6;
  const totalLessons = 9;

  const timeAgo = (iso) => {
    if (!iso) return '—';
    const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hrs ago`;
    if (diff < 172800) return 'Yesterday';
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getModulesForProfile = (pt) => pt === 'pediatria' ? [10,11,12,4,6,13,7,8,5] : [1,2,3,4,5,9];

  const getNextModule = (completedList, patientType) => {
    const mods = getModulesForProfile(patientType);
    for (const i of mods) {
      if (!completedList.includes(i)) return i;
    }
    return null;
  };

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const hasActiveFilters = statusFilter !== 'all' || hospitalFilter !== 'all' || searchTerm !== '';
  const resetFilters = () => { setStatusFilter('all'); setHospitalFilter('all'); setSearchParams(''); };

  const openConfirm = (title, message, onConfirm, danger = true) => {
    setConfirmModal({ open: true, title, message, onConfirm, danger });
  };
  const closeConfirm = () => setConfirmModal(m => ({ ...m, open: false }));

  const loadStats = async () => {
    const { data: supaUsers, error } = await supabase
      .from('users')
      .select('*')
      .order('last_login', { ascending: false });

    const source = (!error && supaUsers && supaUsers.length > 0)
      ? supaUsers.map(u => ({
          id: u.id,
          isAdmin: !!u.is_admin,
          name: u.name,
          firstName: u.first_name,
          lastName: u.last_name,
          email: u.email,
          phone: u.phone,
          hospital: u.hospital,
          department: u.department,
          patientType: u.patient_type,
          mode: u.mode,
          loginCount: u.login_count,
          firstLogin: u.first_login,
          lastLogin: u.last_login,
          completedModulesList: u.completed_modules || [],
          newsletterOptIn: u.newsletter_opt_in,
        }))
      : Object.values(JSON.parse(localStorage.getItem('lemo_all_users')) || {}).map(u => ({
          ...u,
          completedModulesList: JSON.parse(localStorage.getItem(`lemo_progress_${u.name}`)) || u.completedModulesList || [],
        }));

    let usersArray = [];
    let hospitalsMap = {};
    let dropOffMap = { 'Not Started': 0, '1–3 Modules': 0, '4–6 Modules': 0, 'Completed': 0 };
    let completedCount = 0;
    let activeTodayCount = 0;
    let totalLogins = 0;
    let adultiCount = 0;
    let pediatriaCount = 0;
    let totalProgressSum = 0;
    let totalProgressDenom = 0;

    const todayStr = new Date().toISOString().split('T')[0];

    source.forEach(user => {
      const completedModules = (user.completedModulesList || []).length;
      const userTotal = getTotalLessons(user.patientType);

      if (completedModules >= userTotal) completedCount++;
      if (user.lastLogin && user.lastLogin.startsWith(todayStr)) activeTodayCount++;
      totalLogins += (user.loginCount || 1);
      totalProgressSum += completedModules;
      totalProgressDenom += userTotal;

      if (user.patientType === 'adulti') adultiCount++;
      else if (user.patientType === 'pediatria') pediatriaCount++;

      const hosp = user.hospital || 'Unknown';
      hospitalsMap[hosp] = (hospitalsMap[hosp] || 0) + 1;

      if (completedModules === 0) dropOffMap['Not Started']++;
      else if (completedModules <= 3) dropOffMap['1–3 Modules']++;
      else if (completedModules < userTotal) dropOffMap['4–6 Modules']++;
      else dropOffMap['Completed']++;

      usersArray.push({
        ...user,
        progressCount: completedModules,
        percentage: Math.round((completedModules / userTotal) * 100),
      });
    });

    setAllUsersList(usersArray);

    const hospitalsData = Object.keys(hospitalsMap).map(k => ({ name: k, value: hospitalsMap[k] }));
    const completionRatesData = [
      { name: 'Not Started', users: dropOffMap['Not Started'] },
      { name: '1–3 Mod.', users: dropOffMap['1–3 Modules'] },
      { name: '4–6 Mod.', users: dropOffMap['4–6 Modules'] },
      { name: 'Completed', users: dropOffMap['Completed'] },
    ];

    const loginsByDay = {};
    source.forEach(user => {
      if (user.lastLogin) {
        const day = user.lastLogin.split('T')[0];
        loginsByDay[day] = (loginsByDay[day] || 0) + 1;
      }
    });
    const activityData = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayKey = d.toISOString().split('T')[0];
      return {
        name: d.toLocaleDateString('en-GB', { weekday: 'short' }),
        logins: loginsByDay[dayKey] || 0
      };
    });

    const count = usersArray.length;
    setStats({
      totalUsers: count,
      completed: completedCount,
      activeToday: activeTodayCount,
      totalLogins,
      completionRate: count > 0 ? Math.round((completedCount / count) * 100) : 0,
      avgProgress: totalProgressDenom > 0 ? Math.round((totalProgressSum / totalProgressDenom) * 100) : 0,
      avgLogins: count > 0 ? Math.round((totalLogins / count) * 10) / 10 : 0,
      adultiCount,
      pediatriaCount,
      hospitals: hospitalsData,
      completionRates: completionRatesData,
      activityData,
    });
  };

  const loadNewsletter = async () => {
    const { data } = await supabase.from('newsletter').select('email, created_at').order('created_at', { ascending: false });
    if (data) setNewsletterList(data);
  };

  // Accesso admin: login Supabase + verifica del ruolo lato database (funzione is_admin).
  const enterIfAdmin = async () => {
    const { data: isAdmin, error } = await supabase.rpc('is_admin');
    if (error || !isAdmin) return false;
    setIsAuthenticated(true);
    loadStats();
    loadNewsletter();
    return true;
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) await enterIfAdmin();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoginError(''); setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setLoginError('Email o password errati.'); setLoginLoading(false); return; }
    const ok = await enterIfAdmin();
    if (!ok) {
      await supabase.auth.signOut();
      setLoginError('Questo account non ha i permessi di amministratore.');
    }
    setLoginLoading(false);
  };

  const handleExit = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('lemo_user');
    navigate('/');
  };

  const toggleAdmin = (u) => {
    const makeAdmin = !u.isAdmin;
    openConfirm(
      makeAdmin ? 'Grant Admin Access' : 'Remove Admin Access',
      makeAdmin
        ? `Give "${u.name}" access to this dashboard? They will see all operators' data and can manage them.`
        : `Remove admin access for "${u.name}"?`,
      async () => {
        const { error } = await supabase.from('users').update({ is_admin: makeAdmin }).eq('id', u.id);
        if (error) alert(error.message);
        loadStats();
        closeConfirm();
      },
      !makeAdmin
    );
  };

  const deleteUser = (u) => {
    const userName = u.name;
    openConfirm(
      'Delete Session',
      `Permanently delete "${userName}"? All data and progress will be lost. This action is irreversible.`,
      async () => {
        const { error } = await supabase.from('users').delete().eq('id', u.id);
        if (error) { alert(error.message); closeConfirm(); return; }
        const globalUsers = JSON.parse(localStorage.getItem('lemo_all_users')) || {};
        delete globalUsers[userName];
        localStorage.setItem('lemo_all_users', JSON.stringify(globalUsers));
        localStorage.removeItem(`lemo_progress_${userName}`);
        setExpandedUser(null);
        loadStats();
        closeConfirm();
      },
      true
    );
  };

  const resetProgress = (u) => {
    const userName = u.name;
    openConfirm(
      'Reset Progress',
      `Reset the training progress for "${userName}"? The user will be taken back to Module 1 but will keep their account.`,
      async () => {
        await supabase.from('users').update({ completed_modules: [] }).eq('id', u.id);
        localStorage.removeItem(`lemo_progress_${userName}`);
        const globalUsers = JSON.parse(localStorage.getItem('lemo_all_users')) || {};
        if (globalUsers[userName]) {
          globalUsers[userName].completedModulesList = [];
          localStorage.setItem('lemo_all_users', JSON.stringify(globalUsers));
        }
        loadStats();
        closeConfirm();
      },
      false
    );
  };

  const unlockAll = (u) => {
    const userName = u.name;
    const patientType = u.patientType;
    openConfirm(
      'Unlock All Modules',
      `Unlock the entire training path for "${userName}"? All modules will be marked as completed.`,
      async () => {
        const allModules = getModulesForProfile(patientType);
        await supabase.from('users').update({ completed_modules: allModules }).eq('id', u.id);
        localStorage.setItem(`lemo_progress_${userName}`, JSON.stringify(allModules));
        const globalUsers = JSON.parse(localStorage.getItem('lemo_all_users')) || {};
        if (globalUsers[userName]) {
          globalUsers[userName].completedModulesList = allModules;
          localStorage.setItem('lemo_all_users', JSON.stringify(globalUsers));
        }
        loadStats();
        closeConfirm();
      },
      false
    );
  };

  const exportCSV = () => {
    const SEP = ';';
    const BOM = '﻿';
    const escapeCell = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const headers = ['Operator', 'Email', 'Newsletter', 'Hospital', 'Department', 'Patient Profile', 'Mode', 'Progress %', 'Completed Modules', 'Next Module', 'Total Logins', 'Avg Logins', 'First Access', 'Last Access'];

    const rows = filteredUsers.map(u => {
      const nextMod = getNextModule(u.completedModulesList || [], u.patientType);
      return [
        u.name || '',
        u.email || '',
        u.newsletterOptIn === true ? 'Yes' : u.newsletterOptIn === false ? 'No' : '—',
        u.hospital || '',
        u.department || '',
        u.patientType === 'pediatria' ? 'Paediatrics' : 'Adults',
        u.mode === 'full' ? 'Free' : 'Guided',
        `${u.percentage || 0}%`,
        `${u.progressCount || 0}/${getTotalLessons(u.patientType)}`,
        nextMod ? `Module ${nextMod} — ${MODULE_NAMES[nextMod]}` : 'Completed ✓',
        u.loginCount || 1,
        stats?.avgLogins || 0,
        new Date(u.firstLogin || u.lastLogin || Date.now()).toLocaleDateString('en-GB'),
        new Date(u.lastLogin || Date.now()).toLocaleString('en-GB'),
      ].map(escapeCell).join(SEP);
    });

    const summary = [
      '',
      ['SUMMARY', '', '', '', '', '', '', '', '', '', '', ''].map(escapeCell).join(SEP),
      ['Total operators', allUsersList.length, '', '', '', '', '', '', '', '', '', ''].map(escapeCell).join(SEP),
      ['Certificates issued', stats?.completed || 0, '', '', '', '', '', '', '', '', '', ''].map(escapeCell).join(SEP),
      ['Completion rate', `${stats?.completionRate || 0}%`, '', '', '', '', '', '', '', '', '', ''].map(escapeCell).join(SEP),
      ['Average progress', `${stats?.avgProgress || 0}%`, '', '', '', '', '', '', '', '', '', ''].map(escapeCell).join(SEP),
      ['Adult profile', stats?.adultiCount || 0, '', '', '', '', '', '', '', '', '', ''].map(escapeCell).join(SEP),
      ['Paediatric profile', stats?.pediatriaCount || 0, '', '', '', '', '', '', '', '', '', ''].map(escapeCell).join(SEP),
      ['Report generated on', new Date().toLocaleString('en-GB'), '', '', '', '', '', '', '', '', '', ''].map(escapeCell).join(SEP),
    ];

    const csvContent = BOM + [headers.map(escapeCell).join(SEP), ...rows, ...summary].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Lemons_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const uniqueHospitals = [...new Set(allUsersList.map(u => u.hospital).filter(Boolean))].sort();
  const todayStr = new Date().toISOString().split('T')[0];

  const filteredUsers = allUsersList
    .filter(u => {
      const matchesSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.hospital || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(searchTerm.toLowerCase());
      let matchesStatus = true;
      if (statusFilter === 'completed') matchesStatus = u.percentage === 100;
      if (statusFilter === 'in_progress') matchesStatus = u.percentage < 100 && u.percentage > 0;
      if (statusFilter === 'not_started') matchesStatus = u.percentage === 0;
      const matchesHospital = hospitalFilter === 'all' || u.hospital === hospitalFilter;
      return matchesSearch && matchesStatus && matchesHospital;
    })
    .sort((a, b) => {
      let va, vb;
      if (sortBy === 'name') { va = a.name || ''; vb = b.name || ''; return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va); }
      if (sortBy === 'percentage') { va = a.percentage || 0; vb = b.percentage || 0; }
      else if (sortBy === 'loginCount') { va = a.loginCount || 1; vb = b.loginCount || 1; }
      else { va = new Date(a.lastLogin || 0); vb = new Date(b.lastLogin || 0); }
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, hospitalFilter, sortBy, sortDir]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#03091B] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-500/10 rounded-full blur-[100px]"></div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-800 p-10 rounded-[2rem] shadow-2xl relative z-10 w-full max-w-md text-center">
          <img src="/images/logos/logo bianco panna png.png" alt="Lemons Logo" className="w-16 h-16 mx-auto mb-6 object-contain" />
          <h1 className="text-3xl font-black font-serif text-white mb-2">Admin Area</h1>
          <p className="text-slate-400 mb-8">Exclusive access for the Lemons in the room team.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-xl text-center focus:border-red-500 focus:outline-none transition-colors" />
            <input type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white px-6 py-4 rounded-xl text-center tracking-widest font-mono focus:border-red-500 focus:outline-none transition-colors" />
            {loginError && <p className="text-red-400 text-sm font-semibold">{loginError}</p>}
            <button type="submit" disabled={loginLoading} className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-500/20 transition-colors">{loginLoading ? '…' : 'Enter Dashboard'}</button>
          </form>
          <button onClick={() => navigate('/')} className="mt-6 text-slate-500 hover:text-slate-300 text-sm font-bold">Back to platform</button>
        </motion.div>
      </div>
    );
  }

  const COLORS = ['#FF8731', '#10B981', '#3B82F6', '#8B5CF6', '#F43F5E', '#0ea5e9', '#f59e0b', '#ec4899'];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-10 font-sans overflow-x-hidden">
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
        danger={confirmModal.danger}
      />

      <div className="max-w-[1400px] mx-auto">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-6 bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative">
              <img src="/images/logos/logo bianco panna png.png" alt="Lemons Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl font-black font-serif text-white tracking-tight flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-[#FF8731]" />
                Lemons in the room
              </h1>
              <p className="text-slate-400 mt-1 font-medium text-sm">Real-time monitoring of global operational data.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={loadStats} className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 border border-slate-700">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
            <button onClick={exportCSV} className="flex-1 md:flex-none px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handleExit} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors border border-slate-700">
              Exit
            </button>
          </div>
        </header>

        {/* KPI Row 1 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
            <Users className="w-6 h-6 text-blue-400 mb-4" />
            <div>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Total Operators</p>
              <p className="text-3xl font-black font-serif text-white">{stats?.totalUsers || 0}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <CheckCircle className="w-6 h-6 text-emerald-400 mb-4 relative z-10" />
            <div className="relative z-10">
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Certificates Issued</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black font-serif text-white">{stats?.completed || 0}</p>
                <p className="text-emerald-400 text-sm font-bold mb-1">({stats?.completionRate || 0}%)</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
            <Activity className="w-6 h-6 text-yellow-400 mb-4" />
            <div>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Active Today</p>
              <p className="text-3xl font-black font-serif text-white">{stats?.activeToday || 0}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
            <TrendingUp className="w-6 h-6 text-indigo-400 mb-4" />
            <div>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Total Sessions</p>
              <p className="text-3xl font-black font-serif text-white">{stats?.totalLogins || 0}</p>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between col-span-2 md:col-span-4 lg:col-span-1">
            <Building2 className="w-6 h-6 text-rose-400 mb-4" />
            <div>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Active Facilities</p>
              <p className="text-3xl font-black font-serif text-white">{(stats?.hospitals || []).length}</p>
            </div>
          </div>
        </div>

        {/* KPI Row 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"></div>
            <UserRound className="w-6 h-6 text-blue-400 mb-4 relative z-10" />
            <div className="relative z-10">
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Adult Profile</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black font-serif text-white">{stats?.adultiCount || 0}</p>
                <p className="text-blue-400 text-sm font-bold mb-1">
                  ({stats?.totalUsers > 0 ? Math.round(((stats?.adultiCount || 0) / stats.totalUsers) * 100) : 0}%)
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-xl"></div>
            <Baby className="w-6 h-6 text-violet-400 mb-4 relative z-10" />
            <div className="relative z-10">
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Paediatric Profile</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black font-serif text-white">{stats?.pediatriaCount || 0}</p>
                <p className="text-violet-400 text-sm font-bold mb-1">
                  ({stats?.totalUsers > 0 ? Math.round(((stats?.pediatriaCount || 0) / stats.totalUsers) * 100) : 0}%)
                </p>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF8731]/10 rounded-full blur-xl"></div>
            <Star className="w-6 h-6 text-[#FF8731] mb-4 relative z-10" />
            <div className="relative z-10">
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Average Progress</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black font-serif text-white">{stats?.avgProgress || 0}%</p>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-[#FF8731] rounded-full" style={{ width: `${stats?.avgProgress || 0}%` }}></div>
              </div>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
            <History className="w-6 h-6 text-slate-400 mb-4" />
            <div>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Avg Sessions / User</p>
              <p className="text-3xl font-black font-serif text-white">{stats?.avgLogins || 0}</p>
            </div>
          </div>
        </div>

        {/* QR Code */}
        <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl mb-10 flex flex-col lg:flex-row items-center gap-10 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#8756FA] rounded-full blur-[120px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-700"></div>
          <div className="flex-1 relative z-10 text-center lg:text-left">
            <h3 className="text-3xl font-black font-serif text-white mb-4">Universal Access Code</h3>
            <p className="text-slate-400 font-medium text-lg mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Print or show this QR Code. It allows operators to access the platform immediately from their smartphone.
              <span className="block mt-2 text-emerald-400 font-bold">The system will automatically recognise already registered devices, skipping the login form.</span>
            </p>
            <button
              onClick={() => {
                const canvas = document.querySelector('#qr-canvas canvas') || document.querySelector('canvas');
                const dataUrl = canvas?.toDataURL('image/png') || '';
                const win = window.open('', '_blank', 'width=400,height=500');
                win.document.write(`<!DOCTYPE html><html><head><title>QR Code - Lemons in the room</title><style>body{margin:0;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#fff;font-family:sans-serif;}img{width:280px;height:280px;}p{margin-top:16px;font-size:11px;font-weight:900;letter-spacing:.2em;text-transform:uppercase;color:#888;}</style></head><body><img src="${dataUrl}" /><p>Scan to Enter</p><script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script></body></html>`);
                win.document.close();
              }}
              className="px-8 py-4 bg-gradient-to-r from-[#8756FA] to-[#6A35E8] hover:from-[#9C73FA] hover:to-[#8756FA] text-white font-black rounded-2xl transition-all shadow-[0_15px_30px_-10px_rgba(135,86,250,0.5)] hover:scale-105 active:scale-95"
            >
              Print QR Code
            </button>
          </div>
          <div id="qr-canvas" className="bg-white p-6 rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.3)] shrink-0 relative z-10 border border-slate-200 group-hover:rotate-3 transition-transform duration-500">
            <QRCodeCanvas value={window.location.origin} size={220} level="H" includeMargin={false} />
            <div className="mt-4 text-center">
              <span className="text-[10px] font-black tracking-widest uppercase text-slate-400">Scan to Enter</span>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Access Trend (Last 7 days)
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.activityData || []}>
                  <defs>
                    <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#131A33" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#03091B', borderColor: '#131A33', borderRadius: '1rem', color: '#fff' }} />
                  <Area type="monotone" dataKey="logins" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLogins)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#FF8731]" /> Share by Facility
            </h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats?.hospitals || []} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {(stats?.hospitals || []).map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#03091B', borderColor: '#131A33', borderRadius: '1rem', color: '#fff', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
              {(stats?.hospitals || []).map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-xs font-bold text-slate-300">{h.name} <span className="text-slate-500">({h.value})</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drop-off funnel */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl mb-10">
          <h3 className="text-lg font-bold text-white mb-8 flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-400" /> Completion Funnel (Drop-off)
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.completionRates || []} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#131A33" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontWeight: 'bold', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontWeight: 'bold' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RechartsTooltip cursor={{ fill: '#131A33' }} contentStyle={{ backgroundColor: '#03091B', borderColor: '#131A33', borderRadius: '1rem', color: '#fff', fontWeight: 'bold' }} />
                <Bar dataKey="users" radius={[8, 8, 0, 0]}>
                  {(stats?.completionRates || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 4 ? '#FF8731' : '#10B981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operator Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden mb-20">
          <div className="p-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-black text-white">Operator Registry</h3>
                <p className="text-sm text-slate-500 font-medium mt-1 flex items-center gap-3">
                  {filteredUsers.length === allUsersList.length
                    ? `${allUsersList.length} total operators`
                    : `${filteredUsers.length} of ${allUsersList.length} operators`}
                  {totalPages > 1 && <span className="text-slate-600">· Page {currentPage}/{totalPages}</span>}
                  {hasActiveFilters && (
                    <button onClick={resetFilters} className="inline-flex items-center gap-1 text-[#FF8731] hover:text-[#FF9E54] font-bold text-xs transition-colors">
                      <X className="w-3 h-3" /> Clear filters
                    </button>
                  )}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto flex-wrap">
                <select
                  value={hospitalFilter}
                  onChange={(e) => setHospitalFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 px-5 py-3.5 rounded-2xl focus:border-[#FF8731] focus:ring-1 focus:ring-[#FF8731] outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All facilities</option>
                  {uniqueHospitals.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-slate-300 px-5 py-3.5 rounded-2xl focus:border-[#FF8731] focus:ring-1 focus:ring-[#FF8731] outline-none transition-all font-bold text-sm appearance-none cursor-pointer"
                >
                  <option value="all">All statuses</option>
                  <option value="completed">Certified only (100%)</option>
                  <option value="in_progress">In Progress (1–99%)</option>
                  <option value="not_started">Not Started (0%)</option>
                </select>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchParams(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:border-[#FF8731] focus:ring-1 focus:ring-[#FF8731] outline-none transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-800">
                  {[['name', 'Operator'], ['hospital', 'Facility'], ['', 'Profile'], ['percentage', 'Training'], ['loginCount', 'Activity']].map(([col, label]) => (
                    <th key={label} className="px-8 py-5">
                      {col ? (
                        <button onClick={() => handleSort(col)} className="flex items-center gap-1.5 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-white transition-colors">
                          {label} <ArrowUpDown className={`w-3 h-3 ${sortBy === col ? 'text-[#FF8731]' : ''}`} />
                        </button>
                      ) : <span className="text-[10px] uppercase tracking-widest">{label}</span>}
                    </th>
                  ))}
                  <th className="px-8 py-5 text-right text-[10px] uppercase tracking-widest">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {paginatedUsers.length > 0 ? paginatedUsers.map((u, i) => {
                  const globalIndex = (currentPage - 1) * ITEMS_PER_PAGE + i;
                  const nextMod = getNextModule(u.completedModulesList || [], u.patientType);
                  return (
                    <React.Fragment key={globalIndex}>
                      <tr
                        className={`transition-colors cursor-pointer hover:bg-slate-800/30 ${expandedUser === globalIndex ? 'bg-slate-800/50' : ''}`}
                        onClick={() => setExpandedUser(expandedUser === globalIndex ? null : globalIndex)}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-[#FF8731] shadow-inner text-lg">
                              {u.firstName?.[0]}{u.lastName?.[0] || u.name?.[0]}
                            </div>
                            <div>
                              <div className="font-bold text-white text-base flex items-center gap-2">
                                {u.name}
                                {u.isAdmin && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-[#8756FA]/20 text-[#B39BFF] border border-[#8756FA]/30 uppercase tracking-wider">Admin</span>
                                )}
                                {u.firstLogin && u.firstLogin.startsWith(todayStr) && (
                                  <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">New</span>
                                )}
                              </div>
                              <div className="text-xs font-bold px-2 py-0.5 mt-1 rounded-md inline-block bg-slate-800 text-slate-400">
                                {u.mode === 'full' ? 'Free Mode' : 'Guided Path'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-slate-200 text-sm">{u.hospital}</div>
                          <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1"><Building2 className="w-3 h-3" /> {u.department}</div>
                        </td>
                        <td className="px-8 py-6">
                          {u.patientType === 'pediatria'
                            ? <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold"><Baby className="w-3 h-3" />Paediatrics</span>
                            : <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold"><UserRound className="w-3 h-3" />Adults</span>
                          }
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between text-xs font-bold">
                              <span className={u.percentage === 100 ? 'text-emerald-400' : 'text-slate-300'}>{u.progressCount || 0} / {getTotalLessons(u.patientType)} Modules</span>
                              <span className={u.percentage === 100 ? 'text-emerald-400' : 'text-[#FF8731]'}>{u.percentage || 0}%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden w-full max-w-[150px]">
                              <div className={`h-full rounded-full transition-all duration-1000 ${u.percentage === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#FF8731]'}`} style={{ width: `${u.percentage || 0}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="inline-flex items-center gap-1.5 bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-white border border-slate-700">
                              <History className="w-3.5 h-3.5 text-slate-400" />
                              {u.loginCount || 1} Sessions
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">{timeAgo(u.lastLogin)}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {expandedUser === globalIndex ? <ChevronUp className="w-6 h-6 text-slate-400 inline-block" /> : <ChevronDown className="w-6 h-6 text-slate-400 inline-block" />}
                        </td>
                      </tr>

                      <AnimatePresence>
                        {expandedUser === globalIndex && (
                          <tr className="bg-slate-900/80 border-b-0">
                            <td colSpan="6" className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-8 py-6 border-l-4 border-[#FF8731] ml-4 my-2 rounded-r-2xl bg-slate-800/30 overflow-hidden"
                              >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Contact</p>
                                    <div className="space-y-2 text-sm font-medium text-slate-300 mb-5">
                                      <div className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="text-white font-bold">{u.email || '—'}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="text-white font-bold">{u.phone || '—'}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Newsletter:</span>
                                        <span className={`font-bold ${u.newsletterOptIn === true ? 'text-emerald-400' : u.newsletterOptIn === false ? 'text-red-400' : 'text-slate-500'}`}>
                                          {u.newsletterOptIn === true ? 'Subscribed ✓' : u.newsletterOptIn === false ? 'Declined' : 'Pending'}
                                        </span>
                                      </div>
                                    </div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Access History</p>
                                    <div className="space-y-2 text-sm font-medium text-slate-300 mb-5">
                                      <div className="flex justify-between"><span className="text-slate-500">First Login:</span> <span>{new Date(u.firstLogin || u.lastLogin || Date.now()).toLocaleDateString('en-GB')}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Last Login:</span> <span className="text-white font-bold">{new Date(u.lastLogin || Date.now()).toLocaleString('en-GB')}</span></div>
                                      <div className="flex justify-between"><span className="text-slate-500">Total sessions:</span> <span className="text-white font-bold">{u.loginCount || 1}</span></div>
                                    </div>

                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Quick Actions</p>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); resetProgress(u); }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 rounded-xl text-xs font-bold transition-all duration-200"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" /> Reset Progress
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); unlockAll(u); }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 hover:text-emerald-300 rounded-xl text-xs font-bold transition-all duration-200"
                                      >
                                        <Unlock className="w-3.5 h-3.5" /> Unlock All
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); deleteUser(u); }}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold transition-all duration-200"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete Session
                                      </button>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); toggleAdmin(u); }}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 border ${u.isAdmin
                                          ? 'bg-slate-500/10 hover:bg-slate-500/20 border-slate-500/20 hover:border-slate-500/40 text-slate-300 hover:text-white'
                                          : 'bg-[#8756FA]/10 hover:bg-[#8756FA]/20 border-[#8756FA]/20 hover:border-[#8756FA]/40 text-[#B39BFF] hover:text-white'}`}
                                      >
                                        {u.isAdmin ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                        {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                                      </button>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3">Training Path</p>

                                    <div className={`px-4 py-3 rounded-2xl border flex items-center gap-3 ${nextMod
                                      ? 'bg-[#FF8731]/5 border-[#FF8731]/20'
                                      : 'bg-emerald-500/5 border-emerald-500/20'
                                    }`}>
                                      <MapPin className={`w-4 h-4 shrink-0 ${nextMod ? 'text-[#FF8731]' : 'text-emerald-400'}`} />
                                      <div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${nextMod ? 'text-[#FF8731]/70' : 'text-emerald-400/70'}`}>
                                          {nextMod ? 'Next to complete' : 'Status'}
                                        </span>
                                        <p className={`text-sm font-bold ${nextMod ? 'text-white' : 'text-emerald-400'}`}>
                                          {nextMod ? `${MODULE_NAMES[nextMod]}` : 'Path completed ✓'}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" className="px-8 py-16 text-center">
                      <div className="inline-flex flex-col items-center">
                        <Search className="w-12 h-12 text-slate-700 mb-4" />
                        <p className="text-slate-400 font-bold text-lg">No operators found.</p>
                        <p className="text-slate-600 text-sm mt-1">Try adjusting the search filters.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-slate-800 flex items-center justify-between gap-4">
              <span className="text-sm text-slate-500 font-medium">
                {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} operators
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${page === currentPage
                      ? 'bg-[#FF8731] text-white shadow-lg shadow-[#FF8731]/20'
                      : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Email & Newsletter Section */}
        <EmailSection allUsers={allUsersList} />

      </div>
    </div>
  );
};

export default Admin;
