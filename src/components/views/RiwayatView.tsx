import React from 'react';
import { MovementLog } from '../../types';
import { getKondisiBadge } from '../../utils/helpers';
import { History, MapPin, Clock, ArrowRight, UserCheck } from 'lucide-react';

interface RiwayatViewProps {
  movementLogs: MovementLog[];
}

export const RiwayatView: React.FC<RiwayatViewProps> = ({ movementLogs }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <History className="w-4 h-4" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-slate-900">
              Riwayat Perpindahan Ruangan & Perubahan Posisi
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Log kronologis pergerakan staf antar unit pelayanan serta mutasi kondisi operasional pelayanan.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          {movementLogs.length} Catatan Log
        </span>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {movementLogs.map((log) => {
            const badge = getKondisiBadge(log.kondisi);

            return (
              <div key={log.id} className="relative group">
                {/* Timeline Dot */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-4 border-blue-600 shadow-xs group-hover:scale-125 transition-transform" />

                <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 hover:bg-white hover:shadow-xs transition space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {log.pegawaiNama}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ({log.nip})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {log.timestamp} WIB
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.badgeClass}`}>
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  {/* Room Move Detail */}
                  <div className="flex items-center gap-2 text-xs text-slate-700 flex-wrap">
                    {log.dariUnit ? (
                      <>
                        <span className="text-slate-500">{log.dariUnit}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </>
                    ) : null}
                    <span className="font-bold text-blue-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {log.keUnit} ({log.lantai})
                    </span>
                    <span className="text-slate-400">• {log.tempatKerja}</span>
                  </div>

                  {log.catatan && (
                    <div className="text-xs text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60 italic">
                      "{log.catatan}"
                    </div>
                  )}

                  {log.coordinates && (
                    <div className="text-[10px] text-slate-400 font-mono">
                      Koordinat GPS: {log.coordinates.lat.toFixed(5)}, {log.coordinates.lng.toFixed(5)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
