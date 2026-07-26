/**
 * Génère des PDFs (CV et lettre) tenus sur UNE seule page A4.
 * Stratégie : marges réduites, polices compactes, contenu tronqué intelligemment.
 */

// ─── Constantes de mise en page ────────────────────────────────────────────
const CV = {
  margin:       [32, 30, 32, 28],   // [left, top, right, bottom]
  accent:       '#4338ca',
  nameSize:     17,
  titleSize:    10.5,
  bodySize:     8.5,
  smallSize:    8,
  sectionSize:  7.5,
  lineHeight:   1.3,
  maxExp:       3,       // expériences max
  maxExpChars:  110,     // chars par description d'expérience
  maxEdu:       2,       // formations max
  maxTechSkills:10,      // compétences techniques max
  maxSoftSkills:5,
}

const LM = {
  margin:     [55, 42, 55, 42],
  bodySize:   10,
  lineHeight: 1.55,
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function trunc(str, max) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max).trimEnd() + '…' : str
}

function safeStr(val) {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.join(', ')
  if (typeof val === 'object') return val.name || val.city || JSON.stringify(val)
  return String(val)
}

function sectionTitle(text, color) {
  return {
    stack: [
      {
        text: text.toUpperCase(),
        fontSize: CV.sectionSize, bold: true, color,
        letterSpacing: 1.2,
        margin: [0, 7, 0, 2],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 531, y2: 0, lineWidth: 0.4, lineColor: '#e5e7eb' }] },
    ],
  }
}

// ─── CV ─────────────────────────────────────────────────────────────────────
function buildCvDefinition(profile, accentColor = CV.accent) {
  const techSkills = (Array.isArray(profile.techSkills)
    ? profile.techSkills
    : safeStr(profile.techSkills).split(',').map(s => s.trim()).filter(Boolean)
  ).slice(0, CV.maxTechSkills)

  const softSkills = (Array.isArray(profile.softSkills)
    ? profile.softSkills
    : safeStr(profile.softSkills).split(',').map(s => s.trim()).filter(Boolean)
  ).slice(0, CV.maxSoftSkills)

  const experiences = (profile.experiences || [])
    .filter(e => e.title)
    .slice(0, CV.maxExp)

  const education = (profile.education || [])
    .filter(e => e.degree)
    .slice(0, CV.maxEdu)

  const langList = (profile.languages || [])
    .map(l => typeof l === 'string' ? l : `${l.name}${l.level ? ` (${l.level})` : ''}`)
    .join(' · ')

  const contactLine = [
    profile.email, profile.phone, profile.location,
    profile.linkedin, profile.portfolio,
  ].filter(Boolean).join('   ·   ')

  return {
    pageSize: 'A4',
    pageMargins: CV.margin,
    defaultStyle: { font: 'Roboto', fontSize: CV.bodySize, color: '#374151', lineHeight: CV.lineHeight },
    content: [

      // ── NOM + TITRE + CONTACT ──────────────────────────────────
      {
        stack: [
          {
            text: `${safeStr(profile.firstName)} ${safeStr(profile.lastName)}`,
            fontSize: CV.nameSize, bold: true, color: '#1e1b4b', margin: [0, 0, 0, 2],
          },
          {
            text: safeStr(profile.title),
            fontSize: CV.titleSize, color: accentColor, margin: [0, 0, 0, 4],
          },
          {
            text: contactLine,
            fontSize: CV.smallSize, color: '#6b7280',
          },
        ],
        margin: [0, 0, 0, 8],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 531, y2: 0, lineWidth: 1.5, lineColor: accentColor }], margin: [0, 0, 0, 6] },

      // ── PROFIL ────────────────────────────────────────────────
      ...(profile.summary ? [
        sectionTitle('Profil', accentColor),
        { text: trunc(safeStr(profile.summary), 220), fontSize: CV.bodySize, color: '#4b5563', margin: [0, 3, 0, 0] },
      ] : []),

      // ── EXPÉRIENCES ──────────────────────────────────────────
      ...(experiences.length ? [
        sectionTitle('Expériences professionnelles', accentColor),
        ...experiences.flatMap(exp => [
          {
            columns: [
              { text: safeStr(exp.title), bold: true, fontSize: CV.bodySize + 0.5, color: '#1e1b4b', width: '*' },
              { text: safeStr(exp.period), fontSize: CV.smallSize, color: '#9ca3af', alignment: 'right', width: 'auto' },
            ],
            margin: [0, 5, 0, 1],
          },
          { text: safeStr(exp.company), fontSize: CV.smallSize + 0.5, color: accentColor, bold: true, margin: [0, 0, 0, 2] },
          exp.description ? {
            text: trunc(safeStr(exp.description), CV.maxExpChars),
            fontSize: CV.smallSize, color: '#4b5563', margin: [0, 0, 0, 2],
          } : {},
        ]),
      ] : []),

      // ── FORMATION ────────────────────────────────────────────
      ...(education.length ? [
        sectionTitle('Formation', accentColor),
        ...education.map(edu => ({
          columns: [
            {
              stack: [
                { text: safeStr(edu.degree), bold: true, fontSize: CV.bodySize, color: '#1e1b4b' },
                { text: safeStr(edu.school), fontSize: CV.smallSize, color: '#6b7280' },
              ],
              width: '*',
            },
            { text: safeStr(edu.year), fontSize: CV.smallSize, color: '#9ca3af', alignment: 'right', width: 'auto' },
          ],
          margin: [0, 4, 0, 1],
        })),
      ] : []),

      // ── COMPÉTENCES ──────────────────────────────────────────
      ...((techSkills.length || softSkills.length || langList) ? [
        sectionTitle('Compétences', accentColor),
        techSkills.length ? {
          columns: [
            { text: 'Techniques :', bold: true, fontSize: CV.smallSize, width: 80, color: '#374151' },
            { text: techSkills.join(' · '), fontSize: CV.smallSize, color: '#4b5563', width: '*' },
          ],
          margin: [0, 3, 0, 1],
        } : {},
        softSkills.length ? {
          columns: [
            { text: 'Soft skills :', bold: true, fontSize: CV.smallSize, width: 80, color: '#374151' },
            { text: softSkills.join(' · '), fontSize: CV.smallSize, color: '#4b5563', width: '*' },
          ],
          margin: [0, 1, 0, 1],
        } : {},
        langList ? {
          columns: [
            { text: 'Langues :', bold: true, fontSize: CV.smallSize, width: 80, color: '#374151' },
            { text: langList, fontSize: CV.smallSize, color: '#4b5563', width: '*' },
          ],
          margin: [0, 1, 0, 0],
        } : {},
      ] : []),
    ],
  }
}

