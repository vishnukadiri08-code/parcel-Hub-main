export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString.replace(' ', 'T'));
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

export function formatTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString.replace(' ', 'T'));
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString.replace(' ', 'T'));
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
  } catch (e) {
    return dateString;
  }
}

export function getDaysWaiting(receivedAt) {
  if (!receivedAt) return 0;
  const received = new Date(receivedAt.replace(' ', 'T')).getTime();
  const now = new Date().getTime();
  const diffDays = Math.floor((now - received) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getAppMeta(appName) {
  const norm = (appName || '').toLowerCase();
  if (norm.includes('amazon')) {
    return {
      name: 'Amazon',
      bg: 'bg-amber-500/10 border-amber-600/30 text-amber-300',
      tagColor: '#d97706',
      short: 'AMZ'
    };
  }
  if (norm.includes('flipkart')) {
    return {
      name: 'Flipkart',
      bg: 'bg-blue-500/10 border-blue-600/30 text-blue-300',
      tagColor: '#2563eb',
      short: 'FK'
    };
  }
  if (norm.includes('meesho')) {
    return {
      name: 'Meesho',
      bg: 'bg-fuchsia-500/10 border-fuchsia-600/30 text-fuchsia-300',
      tagColor: '#c026d3',
      short: 'MSH'
    };
  }
  if (norm.includes('myntra')) {
    return {
      name: 'Myntra',
      bg: 'bg-rose-500/10 border-rose-600/30 text-rose-300',
      tagColor: '#e11d48',
      short: 'MYN'
    };
  }
  if (norm.includes('bluedart')) {
    return {
      name: 'BlueDart',
      bg: 'bg-indigo-500/10 border-indigo-600/30 text-indigo-300',
      tagColor: '#4f46e5',
      short: 'BLU'
    };
  }
  if (norm.includes('delhivery')) {
    return {
      name: 'Delhivery',
      bg: 'bg-red-500/10 border-red-600/30 text-red-300',
      tagColor: '#dc2626',
      short: 'DEL'
    };
  }
  return {
    name: appName || 'Carrier',
    bg: 'bg-slate-800 border-slate-700 text-slate-300',
    tagColor: '#64748b',
    short: 'PKG'
  };
}

export function formatPhone(phone) {
  if (!phone) return '—';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return phone;
}
