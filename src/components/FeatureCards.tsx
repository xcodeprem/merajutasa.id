'use client';

import React from 'react';
import { FeatureCard } from '@/types';

const featureCards: FeatureCard[] = [
  {
    id: 'integrity-credential',
    title: 'Integrity Credential',
    description: 'Verifikasi kredensial dengan hash chain',
    icon: '✅',
    status: 'active',
    metrics: {
      value: '99.7%',
      label: 'Tingkat Verifikasi',
      trend: 'stable'
    }
  },
  {
    id: 'equity-index',
    title: 'Equity Index',
    description: 'Indeks pemerataan berdasarkan distribusi',
    icon: '📊',
    status: 'monitoring',
    metrics: {
      value: '0.71',
      label: 'Indeks Gini Terbalik',
      trend: 'up'
    }
  },
  {
    id: 'underserved-monitor',
    title: 'Under-Served Monitor',
    description: 'Pemantauan unit yang membutuhkan pemerataan',
    icon: '🎯',
    status: 'active',
    metrics: {
      value: 23,
      label: 'Unit Diprioritaskan',
      trend: 'down'
    }
  },
  {
    id: 'hash-log',
    title: 'Hash Chain Integrity',
    description: 'Log hash untuk audit trail transparan',
    icon: '🔗',
    status: 'active',
    metrics: {
      value: '142K',
      label: 'Entri Hash',
      trend: 'up'
    }
  },
  {
    id: 'governance-decisions',
    title: 'Governance Decisions',
    description: 'Keputusan governance dan policy updates',
    icon: '⚖️',
    status: 'monitoring',
    metrics: {
      value: 7,
      label: 'Keputusan Pending',
      trend: 'stable'
    }
  },
  {
    id: 'terminology-progress',
    title: 'Terminology Adoption',
    description: 'Progres adopsi terminologi baru',
    icon: '📝',
    status: 'active',
    metrics: {
      value: '84%',
      label: 'Adopsi Dual-Term',
      trend: 'up'
    }
  },
  {
    id: 'feedback-participation',
    title: 'Feedback Participation',
    description: 'Tingkat partisipasi masukan publik',
    icon: '💭',
    status: 'monitoring',
    metrics: {
      value: 1247,
      label: 'Masukan Diterima',
      trend: 'up'
    }
  }
];

interface FeatureCardsProps {
  onCardClick: (cardId: string) => void;
}

export function FeatureCards({ onCardClick }: FeatureCardsProps) {
  return (
    <div className="relative">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {featureCards.map((card, index) => (
          <div
            key={card.id}
            className={`card-float hover:scale-105 cursor-pointer animate-float p-6 ${
              index % 2 === 0 ? 'lg:translate-y-4' : ''
            }`}
            style={{
              animationDelay: `${index * 0.2}s`,
              animationDuration: `${4 + index * 0.5}s`
            }}
            onClick={() => onCardClick(card.id)}
          >
            {/* Status Indicator */}
            <div className="flex items-center justify-between mb-4">
              <div className={`w-2 h-2 rounded-full ${
                card.status === 'active' ? 'bg-green-500' :
                card.status === 'monitoring' ? 'bg-yellow-500' : 'bg-gray-400'
              }`} />
              <span className="text-2xl" aria-hidden="true">
                {card.icon}
              </span>
            </div>
            
            {/* Card Content */}
            <h3 className="font-semibold text-gray-900 mb-2 text-lg">
              {card.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {card.description}
            </p>
            
            {/* Metrics */}
            {card.metrics && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-primary-900">
                      {card.metrics.value}
                    </div>
                    <div className="text-xs text-gray-500">
                      {card.metrics.label}
                    </div>
                  </div>
                  {card.metrics.trend && (
                    <div className={`text-sm ${
                      card.metrics.trend === 'up' ? 'text-green-600' :
                      card.metrics.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {card.metrics.trend === 'up' ? '↗' :
                       card.metrics.trend === 'down' ? '↘' : '→'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="text-center mt-12">
        <p className="text-white/60 text-sm">
          Klik kartu mana saja untuk melihat detail audit dan verifikasi
        </p>
      </div>
    </div>
  );
}