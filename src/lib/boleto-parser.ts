export interface BoletoDados {
  valor?: number
  data_vencimento?: string
  beneficiario?: string
  codigo_barras?: string
}

export function parseBoleto(texto: string): BoletoDados {
  const dados: BoletoDados = {}

  // Limpa o texto
  const t = texto.replace(/\s+/g, ' ').toUpperCase()

  // =====================
  // VALOR
  // =====================
  const valorPatterns = [
    /VALOR\s+(?:DO\s+)?(?:DOCUMENTO|COBRADO|TOTAL|A\s+PAGAR)[:\s]+R?\$?\s*([\d.,]+)/i,
    /VALOR[:\s]+R?\$?\s*([\d.,]+)/i,
    /R\$\s*([\d]{1,3}(?:\.\d{3})*(?:,\d{2}))/i,
    /=\s*([\d]{1,3}(?:\.\d{3})*,\d{2})\s/,
  ]
  for (const pattern of valorPatterns) {
    const match = texto.match(pattern)
    if (match) {
      const valorStr = match[1].replace(/\./g, '').replace(',', '.')
      const valor = parseFloat(valorStr)
      if (valor > 0 && valor < 1000000) {
        dados.valor = valor
        break
      }
    }
  }

  // =====================
  // DATA DE VENCIMENTO
  // =====================
  const dataPatterns = [
    /VENCIMENTO[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i,
    /DATA\s+(?:DE\s+)?VENCIMENTO[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/i,
    /VENCIMENTO[:\s]+(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{2,4})/i,
  ]
  for (const pattern of dataPatterns) {
    const match = texto.match(pattern)
    if (match) {
      const dia = match[1].padStart(2, '0')
      const mes = match[2].padStart(2, '0')
      let ano = match[3]
      if (ano.length === 2) ano = `20${ano}`
      dados.data_vencimento = `${ano}-${mes}-${dia}`
      break
    }
  }

  // =====================
  // BENEFICIÁRIO
  // =====================
  const benefPatterns = [
    /BENEFICI[AÁ]RIO[:\s]+([^\n\r]+)/i,
    /FAVORECIDO[:\s]+([^\n\r]+)/i,
    /EMPRESA[:\s]+([^\n\r]+)/i,
    /CEDENTE[:\s]+([^\n\r]+)/i,
    /RECEBEDOR[:\s]+([^\n\r]+)/i,
  ]
  for (const pattern of benefPatterns) {
    const match = texto.match(pattern)
    if (match) {
      dados.beneficiario = match[1].trim().substring(0, 100)
      break
    }
  }

  // =====================
  // CÓDIGO DE BARRAS
  // =====================
  const codigoPatterns = [
    /(\d{5}\.\d{5}\s\d{5}\.\d{6}\s\d{5}\.\d{6}\s\d\s\d{14})/,
    /(\d{47,48})/,
  ]
  for (const pattern of codigoPatterns) {
    const match = texto.match(pattern)
    if (match) {
      dados.codigo_barras = match[1].replace(/\s/g, '')
      break
    }
  }

  return dados
}

export async function extrairTextoPDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const pdfjsLib = await import('pdfjs-dist')
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let textoCompleto = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const texto = content.items.map((item: any) => item.str).join(' ')
      textoCompleto += texto + '\n'
    }
    
    return textoCompleto
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error)
    return ''
  }
}