import sys
from pathlib import Path

# Add backend directory to Python path so app.services resolves
sys.path.append(str(Path(__file__).parent.parent / "backend"))

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from app.services.dna_service import analyze_dna

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

class DNARequest(BaseModel):
    sequence: str = Field(
        ...,
        min_length=1,
        max_length=100_000,
        description="Raw nucleotide string containing A, T, G, C",
        example="ATGCGTACGTAGCTAGCTAG"
    )

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "engine": "Biopython",
        "service": "active"
    }

@app.post("/api/analyze/dna")
def run_dna_analysis(payload: DNARequest):
    try:
        results = analyze_dna(payload.sequence)
        return {
            "success": True,
            "data": results
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Computation error: {str(e)}"
        )
      
