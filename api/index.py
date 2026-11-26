import re
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction

app = FastAPI(
    title="BioLab Scientific API",
    description="Computational biology and sequence analysis engine for BioLab.",
    version="1.0.0"
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

# --- DNA PIPELINE ---
def analyze_dna(raw_sequence: str) -> dict:
    cleaned_seq = "".join(raw_sequence.split()).upper()

    if not cleaned_seq:
        raise ValueError("Sequence cannot be empty.")

    if len(cleaned_seq) > MAX_SEQUENCE_LENGTH:
        raise ValueError(
            f"Sequence length ({len(cleaned_seq)}) exceeds maximum limit of {MAX_SEQUENCE_LENGTH} bases."
        )

    if not VALID_DNA_REGEX.match(cleaned_seq):
        invalid_chars = set(cleaned_seq) - set("ATGC")
        raise ValueError(f"Invalid nucleotide characters detected: {', '.join(sorted(invalid_chars))}")

    seq_obj = Seq(cleaned_seq)
    seq_len = len(cleaned_seq)

    count_a = cleaned_seq.count("A")
    count_t = cleaned_seq.count("T")
    count_g = cleaned_seq.count("G")
    count_c = cleaned_seq.count("C")

    gc_ratio = gc_fraction(seq_obj)
    gc_percent = round(gc_ratio * 100, 2)
    at_percent = round(100.0 - gc_percent, 2)

    reverse_comp = str(seq_obj.reverse_complement())
    rna_transcript = str(seq_obj.transcribe())

    return {
        "sequence": cleaned_seq,
        "length": seq_len,
        "counts": {
            "A": count_a,
            "T": count_t,
            "G": count_g,
            "C": count_c
        },
        "gc_content": gc_percent,
        "at_content": at_percent,
        "reverse_complement": reverse_comp,
        "rna_transcript": rna_transcript
    }

# --- RNA PIPELINE ---
def analyze_rna(raw_sequence: str) -> dict:
    cleaned_seq = "".join(raw_sequence.split()).upper()

    if not cleaned_seq:
        raise ValueError("RNA sequence cannot be empty.")

    if len(cleaned_seq) > MAX_SEQUENCE_LENGTH:
        raise ValueError(
            f"Sequence length ({len(cleaned_seq)}) exceeds maximum limit of {MAX_SEQUENCE_LENGTH} bases."
        )

    if not VALID_RNA_REGEX.match(cleaned_seq):
        invalid_chars = set(cleaned_seq) - set("AUGC")
        raise ValueError(f"Invalid RNA nucleotide characters detected: {', '.join(sorted(invalid_chars))}")

    seq_obj = Seq(cleaned_seq)
    seq_len = len(cleaned_seq)

    count_a = cleaned_seq.count("A")
    count_u = cleaned_seq.count("U")
    count_g = cleaned_seq.count("G")
    count_c = cleaned_seq.count("C")

    gc_bases = count_g + count_c
    gc_percent = round((gc_bases / seq_len) * 100, 2) if seq_len > 0 else 0.0
    au_percent = round(100.0 - gc_percent, 2)

    reverse_comp = str(seq_obj.reverse_complement_rna())
    dna_cdna = str(seq_obj.back_transcribe())
    
    try:
        protein_translation = str(seq_obj.translate(to_stop=False))
    except Exception:
        protein_translation = "N/A (Incomplete codon frame)"

    return {
        "sequence": cleaned_seq,
        "length": seq_len,
        "counts": {
            "A": count_a,
            "U": count_u,
            "G": count_g,
            "C": count_c
        },
        "gc_content": gc_percent,
        "au_content": au_percent,
        "reverse_complement": reverse_comp,
        "cdna": dna_cdna,
        "protein_translation": protein_translation
    }

class SequenceRequest(BaseModel):
    sequence: str = Field(
        ...,
        min_length=1,
        max_length=100_000,
        description="Nucleotide sequence"
    )

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "Biopython",
        "service": "active",
        "modules": ["DNA", "RNA"]
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
        
