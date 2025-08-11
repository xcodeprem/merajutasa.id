import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'MerajutASA - Data Terverifikasi untuk Pemerataan Dukungan Anak',
  description: 'Platform digital Indonesia untuk verifikasi data kesejahteraan anak dengan arsitektur enterprise dan prinsip privacy-by-architecture. Data terverifikasi, pemerataan transparan, tanpa profil individu.',
  keywords: ['merajutasa', 'indonesia', 'kesejahteraan anak', 'verifikasi data', 'pemerataan', 'transparansi'],
  authors: [{ name: 'MerajutASA Team' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://merajutasa.id',
    siteName: 'MerajutASA',
    title: 'MerajutASA - Data Terverifikasi untuk Pemerataan Dukungan Anak',
    description: 'Platform digital untuk verifikasi data kesejahteraan anak dengan transparansi dan integritas tinggi',
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-white antialiased font-sans">
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}