// ─── LETTRE ──────────────────────────────────────────────────────────────────
function buildLetterDefinition(profile, letterText, offer) {
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  // Tronquer la lettre à ~2800 chars pour garantir 1 page
  const bodyText = trunc(safeStr(letterText), 2800)

  return {
    pageSize: 'A4',
    pageMargins: LM.margin,
    defaultStyle: { font: 'Roboto', fontSize: LM.bodySize, color: '#374151', lineHeight: LM.lineHeight },
    content: [
      // Expéditeur
      {
        stack: [
          { text: `${safeStr(profile.firstName)} ${safeStr(profile.lastName)}`, bold: true, fontSize: 11, color: '#1e1b4b' },
          { text: safeStr(profile.title), fontSize: 9.5, color: '#6366f1', margin: [0, 1, 0, 0] },
          {
            text: [safeStr(profile.location), safeStr(profile.email), safeStr(profile.phone)].filter(Boolean).join('  ·  '),
            fontSize: 8.5, color: '#6b7280', margin: [0, 2, 0, 0],
          },
        ],
        margin: [0, 0, 0, 16],
      },
      // Date
      { text: today, alignment: 'right', fontSize: 9, color: '#9ca3af', margin: [0, 0, 0, 16] },
      // Destinataire
      ...(offer ? [{
        stack: [
          { text: safeStr(offer.company), bold: true, fontSize: LM.bodySize },
          offer.location ? { text: safeStr(offer.location), fontSize: 9, color: '#6b7280' } : {},
        ],
        margin: [0, 0, 0, 14],
      }] : []),
      // Objet
      ...(offer ? [{
        text: [{ text: 'Objet : ', bold: true }, { text: `Candidature au poste de ${safeStr(offer.title)}` }],
        fontSize: LM.bodySize, margin: [0, 0, 0, 16],
      }] : []),
      // Corps
      { text: bodyText, fontSize: LM.bodySize },
    ],
  }
}

