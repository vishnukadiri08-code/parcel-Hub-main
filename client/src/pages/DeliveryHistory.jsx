import React, { useEffect, useMemo, useState } from 'react';
import { Download, History, Package, RefreshCw, Search, Trash2 } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDateTime, formatPhone } from '../utils/formatters';

export default function DeliveryHistory() {
  const { user, isAdmin } = useAuth();
  const toast = useToast();
  const [parcels, setParcels] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingSelected, setDeletingSelected] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const records = await api.get('/api/parcels/history');
      setParcels(records);
    } catch (error) {
      console.error('Failed to load parcel history:', error);
      toast.error('HISTORY UNAVAILABLE', 'Could not load parcel records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await api.download('/api/export/history', 'CampusParcelHub_History.xlsx');
      toast.success('HISTORY DOWNLOADED', `${parcels.length} parcel records exported to Excel.`);
    } catch (error) {
      console.error('Failed to download parcel history:', error);
      toast.error('DOWNLOAD FAILED', error.message || 'Could not download parcel history.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async (parcel) => {
    const parcelNumber = `CPH-${String(parcel.id).padStart(5, '0')}`;
    const confirmed = window.confirm(
      `Permanently delete ${parcelNumber} for ${parcel.person_name}?\n\nThis cannot be undone. A deletion event will remain in the audit log.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/parcels/history/${parcel.id}`);
      setParcels((current) => current.filter((record) => record.id !== parcel.id));
      setSelectedIds((current) => current.filter((id) => id !== parcel.id));
      toast.success('PARCEL DELETED', `${parcelNumber} was permanently deleted.`);
    } catch (error) {
      console.error('Failed to delete parcel history record:', error);
      toast.error('DELETE FAILED', error.message || 'Could not delete parcel history record.');
    }
  };

  const canDeleteParcel = (parcel) => (
    isAdmin || (user?.role === 'staff' && parcel.status === 'Delivered')
  );

  const filteredParcels = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return parcels;

    return parcels.filter((parcel) => [
      parcel.person_name,
      parcel.phone,
      parcel.app_name,
      parcel.tracking_id,
      parcel.rack_no,
      parcel.received_by,
      parcel.delivered_by,
      parcel.status
    ].some((value) => String(value || '').toLowerCase().includes(term)));
  }, [parcels, searchTerm]);

  const selectableParcels = filteredParcels.filter(canDeleteParcel);
  const allVisibleSelected = selectableParcels.length > 0
    && selectableParcels.every((parcel) => selectedIds.includes(parcel.id));

  const toggleParcelSelection = (parcelId) => {
    setSelectedIds((current) => (
      current.includes(parcelId)
        ? current.filter((id) => id !== parcelId)
        : [...current, parcelId]
    ));
  };

  const toggleVisibleSelection = () => {
    const visibleIds = selectableParcels.map((parcel) => parcel.id);
    setSelectedIds((current) => (
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    ));
  };

  const handleDeleteSelected = async () => {
    const selectedParcels = parcels.filter(
      (parcel) => selectedIds.includes(parcel.id) && canDeleteParcel(parcel)
    );
    if (selectedParcels.length === 0) return;

    const confirmed = window.confirm(
      `Permanently delete ${selectedParcels.length} selected parcel record${selectedParcels.length === 1 ? '' : 's'}?\n\nThis cannot be undone. Deletion events will remain in the audit log.`
    );
    if (!confirmed) return;

    setDeletingSelected(true);
    const deletedIds = [];
    const failedParcels = [];
    for (const parcel of selectedParcels) {
      try {
        await api.delete(`/api/parcels/history/${parcel.id}`);
        deletedIds.push(parcel.id);
      } catch (error) {
        console.error(`Failed to delete parcel history record ${parcel.id}:`, error);
        failedParcels.push(parcel);
      }
    }

    setParcels((current) => current.filter((parcel) => !deletedIds.includes(parcel.id)));
    setSelectedIds(failedParcels.map((parcel) => parcel.id));
    setDeletingSelected(false);

    if (failedParcels.length > 0) {
      toast.error(
        'SOME PARCELS COULD NOT BE DELETED',
        `${deletedIds.length} deleted; ${failedParcels.length} failed. Failed parcel IDs: ${failedParcels.map((parcel) => `CPH-${String(parcel.id).padStart(5, '0')}`).join(', ')}.`
      );
    } else {
      toast.success('PARCELS DELETED', `${deletedIds.length} selected parcel record${deletedIds.length === 1 ? '' : 's'} permanently deleted.`);
      setSelectionMode(false);
    }
  };

  return (
    <section className="space-y-6 pb-12">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/20 bg-neutral-900 p-3 text-white">
            <History className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              PARCEL HISTORY
            </h1>
            
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectionMode((current) => !current);
              setSelectedIds([]);
            }}
            disabled={loading || deletingSelected}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
          >
            {selectionMode ? 'Cancel selection' : 'Select'}
          </button>
          {selectionMode && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              disabled={selectedIds.length === 0 || deletingSelected}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deletingSelected ? 'Deleting…' : `Delete selected${selectedIds.length ? ` (${selectedIds.length})` : ''}`}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Preparing…' : 'Download Excel'}
          </button>
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            aria-label="Refresh history"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm text-white transition-colors hover:bg-white hover:text-black disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </header>

      <div className="rounded-2xl border border-white/15 bg-neutral-950 p-4 sm:p-5">
        <label className="relative block">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search name, phone, carrier, rack, tracking ID, or status"
            className="glass-input w-full rounded-xl py-3 pl-11 pr-4 text-sm"
          />
        </label>
        <p className="mt-3 text-xs text-slate-400">
          {loading ? 'Loading parcel records…' : `${filteredParcels.length} of ${parcels.length} parcel records`}
        </p>
      </div>

      {loading ? (
        <div className="h-40 animate-pulse rounded-2xl border border-white/10 bg-neutral-900" />
      ) : filteredParcels.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-2xl border border-dashed border-white/20 bg-neutral-950 px-6 py-14 text-center">
          <Package className="mx-auto h-9 w-9 text-slate-400" />
          <h2 className="mt-4 text-base font-semibold text-white">
            {parcels.length === 0 ? 'No parcel history yet' : 'No matching parcels'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {parcels.length === 0
              ? 'Parcels will appear here as soon as they are added, and stay in the history after delivery.'
              : 'Try another name, phone number, carrier, rack, tracking ID, or status.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/15 bg-neutral-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/15 bg-neutral-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  {selectionMode && (
                    <th className="px-4 py-3">
                      <label className="inline-flex items-center gap-2 normal-case">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleVisibleSelection}
                          disabled={selectableParcels.length === 0 || deletingSelected}
                          aria-label="Select all visible deletable parcels"
                          className="h-4 w-4 accent-white"
                        />
                        Select all
                      </label>
                    </th>
                  )}
                  <th className="px-4 py-3">Parcel / Recipient</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Carrier / Tracking</th>
                  <th className="px-4 py-3">Rack</th>
                  <th className="px-4 py-3">Received</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Delivered</th>
                  {(isAdmin || user?.role === 'staff') && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {filteredParcels.map((parcel) => (
                  <tr key={parcel.id} className="hover:bg-white/[0.03]">
                    {selectionMode && (
                      <td className="px-4 py-3">
                        {canDeleteParcel(parcel) && (
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(parcel.id)}
                            onChange={() => toggleParcelSelection(parcel.id)}
                            disabled={deletingSelected}
                            aria-label={`Select parcel for ${parcel.person_name}`}
                            className="h-4 w-4 accent-white"
                          />
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{parcel.person_name}</p>
                      <p className="mt-1 text-xs text-slate-500">CPH-{String(parcel.id).padStart(5, '0')}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatPhone(parcel.phone)}</td>
                    <td className="px-4 py-3">
                      <p>{parcel.app_name}</p>
                      <p className="mt-1 text-xs text-slate-400">{parcel.tracking_id || 'No tracking ID'}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{parcel.rack_no}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{formatDateTime(parcel.received_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
                        parcel.status === 'Delivered'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : parcel.status === 'Pending'
                          ? 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                          : 'border-white/20 bg-neutral-800 text-white'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          parcel.status === 'Delivered'
                            ? 'bg-emerald-400'
                            : parcel.status === 'Pending'
                            ? 'bg-orange-400'
                            : 'bg-slate-400'
                        }`} />
                        {parcel.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      {parcel.delivered_at ? formatDateTime(parcel.delivered_at) : '—'}
                    </td>
                    {(isAdmin || (user?.role === 'staff' && parcel.status === 'Delivered')) && (
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(parcel)}
                          aria-label={`Permanently delete parcel for ${parcel.person_name}`}
                          title="Permanently delete this parcel and its history"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-white hover:bg-white hover:text-black"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
