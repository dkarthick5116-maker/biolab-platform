
export interface DNAAnalysisResult {
  sequence: string;
  length: number;
  nucleotideCount: {
    A: number;
    T: number;
    G: number;
    C: number;
  };
  gcContent: number;
  atContent: number;
  reverseComplement: string;
  rnaTranscript: string;
}

export function analyzeDNA(input: string): DNAAnalysisResult {
  if (!input || !input.trim()) {
    throw new Error("Please enter a DNA sequence.");
  }

  // Normalize sequence
  const sequence = input
    .toUpperCase()
    .replace(/\s+/g, "");

  // Validate DNA sequence
  if (!/^[ATGC]+$/.test(sequence)) {
    throw new Error(
      "Invalid DNA sequence. Only A, T, G and C are allowed."
    );
  }

  // Count nucleotides
  const nucleotideCount = {
    A: 0,
    T: 0,
    G: 0,
    C: 0
  };

  for (const nucleotide of sequence) {
    nucleotideCount[
      nucleotide as keyof typeof nucleotideCount
    ]++;
  }

  const length = sequence.length;

  // Calculate GC and AT content
  const gcContent =
    ((nucleotideCount.G + nucleotideCount.C) / length) * 100;

  const atContent =
    ((nucleotideCount.A + nucleotideCount.T) / length) * 100;

  // Generate reverse complement
  const complement: Record<string, string> = {
    A: "T",
    T: "A",
    G: "C",
    C: "G"
  };

  const reverseComplement = sequence
    .split("")
    .reverse()
    .map(base => complement[base])
    .join("");

  // DNA to RNA transcription
  const rnaTranscript = sequence.replace(/T/g, "U");

  return {
    sequence,
    length,
    nucleotideCount,
    gcContent: Number(gcContent.toFixed(2)),
    atContent: Number(atContent.toFixed(2)),
    reverseComplement,
    rnaTranscript
  };
}
