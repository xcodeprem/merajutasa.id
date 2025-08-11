'use client';

import React from 'react';
import { ExplorationAction } from '@/types';

const actions: ExplorationAction[] = [
  {
    id: 'search-units',
    label: 'Cari Unit Terverifikasi',
    icon: '🏛️',
    action: 'search',
    description: 'Temukan unit kesejahteraan anak yang telah diverifikasi'
  },
  {
    id: 'view-equity',
    label: 'Lihat Pemerataan (Equity)',
    icon: '⚖️',
    action: 'equity',
    description: 'Lihat bagaimana distribusi pemenuhan kebutuhan terukur'
  },
  {
    id: 'verify-credential',
    label: 'Verifikasi Credential',
    icon: '🔐',
    action: 'verify',
    description: 'Verifikasi kredensial dan integritas data'
  },
  {
    id: 'methodology',
    label: 'Metodologi & Batas',
    icon: '📚',
    action: 'methodology',
    description: 'Pelajari metodologi dan batasan sistem'
  },
  {
    id: 'terminology',
    label: 'Terminologi Transisi',
    icon: '🔄',
    action: 'terminology',
    description: 'Pahami transisi terminologi dan definisi'
  },
  {
    id: 'feedback',
    label: 'Kirim Masukan',
    icon: '💬',
    action: 'feedback',
    description: 'Berikan masukan untuk perbaikan sistem'
  }
];

interface ExplorationHubProps {
  onActionClick: (action: string) => void;
}

export function ExplorationHub({ onActionClick }: ExplorationHubProps) {
  return (
    <div className="mb-16">
      <h2 className="text-lg font-medium text-white/80 mb-6 text-center">
        Jelajahi Sistem Verifikasi
      </h2>
      
      {/* Action Pills Grid */}
      <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.action)}
            className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-4 py-3 rounded-full text-white transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label={action.description}
          >
            <span className="text-lg" aria-hidden="true">
              {action.icon}
            </span>
            <span className="font-medium text-sm lg:text-base">
              {action.label}
            </span>
          </button>
        ))}
      </div>
      
      <p className="text-center text-white/60 mt-6 text-sm">
        Klik salah satu opsi untuk mulai menjelajahi sistem
      </p>
    </div>
  );
}