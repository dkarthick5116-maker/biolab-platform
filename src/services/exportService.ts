export interface ExportData {
  module: 'DNA' | 'RNA';
  sequence: string;
  length: number;
  gc_content: number;
  at_or_au_content: number;
  counts: Record<string, number>;
  reverse_complement: string;
  derived_sequence: string; // RNA transcript for DNA, cDNA for RNA
  protein_translation?: string;
}

/**
 * Generates and downloads a standard bioinformatics FASTA file (.fasta)
 */
export const exportAsFasta = (data: ExportData, filenamePrefix = 'biolab_sequence') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Format standard multi-record FASTA
  const fastaLines = [
    `>BioLab|${data.module}_PRIMARY|Length=${data.length}bp|GC=${data.gc_content}%`,
    data.sequence,
    `>BioLab|${data.module}_REVERSE_COMPLEMENT`,
    data.reverse_complement,
    `>BioLab|${data.module}_DERIVED`,
    data.derived_sequence
  ];

  if (data.protein_translation && data.protein_translation !== 'N/A') {
    fastaLines.push(`>BioLab|${data.module}_TRANSLATION`);
    fastaLines.push(data.protein_translation);
  }

  const fileContent = fastaLines.join('\n') + '\n';
  triggerBrowserDownload(fileContent, `${filenamePrefix}_${timestamp}.fasta`, 'text/plain');
};

/**
 * Generates and downloads structured JSON (.json)
 */
export const exportAsJson = (data: ExportData, filenamePrefix = 'biolab_analysis') => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const payload = {
    platform: 'BioLab Online Bioinformatics Laboratory',
    exported_at: new Date().toISOString(),
    analysis: data
  };

  const fileContent = JSON.stringify(payload, null, 2);
  triggerBrowserDownload(fileContent, `${filenamePrefix}_${timestamp}.json`, 'application/json');
};

/**
 * Universal browser file trigger via DOM Anchor
 */
const triggerBrowserDownload = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
