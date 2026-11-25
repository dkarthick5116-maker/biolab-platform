
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from Bio.Seq import Seq

app = FastAPI(
    title="BioLab Scientific API",
    description="Python and Biopython-powered bioinformatics backend",
    version="1.0.0"
)

# Frontend access - restrict this to your Vercel domain in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://biolab-platform-1fli.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

@app.get("/")
def home():
    return {
        "status": "online",
        "project": "BioLab",
        "engine": "Python + Biopython",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/api/dna/analyze")
def analyze_dna(data: dict):
    raw_sequence = data.get("sequence", "")

    sequence = "".join(raw_sequence.upper().split())

    if not sequence:
        return {
            "success": False,
            "error": "Please provide a DNA sequence."
        }

    if len(sequence) > 100000:
        return {
            "success": False,
            "error": "Sequence exceeds the 100,000 nucleotide limit."
        }

    if any(base not in "ATGC" for base in sequence):
        return {
            "success": False,
            "error": "Invalid DNA. Only A, T, G and C are accepted."
        }

    dna = Seq(sequence)

    length = len(dna)

    counts = {
        "A": sequence.count("A"),
        "T": sequence.count("T"),
        "G": sequence.count("G"),
        "C": sequence.count("C")
    }

    gc_content = (
        (counts["G"] + counts["C"]) / length
    ) * 100

    at_content = (
        (counts["A"] + counts["T"]) / length
    ) * 100

    return {
        "success": True,
        "engine": "Biopython",
        "sequence": sequence,
        "length": length,
        "nucleotide_count": counts,
        "gc_content": round(gc_content, 2),
        "at_content": round(at_content, 2),
        "reverse_complement": str(dna.reverse_complement()),
        "rna_transcript": str(dna.transcribe())
    }
  
