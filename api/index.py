import io
import re
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from Bio import SeqIO, Entrez
from Bio.Seq import Seq
from Bio.SeqUtils import gc_fraction
from Bio.SeqUtils.ProtParam import ProteinAnalysis

# Set NCBI compliance headers
Entrez.email = "biolab.researcher@biolab-platform.vercel.app"
Entrez.tool = "BioLabPlatform"

app = FastAPI(
    title="BioLab Scientific API",
    description="Computational biology and sequence analysis engine for BioLab.",
    version="1.3.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_SEQUENCE_LENGTH = 100_000
MAX_FASTA_ENTRIES = 100
VALID_DNA_REGEX = re.compile(r"^[ATGC]+$")
VALID_RNA_REGEX = re.compile(r"^[AUGC]+$")
VALID_PROTEIN_REGEX = re.compile(r"^[ACDEFGHIKLMNPQRSTVWY]+$")

# --- UTILITY: TYPE DETECTION ---
def detect_sequence_type(seq: str) -> str:
    cleaned = "".join(seq.split()).upper()
    if not cleaned:
        return "Unknown"
    if VALID_DNA_REGEX.match(cleaned):
        return "DNA"
    if VALID_RNA_REGEX.match(cleaned):
        return "RNA"
    if VALID_PROTEIN_REGEX.match(cleaned):
        return "Protein"
    return "Ambiguous/Other"

# --- DNA PIPELINE ---
def analyze_dna(raw_sequence: str) -> Dict[str, Any]:
    cleaned_seq = "".join(raw_sequence.split()).upper()
    if not cleaned_seq:
        raise ValueError("Sequence cannot be empty.")
    if len(cleaned_seq) > MAX_SEQUENCE_LENGTH:
        raise ValueError(f"Sequence length ({len(cleaned_seq)}) exceeds limit of {MAX_SEQUENCE_LENGTH} bases.")
    if not VALID_DNA_REGEX.match(cleaned_seq):
        invalid_chars = set(cleaned_seq) - set("ATGC")
        raise ValueError(f"Invalid DNA characters detected: {', '.join(sorted(invalid_chars))}")

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
def analyze_rna(raw_sequence: str) -> Dict[str, Any]:
    cleaned_seq = "".join(raw_sequence.split()).upper()
    if not cleaned_seq:
        raise ValueError("RNA sequence cannot be empty.")
    if len(cleaned_seq) > MAX_SEQUENCE_LENGTH:
        raise ValueError(f"Sequence length ({len(cleaned_seq)}) exceeds limit of {MAX_SEQUENCE_LENGTH} bases.")
    if not VALID_RNA_REGEX.match(cleaned_seq):
        invalid_chars = set(cleaned_seq) - set("AUGC")
        raise ValueError(f"Invalid RNA characters detected: {', '.join(sorted(invalid_chars))}")

    seq_obj = Seq(cleaned_seq)
    seq_len = len(cleaned_seq)
    gc_bases = cleaned_seq.count("G") + cleaned_seq.count("C")
    gc_percent = round((gc_bases / seq_len) * 100, 2) if seq_len > 0 else 0.0

    try:
        protein_translation = str(seq_obj.translate(to_stop=False))
    except Exception:
        protein_translation = "N/A (Sequence not divisible into complete codons)"

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
def analyze_protein(raw_sequence: str) -> Dict[str, Any]:
    cleaned_seq = "".join(raw_sequence.split()).upper()
    if not cleaned_seq:
        raise ValueError("Protein sequence cannot be empty.")
    if len(cleaned_seq) > MAX_SEQUENCE_LENGTH:
        raise ValueError(f"Sequence length ({len(cleaned_seq)}) exceeds limit of {MAX_SEQUENCE_LENGTH} residues.")
    if not VALID_PROTEIN_REGEX.match(cleaned_seq):
        invalid_chars = set(cleaned_seq) - set("ACDEFGHIKLMNPQRSTVWY")
        raise ValueError(f"Invalid amino acid characters: {', '.join(sorted(invalid_chars))}")

    analysis = ProteinAnalysis(cleaned_seq)
    seq_len = len(cleaned_seq)
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

# --- FASTA PARSER PIPELINE ---
def parse_fasta_content(content: str) -> Dict[str, Any]:
    if not content or not content.strip():
        raise ValueError("FASTA content cannot be empty.")

    handle = io.StringIO(content.strip())
    records = []

    for record in SeqIO.parse(handle, "fasta"):
        if len(records) >= MAX_FASTA_ENTRIES:
            break

        seq_str = str(record.seq).upper()
        seq_type = detect_sequence_type(seq_str)
        seq_len = len(seq_str)

        entry = {
            "id": record.id,
            "description": record.description,
            "length": seq_len,
            "type": seq_type,
            "sequence": seq_str[:200] + ("..." if seq_len > 200 else "")
        }

        if seq_type in ("DNA", "RNA"):
            gc_count = seq_str.count("G") + seq_str.count("C")
            entry["metric_label"] = "GC Content"
            entry["metric_value"] = f"{round((gc_count / seq_len) * 100, 1)}%" if seq_len > 0 else "0%"
        elif seq_type == "Protein":
            try:
                pa = ProteinAnalysis(seq_str)
                entry["metric_label"] = "pI"
                entry["metric_value"] = f"{round(pa.isoelectric_point(), 2)}"
            except Exception:
                entry["metric_label"] = "pI"
                entry["metric_value"] = "N/A"
        else:
            entry["metric_label"] = "Status"
            entry["metric_value"] = "Ambiguous"

        records.append(entry)

    if not records:
        raise ValueError("No valid FASTA records detected. Make sure lines start with '>' followed by sequence rows.")

    total_len = sum(r["length"] for r in records)
    type_counts: Dict[str, int] = {}
    for r in records:
        type_counts[r["type"]] = type_counts.get(r["type"], 0) + 1

    return {
        "record_count": len(records),
        "total_length": total_len,
        "avg_length": round(total_len / len(records), 1) if records else 0,
        "type_distribution": type_counts,
        "records": records
    }

# --- NCBI ENTREZ PIPELINE ---
def ncbi_fetch(db_name: str, identifier: str) -> Dict[str, Any]:
    clean_id = identifier.strip()
    clean_db = db_name.strip().lower()

    if clean_db not in ("nucleotide", "protein"):
        raise ValueError("Database must be 'nucleotide' or 'protein'.")
    if not clean_id:
        raise ValueError("Accession identifier cannot be empty.")

    try:
        # Fetch directly as plain FASTA text
        handle = Entrez.efetch(
            db=clean_db,
            id=clean_id,
            rettype="fasta",
            retmode="text"
        )
        fasta_str = handle.read()
        handle.close()
    except Exception as e:
        raise ValueError(f"NCBI Entrez network request failed: {str(e)}")

    if not fasta_str or not fasta_str.strip():
        raise ValueError(f"NCBI returned empty data for accession: '{clean_id}'. Verify accession validity.")

    if not fasta_str.strip().startswith(">"):
        raise ValueError(f"NCBI returned non-FASTA response: {fasta_str[:160]}")

    try:
        record_handle = io.StringIO(fasta_str.strip())
        seq_records = list(SeqIO.parse(record_handle, "fasta"))
        if not seq_records:
            raise ValueError(f"Unable to parse sequence from FASTA output for accession '{clean_id}'.")

        seq_record = seq_records[0]
        seq_str = str(seq_record.seq).upper()
        detected_type = detect_sequence_type(seq_str)

        return {
            "id": seq_record.id,
            "description": seq_record.description,
            "database": clean_db,
            "length": len(seq_str),
            "type": detected_type,
            "sequence": seq_str
        }
    except Exception as e:
        raise ValueError(f"FASTA parsing failure for NCBI data: {str(e)}")

# --- REQUEST SCHEMAS (Pydantic v1 & v2 compatible) ---
class SequenceRequest(BaseModel):
    sequence: str = Field(..., min_length=1, max_length=100_000)

class FastaRequest(BaseModel):
    fasta_content: str = Field(..., min_length=1, max_length=500_000)

class NcbiFetchRequest(BaseModel):
    db: str
    id: str

# --- ROUTES ---
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "Biopython Entrez & ProtParam",
        "service": "active",
        "modules": ["DNA", "RNA", "Protein", "FASTA", "NCBI"]
    }

@app.post("/api/analyze/dna")
def run_dna_analysis(payload: SequenceRequest):
    try:
        results = analyze_dna(payload.sequence)
        return {"success": True, "data": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Server error: {str(e)}")

@app.post("/api/analyze/rna")
def run_rna_analysis(payload: SequenceRequest):
    try:
        results = analyze_rna(payload.sequence)
        return {"success": True, "data": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Server error: {str(e)}")

@app.post("/api/analyze/protein")
def run_protein_analysis(payload: SequenceRequest):
    try:
        results = analyze_protein(payload.sequence)
        return {"success": True, "data": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Server error: {str(e)}")

@app.post("/api/analyze/fasta")
def run_fasta_analysis(payload: FastaRequest):
    try:
        results = parse_fasta_content(payload.fasta_content)
        return {"success": True, "data": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Server error: {str(e)}")

@app.post("/api/ncbi/fetch")
def run_ncbi_fetch(payload: NcbiFetchRequest):
    try:
        results = ncbi_fetch(payload.db, payload.id)
        return {"success": True, "data": results}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Server error: {str(e)}")
    
