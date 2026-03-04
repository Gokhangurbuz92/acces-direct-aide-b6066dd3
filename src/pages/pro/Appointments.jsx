// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { ListSkeleton } from '@/components/pro/ProPageSkeletons';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { proRdvClient } from '@/api/pro-rdv-client';

function formatDateTime(raw) {
  if (!raw) return '-';
  const date = new Date(String(raw));
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  });
}

function toDateIso(dateValue, kind) {
  const normalized = String(dateValue || '').trim();
  if (!normalized) return '';
  const suffix = kind === 'start' ? 'T00:00:00.000Z' : 'T23:59:59.999Z';
  return `${normalized}${suffix}`;
}

const STATUS_STYLES = {
  booked: 'border-blue-200 bg-blue-50 text-blue-800',
  cancelled: 'border-rose-200 bg-rose-50 text-rose-800',
  done: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

export default function ProAppointments() {
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({
    serviceId: '',
    status: '',
    fromDate: new Date().toISOString().slice(0, 10),
    toDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    const from = toDateIso(filters.fromDate, 'start');
    const to = toDateIso(filters.toDate, 'end');

    try {
      const [servicesResponse, appointmentsResponse] = await Promise.all([
        proRdvClient.services.list(),
        proRdvClient.appointments.list({
          from: from || undefined,
          to: to || undefined,
          status: filters.status || undefined,
          pageSize: 100,
        }),
      ]);

      setServices(Array.isArray(servicesResponse) ? servicesResponse : []);
      const items = Array.isArray(appointmentsResponse?.items) ? appointmentsResponse.items : [];
      const filteredByService =
        filters.serviceId && filters.serviceId !== ''
          ? items.filter((item) => item.serviceId === filters.serviceId)
          : items;
      setAppointments(filteredByService);
    } catch {
      setError('Impossible de charger l\'agenda.');
    } finally {
      setLoading(false);
    }
  }, [filters.fromDate, filters.toDate, filters.status, filters.serviceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const serviceOptions = useMemo(() => {
    return services.map((service) => ({ id: service.id, name: service.name }));
  }, [services]);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    setError('');
    try {
      if (status === 'cancelled') {
        await proRdvClient.appointments.cancelLegacy(id);
      } else {
        await proRdvClient.appointments.update(id, { status });
      }
      await loadData();
    } catch {
      setError('Impossible de mettre a jour ce rendez-vous.');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Agenda</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button asChild>
            <Link to="/pro/rdv/new">Creer un RDV</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Service</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={filters.serviceId}
              onChange={(event) => setFilters((prev) => ({ ...prev, serviceId: event.target.value }))}
            >
              <option value="">Tous</option>
              {serviceOptions.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Statut</span>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            >
              <option value="">Tous</option>
              <option value="booked">booked</option>
              <option value="cancelled">cancelled</option>
              <option value="done">done</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Du</span>
            <Input
              type="date"
              value={filters.fromDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, fromDate: event.target.value }))}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Au</span>
            <Input
              type="date"
              value={filters.toDate}
              onChange={(event) => setFilters((prev) => ({ ...prev, toDate: event.target.value }))}
            />
          </label>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
      ) : null}

      {loading ? (
        <ListSkeleton count={4} />
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-sm text-slate-600">
            <Calendar className="h-10 w-10 text-slate-300" />
            Aucun rendez-vous sur cette periode.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const statusClass = STATUS_STYLES[appointment.status] || 'border-slate-200 bg-slate-100 text-slate-700';
            return (
              <Card key={appointment.id}>
                <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{formatDateTime(appointment.startAt || appointment.start_at)}</p>
                      <Badge className={statusClass}>{appointment.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">
                      {appointment.serviceName || 'Service'}
                      {' - '}
                      {appointment.beneficiaryName || 'Beneficiaire'}
                    </p>
                    {appointment.notes ? <p className="text-xs text-slate-500">{appointment.notes}</p> : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {appointment.status !== 'done' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(appointment.id, 'done')}
                        disabled={updatingId === appointment.id}
                      >
                        {updatingId === appointment.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-1 h-4 w-4" />}
                        Marquer done
                      </Button>
                    ) : null}

                    {appointment.status !== 'cancelled' ? (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateStatus(appointment.id, 'cancelled')}
                        disabled={updatingId === appointment.id}
                      >
                        {updatingId === appointment.id ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <XCircle className="mr-1 h-4 w-4" />}
                        Annuler
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
