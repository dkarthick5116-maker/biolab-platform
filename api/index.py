import re
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction
from Bio.SeqUtils.ProtParam import ProteinAnalysis

app = FastAPI(
    title="BioLab Scientific API",
    description="Computational biology and sequence analysis engine for BioLab.",
    version="1.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_SEQUENCE_LENGTH = 100_000
VALID_DNA_REGEX = re.compile(r"^[ATGC]+$")
VALID_RNA_REGEX = re.compile(r"^[AUGC]+$")
VALID_PROTEIN_REGEX = re.compile(r"^[ACDEFGHIKLMNPQRSTVWY]+$")

# --- DNA PIPELINE ---
def analyze_dna(raw_sequence: str) -> dict:
    cleaned_seq = "".join(raw_sequence.split()).upper()
    if not cleaned_seq:
        raise ValueError("Sequence cannot be empty.")
    if len(cleaned_seq) > MAX_SEQUENCE_LENGTH:
        raise ValueError(f"Sequence length ({len(cleaned_seq)}) exceeds limit of {MAX_SEQUENCE_LENGTH} bases.")
    if not VALID_DNA_REGEX.match(cleaned_seq):
        invalid_chars = set(cleaned_seq) - set("ATGC")
        raise ValueError(f"Invalid DNA nucleotide characters detected: {', '.join(sorted(invalid_chars))}")

    seq_obj = Seq(cleaned_seq)
    seq_len = len(cleaned_seq)

    gc_ratio = gc_fraction(seq_obj)
    gc_percent = round(gc_ratio * 100, 2)
    at_percent = round(100.0 - gc_percent, 2)

    return {
        "sequence": cleaned_seq,
        "length": seq_len,
        "counts": {
            "A": cleaned_seq.count("A"),
            "T": cleaned_seq.count("T"),
            "G": cleaned_seq.count("G"),
            "C": cleaned_seq.count("C")
        },
        "gc_content": gc_percent,
        "at_content": at_percent,
        "reverse_complement": str(seq_obj.reverse_complement()),
        "rna_transcript": str(seq_obj.transcribe())
    }

# --- RNA PIPELINE ---
def analyze_rna(raw_sequence: str) -> dict:
    cleaned_seq = "".join(raw_sequence.split()).upper()
    if not cleaned_seq:
        raise ValueError("RNA sequence cannot be empty.")
    if len(cleaned_seq) > MAX_SEQUENCE_LENGTH:
        raise ValueError(f"Sequence length ({len(cleaned_seq)}) exceeds limit of {MAX_SEQUENCE_LENGTH} bases.")
    if not VALID_RNA_REGEX.match(cleaned_seq):
        invalid_chars = set(cleaned_seq) - set("AUGC")
        raise ValueError(f"Invalid RNA nucleotide characters detected: {', '.join(sorted(invalid_chars))}")

    seq_obj = Seq(cleaned_seq)
    seq_len = len(cleaned_seq)
    gc_bases = cleaned_seq.count("G") + cleaned_seq.count("C")
    gc_percent = round((gc_bases / seq_len) * 100, 2) if seq_len > 0 else 0.0

    try:
        protein_translation = str(seq_obj.translate(to_stop=False))
    except Exception:
        protein_translation = "N/A (Incomplete codon frame)"

    return {
        "sequence": cleaned_seq,
        "length": seq_len,
        "counts": {
            "A": cleaned_seq.count("A"),
            "U": cleaned_seq.count("U"),
            "G": cleaned_seq.count("G"),
            "C": cleaned_seq.count("C")
        },
        "gc_content": gc_percent,
        "au_content": round(100.0 - gc_percent, 2),
        "reverse_complement": str(seq_obj.reverse_complement_rna()),
        "cdna": str(seq_obj.back_transcribe()),
        "protein_translation": protein_translation
    }

# --- PROTEIN PIPELINE ---
def analyze_protein(raw_sequence: str) -> dict:
    cleaned_seq = "".join(raw_sequence.split()).upper()
    if not cleaned_seq:
        raise ValueError("Protein sequence cannot be empty.")
    if len(cleaned_seq) > MAX_SEQUENCE_LENGTH:
        raise ValueError(f"Sequence length ({len(cleaned_seq)}) exceeds limit of {MAX_SEQUENCE_LENGTH} residues.")
    if not VALID_PROTEIN_REGEX.match(cleaned_seq):
        invalid_chars = set(cleaned_seq) - set("ACDEFGHIKLMNPQRSTVWY")
        raise ValueError(f"Invalid IUPAC amino acid characters detected: {', '.join(sorted(invalid_chars))}")

    analysis = ProteinAnalysis(cleaned_seq)
    seq_len = len(cleaned_seq)

    # Secondary structure fraction tuple: (Helix, Turn, Sheet)
    sec_struct = analysis.secondary_structure_fraction()
    instability = round(analysis.instability_index(), 2)

    return {
        "sequence": cleaned_seq,
        "length": seq_len,
        "molecular_weight": round(analysis.molecular_weight(), 2),
        "isoelectric_point": round(analysis.isoelectric_point(), 2),
        "charge_at_ph_7_4": round(analysis.charge_at_pH(7.4), 2),
        "instability_index": instability,
        "stability_status": "Stable (<= 40)" if instability <= 40 else "Unstable (> 40)",
        "aromaticity": round(analysis.aromaticity() * 100, 2),
        "gravy": round(analysis.gravy(), 3),
        "secondary_structure": {
            "helix_percent": round(sec_struct[0] * 100, 1),
            "turn_percent": round(sec_struct[1] * 100, 1),
            "sheet_percent": round(sec_struct[2] * 100, 1)
        },
        "amino_acid_counts": analysis.count_amino_acids()
    }

class SequenceRequest(BaseModel):
    sequence: str = Field(
        ...,
        min_length=1,
        max_length=100_000,
        description="Biological sequence string"
    )

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "Biopython ProtParam",
        "service": "active",
        "modules": ["DNA", "RNA", "Protein"]
    }

@app.post("/api/analyze/dna")
def run_dna_analysis(payload: SequenceRequest):
    try:
        results = analyze_dna(payload.sequence)
        return {"success": True, "data": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Computation error: {str(e)}")

@app.post("/api/analyze/rna")
def run_rna_analysis(payload: SequenceRequest):
    try:
        results = analyze_rna(payload.sequence)
        return {"success": True, "data": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Computation error: {str(e)}")

@app.post("/api/analyze/protein")
def run_protein_analysis(payload: SequenceRequest):
    try:
        results = analyze_protein(payload.sequence)
        return {"success": True, "data": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Computation error: {str(e)}")
        
