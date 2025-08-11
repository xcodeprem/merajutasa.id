'use client';

import React from 'react';

interface LandingCompositionProps {
  onReset: () => void;
}

export function LandingComposition({ onReset }: LandingCompositionProps) {
  const sections = [
    {
      id: 'integrity-equity',
      title: 'Integrity & Equity',
      modules: [
        {
          name: 'Integrity Credential',
          description: 'Sistem verifikasi kredensial dengan hash chain untuk memastikan integritas data setiap unit kesejahteraan anak.',
          status: 'Aktif • 99.7% tingkat verifikasi'
        },
        {
          name: 'Equity Index',
          description: 'Indeks pemerataan berdasarkan distribusi kebutuhan objektif, bukan ranking individual.',
          status: 'Monitoring • Index 0.71 (Meningkat)'
        }
      ]
    },
    {
      id: 'governance-hash',
      title: 'Governance & Hash Integrity',
      modules: [
        {
          name: 'Governance Decisions',
          description: 'Sistem keputusan terbuka dengan policy guard dan audit trail untuk setiap perubahan kebijakan.',
          status: '7 keputusan pending • Transparansi penuh'
        },
        {
          name: 'Hash Chain Integrity',
          description: 'Setiap perubahan data tercatat dalam hash chain yang dapat diaudit publik.',
          status: '142K entri hash • Continuous integrity'
        }
      ]
    },
    {
      id: 'terminology-participation',
      title: 'Terminology & Participation',
      modules: [
        {
          name: 'Terminology Adoption',
          description: 'Transisi terminologi dengan sistem dual-term untuk memastikan pemahaman yang konsisten.',
          status: '84% adopsi dual-term • Stage 1'
        },
        {
          name: 'Feedback Participation',
          description: 'Platform partisipasi publik untuk masukan dan perbaikan sistem berkelanjutan.',
          status: '1,247 masukan diterima • Anonimized'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header with Hero Summary */}
      <div className="bg-gradient-to-b from-primary-50 to-white border-b border-primary-100">
        <div className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-primary-900 mb-6">
            Semua modul yang Anda lihat di atas tersedia publik—dengan batas privasi ketat.
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            MerajutASA menggunakan arsitektur privacy-by-design untuk memberikan transparansi 
            tanpa mengorbankan privasi individu. Setiap modul dapat diaudit publik.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <button className="btn-primary">
              Lihat Unit Terverifikasi
            </button>
            <button className="btn-secondary">
              Pahami Pemerataan
            </button>
            <button 
              onClick={onReset}
              className="btn-secondary"
            >
              Metodologi & Governance
            </button>
          </div>
        </div>
      </div>

      {/* Modular Sections */}
      <div className="container mx-auto px-6 py-16">
        <div className="space-y-16">
          {sections.map((section, index) => (
            <div key={section.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.2}s` }}>
              <h2 className="text-3xl font-bold text-primary-900 mb-8 text-center">
                {section.title}
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                {section.modules.map((module) => (
                  <div key={module.name} className="card-float p-8">
                    <h3 className="text-xl font-semibold text-primary-900 mb-4">
                      {module.name}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {module.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-green-700 font-medium">
                        {module.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Key Principles Section */}
        <div className="mt-24 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-center text-primary-900 mb-12">
            Prinsip Inti MerajutASA
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="font-semibold text-primary-900 mb-2">
                Integrity & Equity Before Scale
              </h3>
              <p className="text-sm text-gray-600">
                Integritas dan pemerataan diprioritaskan sebelum skalabilitas
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-semibold text-primary-900 mb-2">
                Privacy-by-Architecture
              </h3>
              <p className="text-sm text-gray-600">
                Privasi dibangun dalam arsitektur, bukan tambahan
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">⚖️</div>
              <h3 className="font-semibold text-primary-900 mb-2">
                Non-Ranking Fairness
              </h3>
              <p className="text-sm text-gray-600">
                Pemerataan tanpa ranking atau profiling individual
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold text-primary-900 mb-2">
                Guarded Exposure Model
              </h3>
              <p className="text-sm text-gray-600">
                Tingkat akses L0-L4 sesuai kebutuhan dan otorisasi
              </p>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-6">
            Siap menjelajahi sistem verifikasi data kesejahteraan anak yang transparan dan adil?
          </p>
          <button 
            onClick={onReset}
            className="btn-primary text-lg px-8 py-4"
          >
            Mulai Eksplorasi Ulang
          </button>
        </div>
      </div>
    </div>
  );
}