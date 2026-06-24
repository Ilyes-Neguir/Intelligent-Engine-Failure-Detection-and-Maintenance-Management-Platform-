import { useEffect, useState } from 'react';
import { Car, Plus, Pencil, Trash2, X, Save, AlertTriangle, WifiOff } from 'lucide-react';
import { vehiclesApi } from '../../api/vehicles';
import type { CreateVehiclePayload, UpdateVehiclePayload } from '../../api/vehicles';
import type { Vehicle } from '../../types';
import { ApiError, NetworkError } from '../../api/client';
import { EmptyState } from '../../components/common/EmptyState';
import { PageLoader } from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';

const CURRENT_YEAR = new Date().getFullYear();
const BLANK_FORM = { make: '', model: '', year: CURRENT_YEAR, vin: '', licensePlate: '', engineType: '', mileage: '' };

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchVehicles = async () => {
    setLoadError('');
    try {
      // GET /api/vehicles/my — JWT-identity-based, no userId in path
      const data = await vehiclesApi.getMy();
      setVehicles(data);
    } catch (err) {
      const msg = err instanceof NetworkError
        ? err.message
        : err instanceof ApiError
          ? (err.data?.message ?? 'Failed to load vehicles')
          : 'Failed to load vehicles';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const openCreate = () => {
    setEditVehicle(null);
    setForm(BLANK_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (v: Vehicle) => {
    setEditVehicle(v);
    setForm({
      make: v.make, model: v.model, year: v.year,
      vin: v.vin, licensePlate: v.licensePlate ?? '',
      engineType: v.engineType ?? '', mileage: v.mileage?.toString() ?? '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editVehicle) {
        const payload: UpdateVehiclePayload = {
          make: form.make, model: form.model, year: Number(form.year),
          licensePlate: form.licensePlate || undefined,
          engineType: form.engineType || undefined,
          mileage: form.mileage ? Number(form.mileage) : undefined,
        };
        // PUT /api/vehicles/{id} — no userId in path
        await vehiclesApi.update(editVehicle.id, payload);
        toast.success('Vehicle updated');
      } else {
        const payload: CreateVehiclePayload = {
          make: form.make, model: form.model, year: Number(form.year),
          vin: form.vin,
          licensePlate: form.licensePlate || undefined,
          engineType: form.engineType || undefined,
          mileage: form.mileage ? Number(form.mileage) : undefined,
        };
        // POST /api/vehicles — no userId in path
        await vehiclesApi.create(payload);
        toast.success('Vehicle added');
      }
      setModalOpen(false);
      fetchVehicles();
    } catch (err) {
      // Preserve form state on error (don't close modal)
      if (err instanceof NetworkError) {
        setFormError(err.message);
      } else if (err instanceof ApiError) {
        if (err.status >= 500) {
          setFormError(`Server error (${err.status}). Please retry — your data is preserved.`);
        } else {
          setFormError(err.data?.message ?? err.data?.details ?? 'Failed to save vehicle');
        }
      } else {
        setFormError('Unexpected error. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // DELETE /api/vehicles/{id} — no userId in path
      await vehiclesApi.delete(deleteTarget.id);
      toast.success('Vehicle removed');
      setDeleteTarget(null);
      fetchVehicles();
    } catch (err) {
      const msg = err instanceof NetworkError
        ? err.message
        : err instanceof ApiError
          ? (err.data?.message ?? 'Failed to delete')
          : 'Failed to delete';
      toast.error(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <PageLoader label="Loading vehicles..." />;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-slate-800">My Vehicles</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle
        </button>
      </div>

      {/* Load error banner */}
      {loadError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <WifiOff className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700">{loadError}</p>
            <button onClick={fetchVehicles} className="text-xs text-red-500 hover:text-red-700 mt-1 underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Vehicles grid */}
      {vehicles.length === 0 && !loadError ? (
        <EmptyState
          icon={Car}
          title="No vehicles registered"
          description="Add your first vehicle to start scheduling diagnostic bookings."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Vehicle
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map(v => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Car className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-slate-800">{v.make} {v.model}</h3>
                    <span className="text-xs text-slate-500">{v.year}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(v)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(v)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-1.5">
                <InfoRow label="VIN" value={v.vin} mono />
                {v.licensePlate && <InfoRow label="Plate" value={v.licensePlate} />}
                {v.engineType && <InfoRow label="Engine" value={v.engineType} />}
                {v.mileage != null && <InfoRow label="Mileage" value={`${v.mileage.toLocaleString()} km`} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vehicle Modal */}
      {modalOpen && (
        <Modal title={editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            {formError && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Make *" value={form.make} onChange={set('make')} placeholder="e.g. Toyota" required />
              <FormField label="Model *" value={form.model} onChange={set('model')} placeholder="e.g. Camry" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1.5">Year *</label>
                <input
                  type="number"
                  required
                  min={1900}
                  max={CURRENT_YEAR + 1}
                  value={form.year}
                  onChange={set('year')}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>
              <FormField
                label="License Plate"
                value={form.licensePlate}
                onChange={set('licensePlate')}
                placeholder="e.g. ABC-1234"
              />
            </div>

            {!editVehicle && (
              <FormField
                label="VIN * (17 chars)"
                value={form.vin}
                onChange={set('vin')}
                placeholder="17-character VIN"
                required
                mono
                maxLength={17}
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Engine Type"
                value={form.engineType}
                onChange={set('engineType')}
                placeholder="e.g. 2.5L I4 Petrol"
              />
              <FormField
                label="Mileage (km)"
                value={form.mileage}
                onChange={set('mileage')}
                type="number"
                placeholder="e.g. 45000"
                min="0"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {saving ? <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? 'Saving...' : 'Save Vehicle'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <Modal title="Delete Vehicle" onClose={() => setDeleteTarget(null)}>
          <div className="flex items-start gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-700">
                Are you sure you want to remove <strong>{deleteTarget.make} {deleteTarget.model} ({deleteTarget.year})</strong>?
                This cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
            >
              {deleting ? <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs text-slate-700 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

function FormField({
  label, value, onChange, placeholder, required, mono, type = 'text', maxLength, min,
}: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; required?: boolean; mono?: boolean; type?: string; maxLength?: number; min?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        min={min}
        className={`w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition ${mono ? 'font-mono uppercase' : ''}`}
      />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-slate-800">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
