import { AppProvider } from '@/context/AppContext'
import './globals.css'

const TITLE = 'JobReady — CV et lettres de motivation, compatibles ATS'
const DESCRIPTION = "Créez votre CV rubrique par rubrique et rédigez vos lettres de motivation : six modèles professionnels, vérification de lisibilité par les logiciels de recrutement (ATS) et aide à la rédaction."

export const metadata = {
  title: {
    default: TITLE,
    template: '%s · JobReady',
  },
  description: DESCRIPTION,
  applicationName: 'JobReady',
  keywords: ['CV', 'curriculum vitae', 'lettre de motivation', 'ATS', 'recherche d\'emploi', 'candidature', 'modèle de CV'],
  authors: [{ name: 'Yanis' }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    locale: 'fr_FR',
    siteName: 'JobReady',
  },
  twitter: { card: 'summary', title: TITLE, description: DESCRIPTION },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
}

export const viewport = {
  themeColor: '#1F3A68',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
