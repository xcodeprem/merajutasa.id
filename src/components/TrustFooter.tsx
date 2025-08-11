'use client';

import React from 'react';
import { TrustMetric } from '@/types';

const trustMetrics: TrustMetric[] = [
  {
    id: 'coverage',
    label: 'Coverage',
    value: '89%',
    description: 'Persentase unit yang terverifikasi dalam sistem'
  },
  {
    id: 'verified',
    label: 'Verified%',
    value: '97.3%',
    description: 'Tingkat verifikasi data yang berhasil'
  },
  {
    id: 'equity-index',
    label: 'Equity Index',
    value: '0.71',
    description: 'Indeks pemerataan distribusi (0-1, semakin tinggi semakin merata)'
  },
  {
    id: 'incident-free',
    label: 'Incident-Free Days',
    value: '247',
    description: 'Hari tanpa insiden privasi atau keamanan'
  }
];

export function TrustFooter() {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm border-t border-white/10">
      <div className="container mx-auto px-6 py-6">
        <div className="flex flex-wrap justify-center gap-8 lg:gap-16">
          {trustMetrics.map((metric) => (
            <div
              key={metric.id}
              className="text-center group cursor-help"
              title={metric.description}
            >
              <div className="text-xl lg:text-2xl font-bold text-white mb-1">
                {metric.value}
              </div>
              <div className="text-xs lg:text-sm text-white/70 uppercase tracking-wide">
                {metric.label}
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-6">
          <p className="text-white/50 text-xs">
            Transparansi data real-time • Audit publik tersedia • Privacy-by-Architecture
          </p>
        </div>
      </div>
    </div>
  );
}