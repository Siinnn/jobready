'use client'
import { FONTS } from '@/lib/cvModel'
import { defaultSubject } from '@/lib/letterModel'

export const A4_W = 794
export const A4_H = 1123

// Aperçu A4 d'une lettre de motivation, également utilisé pour l'export PDF
// (impression du même rendu, voir la règle @media print dans globals.css).
export default function LetterPreview({ letter, scale = 1, id = 'cv-print-root' }) {
  const accent = letter.theme?.accent || '#1f3a68'
  const fontId = letter.theme?.font || 'serif'
  const font = (FONTS.find(f => f.id === fontId) || FONTS[1]).stack
  const fs = letter.theme?.fontSize || 1
  const sp = letter.theme?.spacing || 1

  const s = letter.sender || {}
  const r = letter.recipient || {}
  const subject = letter.subject?.trim() || defaultSubject(letter)
  const fullName = [s.firstName, s.lastName].filter(Boolean).join(' ')

  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const body = (letter.body || []).map(p => p.text?.trim()).filter(Boolean)

  const S = {
    body: 11.5 * fs,
    small: 10.5 * fs,
    gap: 18 * sp,
  }

  return (
    <div
      id={id}
      className="cv-sheet"
      style={{
        width: A4_W, minHeight: A4_H, background: 'white', boxSizing: 'border-box',
        padding: `${58 * sp}px ${62}px`,
        fontFamily: font, color: '#1a1a1a', fontSize: S.body, lineHeight: 1.6,
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Expéditeur */}
      <div style={{ marginBottom: S.gap * 1.4 }}>
        <div style={{ fontSize: 14 * fs, fontWeight: 700, color: accent }}>
          {fullName || <Ph>Prénom Nom</Ph>}
        </div>
        {s.title && <div style={{ fontSize: S.small, marginTop: 2, color: '#4a4a4a' }}>{s.title}</div>}
        <div style={{ fontSize: S.small, color: '#5a5a5a', marginTop: 4, whiteSpace: 'pre-line' }}>
          {s.address}
        </div>
        <div style={{ fontSize: S.small, color: '#5a5a5a', marginTop: 2 }}>
          {[s.location, s.phone, s.email].filter(Boolean).join('  ·  ') || <Ph>Ville · Téléphone · Email</Ph>}
        </div>
      </div>

      {/* Destinataire */}
      <div style={{ marginBottom: S.gap, marginLeft: 'auto', textAlign: 'left', maxWidth: 260 }}>
        <div style={{ fontWeight: 700 }}>{r.company || <Ph>Nom de l'entreprise</Ph>}</div>
        {r.contact && <div style={{ fontSize: S.small }}>{r.contact}</div>}
        {r.address && <div style={{ fontSize: S.small, color: '#5a5a5a', whiteSpace: 'pre-line' }}>{r.address}</div>}
        {r.city && <div style={{ fontSize: S.small, color: '#5a5a5a' }}>{r.city}</div>}
      </div>

      {/* Lieu et date */}
      {letter.showDate && (
        <div style={{ textAlign: 'right', fontSize: S.small, color: '#4a4a4a', marginBottom: S.gap * 1.3 }}>
          {s.location ? `${s.location}, le ${today}` : `Le ${today}`}
        </div>
      )}

      {/* Objet */}
      <div style={{ marginBottom: S.gap * 1.2 }}>
        <strong>Objet : </strong>{subject}
      </div>

      {/* Formule d'appel */}
      <div style={{ marginBottom: S.gap * 0.9 }}>
        {r.contact ? `${r.contact},` : 'Madame, Monsieur,'}
      </div>

      {/* Corps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: S.gap * 0.85, textAlign: 'justify' }}>
        {body.length > 0 ? body.map((p, i) => (
          <p key={i} style={{ margin: 0, whiteSpace: 'pre-line' }}>{p}</p>
        )) : (
          <p style={{ margin: 0 }}>
            <Ph>Le texte de votre lettre apparaîtra ici, paragraphe par paragraphe.</Ph>
          </p>
        )}
      </div>

      {/* Signature */}
      <div style={{ marginTop: S.gap * 1.6, textAlign: 'right' }}>
        {fullName}
      </div>
    </div>
  )
}

function Ph({ children }) {
  return <span style={{ color: '#b9c0cb', fontStyle: 'italic' }}>{children}</span>
}
