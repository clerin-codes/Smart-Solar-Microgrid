import logoUrl from '../assets/sunchain-logo.png'

const LOGO_ASPECT = 1101 / 360

// Downscaled so each exported PDF stays small.
const loadLogo = () =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 330
      canvas.height = Math.round(330 / LOGO_ASPECT)
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', 0.92))
    }
    img.onerror = reject
    img.src = logoUrl
  })

// jsPDF is large, so it is only loaded when someone exports.
const newDocument = async () => {
  const [{ jsPDF }, { default: autoTable }, logo] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
    loadLogo(),
  ])
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const logoHeight = 42
  doc.addImage(logo, 'JPEG', 40, 30, logoHeight * LOGO_ASPECT, logoHeight)
  return { doc, autoTable }
}

const heading = (doc, title, subtitle) => {
  doc.setFontSize(18)
  doc.setTextColor(17, 24, 39)
  doc.text(title, 40, 104)
  if (subtitle) {
    doc.setFontSize(10)
    doc.setTextColor(107, 114, 128)
    doc.text(subtitle, 40, 122)
  }
}

const TABLE_STYLE = { headStyles: { fillColor: [22, 163, 74] }, styles: { fontSize: 9 }, margin: { left: 40, right: 40 } }

// sections: [{ title, head: [..], rows: [[..]] }]
export async function exportReportPdf({ title, subtitle, kpis, sections, filename }) {
  const { doc, autoTable } = await newDocument()
  heading(doc, title, subtitle)

  autoTable(doc, {
    ...TABLE_STYLE,
    startY: 140,
    head: [['Metric', 'Value']],
    body: kpis,
  })

  for (const section of sections) {
    const y = doc.lastAutoTable.finalY + 26
    doc.setFontSize(12)
    doc.setTextColor(17, 24, 39)
    doc.text(section.title, 40, y)
    autoTable(doc, { ...TABLE_STYLE, startY: y + 8, head: [section.head], body: section.rows })
  }

  doc.save(filename)
}

// fields: [[label, value], ...]
export async function exportReceiptPdf({ title, reference, fields, filename }) {
  const { doc, autoTable } = await newDocument()
  heading(doc, title, reference)
  autoTable(doc, {
    ...TABLE_STYLE,
    startY: 140,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 6 },
    columnStyles: { 0: { textColor: [107, 114, 128], cellWidth: 150 } },
    body: fields,
  })
  doc.save(filename)
}
