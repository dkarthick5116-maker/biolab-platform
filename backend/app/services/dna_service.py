
from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction


MAX_SEQUENCE_LENGTH = 100000


def analyze_dna(raw_sequence: str) -> dict:
    """
    Analyze a DNA sequence using Biopython.
    """

    if not isinstance(raw_sequence, str):
        raise ValueError("Sequence must be text.")

    sequence = "".join(raw_sequence.upper().split())

    if not sequence:
        raise ValueError("Please provide a DNA sequence.")

    if len(sequence) > MAX_SEQUENCE_LENGTH:
        raise ValueError(
            f"Maximum sequence length is {MAX_SEQUENCE_LENGTH}."
        )

    if any(base not in "ATGC" for base in sequence):
        raise ValueError(
            "Invalid DNA sequence. Only A, T, G and C are accepted."
        )

    dna = Seq(sequence)

    length = len(dna)

    nucleotide_count = {
        "A": sequence.count("A"),
        "T": sequence.count("T"),
        "G": sequence.count("G"),
        "C": sequence.count("C")
    }

    gc_content = gc_fraction(dna) * 100

    at_content = 100 - gc_content

    reverse_complement = str(dna.reverse_complement())

    rna_transcript = str(dna.transcribe())

    return {
        "success": True,
        "engine": "Biopython",
        "sequence": sequence,
        "length": length,
        "nucleotide_count": nucleotide_count,
        "gc_content": round(gc_content, 2),
        "at_content": round(at_content, 2),
        "reverse_complement": reverse_complement,
        "rna_transcript": rna_transcript
    }
  
