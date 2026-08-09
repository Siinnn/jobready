'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'

// ─────────────────────────────────────────────────────────────────────────────
// Export PDF.
//
// L'export passe par la fenêtre d'impression du navigateur, où l'utilisateur
// choisit « Enregistrer au format PDF ». Ce détour est volontaire : il produit
// un PDF dont le contenu reste du TEXTE, donc lisible par les logiciels de
// recrutement. Les bibliothèques qui téléchargent un PDF en un clic
// (html2canvas et apparentées) rendent la page en image : le document devient
// illisible pour un ATS, ce qui irait à l'encontre du but de l'application.
//
// Comme le passage par l'impression surprend, une fenêtre explique la marche à
// suivre avant d'ouvrir la boîte de dialogue. Elle peut être désactivée.
// ─────────────────────────────────────────────────────────────────────────────

const SKIP_KEY = 'jr_skipPrintHelp'

function detectBrowser() {
  if (typeof navigator === 'undefined') return 'autre'
  const ua = navigator.userAgent
  if (/Edg\//.test(ua)) return 'edge'
  if (/Firefox\//.test(ua)) return 'firefox'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome'
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari'
  return 'autre'
}

const INSTRUCTIONS = {
  chrome:  { dest: 'Destination', value: 'Enregistrer au format PDF', action: 'Enregistrer' },
  edge:    { dest: 'Imprimante',  value: 'Enregistrer au format PDF', action: 'Enregistrer' },
  firefox: { dest: 'Destination', value: 'Enregistrer dans un fichier', action: 'Enregistrer' },
  safari:  { dest: 'menu PDF en bas à gauche', value: 'Enregistrer au format PDF', action: 'Enregistrer' },
  autre:   { dest: 'Destination ou Imprimante', value: 'Enregistrer au format PDF', action: 'Enregistrer' },
}

export default function ExportPdfButton({
  label = 'Télécharger en PDF',
  documentLabel = 'votre CV',
  fileName,                       // nom de fichier proposé dans la boîte de dialogue
  className = 'btn-primary',
}) {
  const [open, setOpen] = useState(false)
  const [dontShow, setDontShow] = useState(false)
  const [browser, setBrowser] = useState('autre')

  useEffect(() => { setBrowser(detectBrowser()) }, [])

  // La plupart des navigateurs reprennent le titre de la page comme nom de
  // fichier proposé. On l'ajuste le temps de l'impression, puis on le rétablit.
  const printWithFileName = () => {
    const previous = document.title
    if (fileName) document.title = fileName
    const restore = () => { document.title = previous }
    window.addEventListener('afterprint', restore, { once: true })
    window.print()
    // Filet de sécurité si l'événement n'est pas émis (certains navigateurs)
    setTimeout(restore, 3000)
  }

  const runPrint = () => {
    setOpen(false)
    // Laisse la fenêtre se refermer avant d'ouvrir la boîte d'impression
    setTimeout(printWithFileName, 120)
  }

  const handleClick = () => {
    let skip = false
    try { skip = localStorage.getItem(SKIP_KEY) === '1' } catch {}
    if (skip) { printWithFileName(); return }
    setOpen(true)
  }

  const confirm = () => {
    if (dontShow) { try { localStorage.setItem(SKIP_KEY, '1') } catch {} }
    runPrint()
  }

  const ins = INSTRUCTIONS[browser]

  return (
    <>
      <button onClick={handleClick} className={className}>
        <Icon name="download" size={15} /> {label}
      </button>

      {open && (
        <div
          role="dialog" aria-modal="true" aria-labelledby="pdf-help-title"
          onClick={e => e.target === e.currentTarget && setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden"
          style={{ background: 'rgba(18, 33, 61, 0.45)' }}
        >
          <div className="bg-white w-full max-w-md p-6" style={{ borderRadius: 'var(--r-lg)' }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 flex items-center justify-center shrink-0"
                style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)', borderRadius: 'var(--r-md)' }}>
                <Icon name="download" size={18} />
              </div>
              <div>
                <h2 id="pdf-help-title" className="text-base font-semibold">Enregistrer {documentLabel} en PDF</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--c-muted)' }}>
                  Une fenêtre d'impression va s'ouvrir : c'est elle qui crée le fichier PDF.
                </p>
              </div>
            </div>

            <ol className="flex flex-col gap-2.5 mb-4">
              <Item n={1}>
                Dans la liste <strong>{ins.dest}</strong>, choisissez{' '}
                <strong>« {ins.value} »</strong> — et non une imprimante.
              </Item>
              <Item n={2}>
                Cliquez sur <strong>{ins.action}</strong>, puis choisissez où ranger le fichier
                sur votre ordinateur.
              </Item>
            </ol>

            <div className="note note-info mb-4">
              <Icon name="shield" size={14} />
              <span>
                Ce procédé produit un PDF dont le texte reste sélectionnable, donc lisible par
                les logiciels de recrutement. Un PDF transformé en image serait, lui, invisible
                pour eux.
              </span>
            </div>

            <label className="flex items-center gap-2 text-xs cursor-pointer mb-4" style={{ color: 'var(--c-muted)' }}>
              <input type="checkbox" checked={dontShow} onChange={e => setDontShow(e.target.checked)}
                className="w-3.5 h-3.5" style={{ accentColor: 'var(--c-primary)' }} />
              Ne plus afficher cette explication
            </label>

            <div className="flex gap-2">
              <button onClick={confirm} className="btn-primary flex-1">
                <Icon name="download" size={15} /> Continuer
              </button>
              <button onClick={() => setOpen(false)} className="btn-secondary">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Item({ n, children }) {
  return (
    <li className="flex gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--c-body)' }}>
      <span className="w-5 h-5 flex items-center justify-center shrink-0 text-[11px] font-bold mt-px"
        style={{ background: 'var(--c-primary)', color: '#fff', borderRadius: '50%' }}>{n}</span>
      <span>{children}</span>
    </li>
  )
}