// ─── TEMPLATE : DESIGNER (2 colonnes — sidebar sombre) ──────────────────────
function buildDesignerCvDefinition(profile, accentColor = '#7c3aed') {
  const sidebarBg = '#1e1b4b'
  const sidebarW = 160
  const mainW = 531 - sidebarW - 12

  const techSkills = (Array.isArray(profile.techSkills)
    ? profile.techSkills
    : safeStr(profile.techSkills).split(',').map(s => s.trim()).filter(Boolean)
  ).slice(0, 12)

  const experiences = (profile.experiences || []).filter(e => e.title).slice(0, CV.maxExp)
  const education   = (profile.education   || []).filter(e => e.degree).slice(0, CV.maxEdu)
  const langList    = (profile.languages   || [])
    .map(l => typeof l === 'string' ? l : `${l.name}${l.level ? ` (${l.level})` : ''}`).join('\n')

  const sidebarText  = (text, opts = {}) => ({ text, color: '#e2e8f0', fontSize: CV.smallSize, ...opts })
  const sidebarLabel = (text) => ({
    text: text.toUpperCase(), color: accentColor, fontSize: CV.sectionSize,
    bold: true, letterSpacing: 1, margin: [0, 10, 0, 4],
  })
  const contentTitle = (text) => ({
    stack: [
      { text: text.toUpperCase(), fontSize: CV.sectionSize, bold: true, color: accentColor, letterSpacing: 1.2, margin: [0, 7, 0, 2] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: mainW, y2: 0, lineWidth: 0.4, lineColor: '#e5e7eb' }] },
    ],
  })

  const sidebarColumn = {
    width: sidebarW,
    stack: [
      // Initials avatar
      {
        table: { widths: ['*'], body: [[{
          text: `${safeStr(profile.firstName)[0] || '?'}${safeStr(profile.lastName)[0] || ''}`,
          alignment: 'center', fontSize: 20, bold: true, color: 'white',
          margin: [0, 10, 0, 10],
        }]] },
        layout: { fillColor: () => `${accentColor}55`, hLineWidth: () => 0, vLineWidth: () => 0 },
        margin: [0, 0, 0, 10],
      },
      sidebarText(safeStr(profile.title), { bold: true, fontSize: CV.bodySize, color: 'white', margin: [0, 0, 0, 2] }),
      // Contact
      sidebarLabel('Contact'),
      ...[profile.email, profile.phone, profile.location, profile.linkedin]
        .filter(Boolean).map(v => sidebarText(safeStr(v), { margin: [0, 1, 0, 1] })),
      // Skills
      ...(techSkills.length ? [
        sidebarLabel('Compétences'),
        ...techSkills.map(s => sidebarText(`• ${s}`, { margin: [0, 1, 0, 1] })),
      ] : []),
      // Languages
      ...(langList ? [
        sidebarLabel('Langues'),
        sidebarText(langList),
      ] : []),
    ],
    fillColor: sidebarBg,
    margin: [0, 0, 0, 0],
  }

  const mainColumn = {
    width: '*',
    stack: [
      // Name
      {
        text: `${safeStr(profile.firstName)} ${safeStr(profile.lastName)}`,
        fontSize: CV.nameSize, bold: true, color: '#1e1b4b', margin: [0, 0, 0, 2],
      },
      // Summary
      ...(profile.summary ? [
        contentTitle('Profil'),
        { text: trunc(safeStr(profile.summary), 220), fontSize: CV.bodySize, color: '#4b5563', margin: [0, 3, 0, 0] },
      ] : []),
      // Experiences
      ...(experiences.length ? [
        contentTitle('Expériences'),
        ...experiences.flatMap(exp => [
          {
            columns: [
              { text: safeStr(exp.title), bold: true, fontSize: CV.bodySize + 0.5, color: '#1e1b4b', width: '*' },
              { text: safeStr(exp.period), fontSize: CV.smallSize, color: '#9ca3af', alignment: 'right', width: 'auto' },
            ],
            margin: [0, 5, 0, 1],
          },
          { text: safeStr(exp.company), fontSize: CV.smallSize + 0.5, color: accentColor, bold: true, margin: [0, 0, 0, 2] },
          exp.description ? { text: trunc(safeStr(exp.description), CV.maxExpChars), fontSize: CV.smallSize, color: '#4b5563' } : {},
        ]),
      ] : []),
      // Education
      ...(education.length ? [
        contentTitle('Formation'),
        ...education.map(edu => ({
          columns: [
            {
              stack: [
                { text: safeStr(edu.degree), bold: true, fontSize: CV.bodySize, color: '#1e1b4b' },
                { text: safeStr(edu.school), fontSize: CV.smallSize, color: '#6b7280' },
              ],
              width: '*',
            },
            { text: safeStr(edu.year), fontSize: CV.smallSize, color: '#9ca3af', alignment: 'right', width: 'auto' },
          ],
          margin: [0, 4, 0, 1],
        })),
      ] : []),
    ],
  }

  return {
    pageSize: 'A4',
    pageMargins: [0, 0, CV.margin[2], 0],
    defaultStyle: { font: 'Roboto', fontSize: CV.bodySize, lineHeight: CV.lineHeight },
    content: [{
      columns: [
        { ...sidebarColumn, margin: [18, 30, 14, 30] },
        { ...mainColumn,    margin: [0,  30, 32, 30] },
      ],
      columnGap: 0,
    }],
  }
}

