'use client';

import React, { useState } from 'react';

interface AuditConstellationProps {
  onBack: () => void;
  onComplete: () => void;
}

export function AuditConstellation({ onBack, onComplete }: AuditConstellationProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [interactionStep, setInteractionStep] = useState(0);

  const auditInteractions = [
    {
      id: 'verify-credential',
      title: 'Verifikasi Credential',
      description: 'Sistem verifikasi kredensial menggunakan hash chain untuk memastikan integritas data',
      demo: {
        step1: 'Copy credential JSON',
        step2: 'Run verify function',
        step3: 'Hash validation result'
      }
    },
    {
      id: 'equity-buckets',
      title: 'Equity Buckets',
      description: 'Distribusi pemerataan berdasarkan kriteria objektif - bukan ranking individual',
      demo: {
        buckets: [
          { label: 'Terpenuhi Penuh', count: 127, percentage: 45 },
          { label: 'Butuh Dukungan Ringan', count: 89, percentage: 32 },
          { label: 'Prioritas Pemerataan', count: 65, percentage: 23 }
        ]
      }
    },
    {
      id: 'hash-integrity',
      title: 'Hash Chain Integrity',
      description: 'Setiap perubahan tercatat dalam hash chain yang dapat diaudit publik',
      demo: {
        entries: [
          { hash: 'a7f2...d8e1', action: 'Unit verification', timestamp: '2025-01-10 14:32' },
          { hash: 'b9c4...f2a3', action: 'Equity redistribution', timestamp: '2025-01-10 14:28' },
          { hash: 'c1e6...g5b7', action: 'Policy update', timestamp: '2025-01-10 14:15' }
        ]
      }
    }
  ];

  const handleInteraction = (interactionId: string) => {
    setActivePanel(interactionId);
    setTimeout(() => {
      setInteractionStep(prev => prev + 1);
      if (interactionStep >= 2) {
        setTimeout(() => onComplete(), 2000);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-primary-900 hover:text-primary-700 transition-colors"
          >
            <span>←</span>
            <span>Kembali</span>
          </button>
          <h1 className="text-2xl font-bold text-primary-900">
            Audit Constellation
          </h1>
        </div>

        {/* Interactive Audit Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {auditInteractions.map((interaction) => (
            <div
              key={interaction.id}
              className={`card-float cursor-pointer transition-all duration-500 p-6 ${
                activePanel === interaction.id ? 'scale-105 ring-4 ring-primary-300' : 'hover:scale-102'
              }`}
              onClick={() => handleInteraction(interaction.id)}
            >
              <h3 className="text-lg font-semibold text-primary-900 mb-3">
                {interaction.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {interaction.description}
              </p>
              
              {/* Demo Content */}
              {activePanel === interaction.id && (
                <div className="border-t border-gray-200 pt-4 animate-fade-in">
                  {interaction.id === 'verify-credential' && (
                    <div className="space-y-2">
                      <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                        1. {interaction.demo.step1}
                      </div>
                      <div className="text-xs font-mono bg-gray-100 p-2 rounded">
                        2. {interaction.demo.step2}
                      </div>
                      <div className="text-xs font-mono bg-green-100 p-2 rounded text-green-800">
                        ✓ {interaction.demo.step3}
                      </div>
                    </div>
                  )}
                  
                  {interaction.id === 'equity-buckets' && interaction.demo.buckets && (
                    <div className="space-y-2">
                      {interaction.demo.buckets.map((bucket, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{bucket.label}</span>
                          <span className="font-medium">{bucket.count} ({bucket.percentage}%)</span>
                        </div>
                      ))}
                      <div className="text-xs text-gray-500 mt-2">
                        *Bukan ranking - distribusi berdasarkan kebutuhan objektif
                      </div>
                    </div>
                  )}
                  
                  {interaction.id === 'hash-integrity' && interaction.demo.entries && (
                    <div className="space-y-2">
                      {interaction.demo.entries.map((entry, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="font-mono text-gray-700">{entry.hash}</div>
                          <div className="text-gray-500">{entry.action} • {entry.timestamp}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Progress Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
            <span className="text-sm text-gray-600">
              Langkah {Math.min(interactionStep + 1, 3)} dari 3
            </span>
            <div className="flex gap-1">
              {[0, 1, 2].map((step) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step <= interactionStep ? 'bg-primary-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {interactionStep >= 2 && (
          <div className="text-center mt-8 animate-fade-in">
            <p className="text-primary-900 font-medium">
              Audit selesai • Transisi ke struktur landing...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}