'use client';

import React, { useState, useEffect } from 'react';
import { ExplorationHub } from '@/components/ExplorationHub';
import { FeatureCards } from '@/components/FeatureCards';
import { TrustFooter } from '@/components/TrustFooter';
import { AuditConstellation } from '@/components/AuditConstellation';
import { LandingComposition } from '@/components/LandingComposition';

type SceneState = 'hero' | 'audit' | 'composition';

export default function Home() {
  const [scene, setScene] = useState<SceneState>('hero');
  const [headlineIndex, setHeadlineIndex] = useState(0);

  const headlines = [
    "Temukan unit kesejahteraan anak yang telah diverifikasi.",
    "Lihat bagaimana distribusi pemenuhan kebutuhan terukur.",
    "Audit perubahan melalui hash chain & policy guard."
  ];

  // Rotate headlines every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [headlines.length]);

  const handleSceneTransition = (nextScene: SceneState) => {
    setScene(nextScene);
  };

  return (
    <main className="min-h-screen">
      {/* Scene 1: Hero "Integrity Field" */}
      {scene === 'hero' && (
        <div className="relative min-h-screen bg-integrity-gradient bg-grain overflow-hidden">
          {/* Background grain overlay */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.4'/%3E%3C/svg%3E")`,
            }}
          />
          
          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-6 py-16 lg:py-24">
            <div className="text-center mb-16">
              {/* Main Headline */}
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6">
                Data Terverifikasi • Pemerataan Transparan •{' '}
                <span className="block mt-2">Tanpa Profil Individu</span>
              </h1>
              
              {/* Rotating Sub-headline */}
              <div className="h-16 mb-12">
                <p className="text-xl lg:text-2xl text-white/90 max-w-4xl mx-auto transition-opacity duration-500">
                  {headlines[headlineIndex]}
                </p>
              </div>
              
              {/* Exploration Hub */}
              <ExplorationHub onActionClick={(action) => {
                if (action === 'audit') handleSceneTransition('audit');
              }} />
            </div>
            
            {/* Feature Cards Cluster */}
            <FeatureCards onCardClick={() => handleSceneTransition('audit')} />
          </div>
          
          {/* Trust Footer */}
          <TrustFooter />
        </div>
      )}

      {/* Scene 2: Functional "Audit Constellation" */}
      {scene === 'audit' && (
        <AuditConstellation 
          onBack={() => handleSceneTransition('hero')}
          onComplete={() => handleSceneTransition('composition')}
        />
      )}

      {/* Scene 3: Landing Composition */}
      {scene === 'composition' && (
        <LandingComposition onReset={() => handleSceneTransition('hero')} />
      )}
    </main>
  );
}