// ─── TEMPLATE : MINIMALISTE ──────────────────────────────────────────────────
function buildMinimalisteCvDefinition(profile, accentColor = '#111827') {
  const techSkills = (Array.isArray(profile.techSkills)
    ? profile.techSkills
    : safeStr(profile.techSkills).split(',').map(s => s.trim()).filter(Boolean)
  ).slice(0, CV.maxTechSkills)

  const softSkills = (Array.isArray(profile.softSkills)
    ? profile.softSkills
    : safeStr(profile.softSkills).split(',').map(s => s.trim()).filter(Boolean)
  ).slice(0, CV.maxSoftSkills)

  const experiences = (profile.experiences || []).filter(e => e.title).slice(0, CV.maxExp)
  const education   = (profile.education   || []).filter(e => e.degree).slice(0, CV.maxEdu)
  const langList    = (profile.languages   || [])
    .map(l => typeof l === 'string' ? l : `${l.name}${l.level ? ` (${l.level})` : ''}`).join('  ·  ')

  const miniTitle = (text) => ({
    stack: [
      { text: text.toUpperCase(), fontSize: CV.sectionSize, color: '#9ca3af', letterSpacing: 2, margin: [0, 10, 0, 3] },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 531, y2: 0, lineWidth: 0.5, lineColor: '#e5e7eb' }] },
    ],
  })

  const contactLine = [profile.email, profile.phone, profile.location, profile.linkedin]
    .filter(Boolean).join('   ·   ')

  return {
    pageSize: 'A4',
    pageMargins: CV.margin,
    defaultStyle: { font: 'Roboto', fontSize: CV.bodySize, color: '#374151', lineHeight: CV.lineHeight },
    content: [
      // Name
      {
        stack: [
          {
            columns: [
              { text: safeStr(profile.firstName), fontSize: 22, fontWeight: 300, color: '#111827', width: 'auto' },
              { text: ` ${safeStr(profile.lastName)}`, fontSize: 22, bold: true, color: '#111827', width: '*' },
            ],
            margin: [0, 0, 0, 4],
          },
          { text: safeStr(profile.title), fontSize: 10, color: accentColor, letterSpacing: 0.5, margin: [0, 0, 0, 4] },
          { text: contactLine, fontSize: CV.smallSize, color: '#9ca3af' },
        ],
        margin: [0, 0, 0, 6],
      },
      // Summary
      ...(profile.summary ? [
        miniTitle('Profil'),
        { text: trunc(safeStr(profile.summary), 220), fontSize: CV.bodySize, color: '#4b5563', italics: true, margin: [0, 4, 0, 0] },
      ] : []),
      // Experiences
      ...(experiences.length ? [
        miniTitle('Expériences'),
        ...experiences.flatMap(exp => [{
          columns: [
            { text: safeStr(exp.period), fontSize: CV.smallSize, color: '#9ca3af', width: 68, alignment: 'right', margin: [0, 3, 0, 0] },
            {
              stack: [
                { text: safeStr(exp.title), bold: true, fontSize: CV.bodySize + 0.5, color: '#1e1b4b' },
                { text: safeStr(exp.company), fontSize: CV.smallSize, color: accentColor },
                exp.description ? { text: trunc(safeStr(exp.description), CV.maxExpChars), fontSize: CV.smallSize, color: '#6b7280', margin: [0, 2, 0, 0] } : {},
              ],
              width: '*',
            },
          ],
          columnGap: 12,
          margin: [0, 6, 0, 0],
        }]),
      ] : []),
      // Education
      ...(education.length ? [
        miniTitle('Formation'),
        ...education.map(edu => ({
          columns: [
            { text: safeStr(edu.year), fontSize: CV.smallSize, color: '#9ca3af', width: 68, alignment: 'right', margin: [0, 2, 0, 0] },
            {
              stack: [
                { text: safeStr(edu.degree), bold: true, fontSize: CV.bodySize, color: '#1e1b4b' },
                { text: safeStr(edu.school), fontSize: CV.smallSize, color: '#6b7280' },
              ],
              width: '*',
            },
          ],
          columnGap: 12,
          margin: [0, 5, 0, 0],
        })),
      ] : []),
      // Skills
      ...((techSkills.length || softSkills.length || langList) ? [
        miniTitle('Compétences'),
        {
          columns: [
            ...(techSkills.length ? [{
              stack: [
                { text: 'Techniques', fontSize: CV.smallSize, color: '#9ca3af', margin: [0, 4, 0, 2] },
                { text: techSkills.join('  ·  '), fontSize: CV.smallSize, color: '#374151' },
              ],
              width: '*',
            }] : []),
            ...(langList ? [{
              stack: [
                { text: 'Langues', fontSize: CV.smallSize, color: '#9ca3af', margin: [0, 4, 0, 2] },
                { text: langList, fontSize: CV.smallSize, color: '#374151' },
              ],
              width: '*',
            }] : []),
          ],
          margin: [0, 4, 0, 0],
        },
      ] : []),
    ],
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────
export async function generatePdfBuffer(type, data) {
  const pdfMakeModule  = await import('pdfmake/build/pdfmake')
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts')

  const pdfmake = pdfMakeModule.default || pdfMakeModule
  const pdfFonts = pdfFontsModule.default || pdfFontsModule

  let vfs = null
  if (pdfFonts?.['Roboto-Regular.ttf'])        vfs = pdfFonts
  else if (pdfFontsModule?.['Roboto-Regular.ttf']) vfs = pdfFontsModule
  else vfs = pdfFonts?.pdfMake?.vfs || pdfFonts?.vfs || pdfFontsModule?.pdfMake?.vfs || pdfFontsModule?.vfs

  if (!vfs) throw new Error('Impossible de charger pdfmake vfs_fonts')
  pdfmake.vfs = vfs

  const docDef =
    type === 'letter'
      ? buildLetterDefinition(data.profile, data.letterText, data.offer)
    : type === 'cv' && data.template === 'designer'
      ? buildDesignerCvDefinition(data.profile, data.accentColor)
    : type === 'cv' && data.template === 'minimaliste'
      ? buildMinimalisteCvDefinition(data.profile, data.accentColor)
    : type === 'cv'
      ? buildCvDefinition(data.profile, data.accentColor)
    : (() => { throw new Error('Type invalide : cv ou letter') })()

  return new Promise((resolve) => {
    pdfmake.createPdf(docDef).getBuffer(buf => resolve(Buffer.from(buf)))
  })
}
