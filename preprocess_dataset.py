"""
Dataset Preprocessor — converts raw JSONL into structured questions.json

Reads train.jsonl, filters MPC subjects only, parses MCQ options,
assigns topics and difficulty, and outputs data/questions.json.
"""

import json
import os
import re
import random
import hashlib

SOURCE = r"c:\Users\HP\Downloads\problems (1)\problems\train (1).jsonl"
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "questions.json")

ALLOWED_SUBJECTS = {"Maths", "Physics", "Chemistry"}

# Map label_text to subject name used throughout the system
SUBJECT_MAP = {
    "Maths": "Mathematics",
    "Physics": "Physics",
    "Chemistry": "Chemistry",
}

# Topic assignment heuristics based on keywords in question text
TOPIC_KEYWORDS = {
    "Mathematics": {
        "Algebra": ["equation", "solve for", "root", "polynomial", "factor", "quadratic", "linear", "simplif", "expand", "binomial", "log", "exponent", "inequalit", "sequence", "series", "A.P", "G.P", "arithmetic progression", "geometric", "permutation", "combination", "coefficient"],
        "Calculus": ["differentiat", "integrat", "limit", "derivative", "dx", "dy/dx", "continuous", "tangent to curve", "maxima", "minima", "inflexion", "area under", "volume of revolution"],
        "Trigonometry": ["sin", "cos", "tan", "cot", "sec", "cosec", "trigonometr", "angle", "degree", "radian", "inverse trig"],
        "Coordinate Geometry": ["coordinate", "distance between", "midpoint", "slope", "equation of line", "circle equation", "ellipse", "parabola", "hyperbola", "conic", "locus", "straight line"],
        "Matrices & Determinants": ["matrix", "matrices", "determinant", "inverse matrix", "rank", "eigenvalue", "adjoint"],
        "Probability & Statistics": ["probability", "mean", "median", "mode", "variance", "standard deviation", "random variable", "distribution", "expected value", "dice", "coin", "toss", "sample space", "frequency", "histogram", "data"],
        "Sets & Logic": ["set ", "union", "intersection", "subset", "venn", "relation", "function", "domain", "range", "bijective", "injective", "surjective"],
        "Vectors": ["vector", "dot product", "cross product", "scalar product", "magnitude", "unit vector"],
        "Complex Numbers": ["complex", "imaginary", "argand", "modulus", "amplitude", "i ="],
        "Geometry": ["triangle", "circle", "square", "rectangle", "area", "perimeter", "volume", "surface area", "sphere", "cone", "cylinder", "polygon", "hexagon", "pentagon", "symmetry", "congruent", "similar"],
    },
    "Physics": {
        "Mechanics": ["newton", "force", "mass", "acceleration", "velocity", "momentum", "friction", "gravit", "projectile", "motion", "displacement", "speed", "torque", "angular", "rotation", "centripetal", "work done", "kinetic energy", "potential energy", "power", "collision", "impulse", "inertia", "equilibrium", "spring", "pendulum", "oscillat", "SHM", "harmonic"],
        "Thermodynamics": ["heat", "temperature", "thermal", "entropy", "enthalpy", "specific heat", "calorimetr", "latent heat", "boiling point", "melting", "gas law", "ideal gas", "adiabatic", "isothermal", "carnot", "kelvin"],
        "Electromagnetism": ["electric", "charge", "coulomb", "capacit", "resistor", "resistance", "current", "voltage", "ohm", "circuit", "magnetic", "inductor", "inductance", "faraday", "electromagnetic", "emf", "battery", "potentiometer", "galvanometer", "ammeter", "voltmeter", "kirchoff", "kirchhoff"],
        "Optics": ["light", "lens", "mirror", "refract", "reflect", "focal length", "prism", "wavelength", "diffraction", "interference", "polariz", "optical", "magnification", "young's double slit", "spectrum", "dispersion", "fibre optic", "fiber optic"],
        "Modern Physics": ["quantum", "photon", "electron orbit", "bohr", "photoelectric", "de broglie", "nuclear", "radioactiv", "half life", "decay", "fission", "fusion", "atom model", "hydrogen atom", "binding energy", "X-ray", "laser", "semiconductor", "diode", "transistor", "p-n junction"],
        "Waves & Sound": ["wave", "frequency", "amplitude", "resonan", "standing wave", "sound", "doppler", "beat", "vibrat", "string", "ultrasonic", "reverberat"],
        "Fluid Mechanics": ["fluid", "pressure", "buoyan", "archimedes", "bernoulli", "viscos", "surface tension", "capillar", "hydraulic", "floats", "density", "immersed"],
        "Units & Measurements": ["unit", "dimension", "measurement", "significant figure", "error", "vernier", "screw gauge"],
    },
    "Chemistry": {
        "Organic Chemistry": ["organic", "hydrocarbon", "alkane", "alkene", "alkyne", "alcohol", "aldehyde", "ketone", "carboxylic", "ester", "amine", "amide", "benzene", "aromatic", "IUPAC name", "isomer", "functional group", "SN1", "SN2", "elimination", "addition reaction", "substitution", "polymeris", "phenol", "ether", "halide", "grignard"],
        "Inorganic Chemistry": ["periodic table", "group", "period", "electronegativity", "ionization energy", "electron affinity", "metal", "non-metal", "metalloid", "transition", "lanthanoid", "actinoid", "coordination compound", "ligand", "CFSE", "d-block", "f-block", "s-block", "p-block", "ore", "extraction", "refining", "noble gas", "xenon", "halogen"],
        "Physical Chemistry": ["mole", "molarity", "molality", "solution", "concentration", "dilut", "titrat", "normality", "pH", "buffer", "solubility", "colligative", "osmotic", "Raoult", "henry", "vapour pressure", "elevation", "depression", "electrolysis", "electrochemical", "cell potential", "Nernst", "galvanic", "conductance"],
        "Chemical Bonding": ["bond", "hybridization", "sp2", "sp3", "sp ", "ionic", "covalent", "metallic", "hydrogen bond", "dipole", "VSEPR", "molecular geometry", "resonance", "lattice"],
        "Chemical Kinetics": ["rate", "order", "molecularity", "activation energy", "catalyst", "reaction rate", "half-life", "rate constant", "Arrhenius", "collision theory"],
        "Thermochemistry": ["enthalpy", "exothermic", "endothermic", "Hess", "heat of formation", "heat of combustion", "calorimeter", "internal energy", "Gibbs", "spontaneous", "equilibrium constant"],
        "Atomic Structure": ["atom", "orbital", "quantum number", "electron configuration", "shell", "subshell", "aufbau", "pauli", "hund", "wave function", "Heisenberg"],
    },
}


def assign_topic(text: str, subject: str) -> str:
    """Assign a topic based on keyword matching in the question text."""
    text_lower = text.lower()
    topics = TOPIC_KEYWORDS.get(subject, {})
    
    best_topic = None
    best_score = 0
    
    for topic, keywords in topics.items():
        score = sum(1 for kw in keywords if kw.lower() in text_lower)
        if score > best_score:
            best_score = score
            best_topic = topic
    
    # Default topics if no match
    defaults = {
        "Mathematics": "Algebra",
        "Physics": "Mechanics",
        "Chemistry": "Physical Chemistry",
    }
    return best_topic or defaults.get(subject, "General")


def assign_difficulty(text: str) -> str:
    """Heuristic: longer/more complex questions tend to be harder."""
    length = len(text)
    # Check for complexity indicators
    complexity_markers = [
        "prove", "derive", "show that", "establish", "verify",
        "assertion", "reason", "multiple correct", "matrix", "determinant",
        "integration", "differentiat",
    ]
    text_lower = text.lower()
    complexity = sum(1 for m in complexity_markers if m in text_lower)
    
    if complexity >= 2 or length > 600:
        return "Hard"
    elif complexity >= 1 or length > 300:
        return "Medium"
    else:
        return "Easy"


def parse_options(text: str) -> tuple[str, list[str], str | None]:
    """Try to extract MCQ options from the question text."""
    # Common patterns: A. B. C. D. or A) B) C) D)
    option_pattern = re.compile(
        r'(?:^|\n)\s*(?:[A-E][\.\)]\s*|[a-e][\.\)]\s*)(.*?)(?=(?:\n\s*[A-Ea-e][\.\)]|\Z))',
        re.DOTALL
    )
    
    # Try to find options
    matches = option_pattern.findall(text)
    
    if len(matches) >= 3:
        # Clean options
        options = []
        for m in matches[:4]:  # max 4 options
            opt = m.strip().replace('\n', ' ').strip()
            if opt and len(opt) > 0 and len(opt) < 500:
                options.append(opt)
        
        if len(options) >= 3:
            # Split question from options
            first_opt_match = re.search(r'(?:^|\n)\s*[Aa][\.\)]', text)
            if first_opt_match:
                question_part = text[:first_opt_match.start()].strip()
            else:
                question_part = text.split('\n')[0].strip()
            
            return question_part, options, options[0] if options else None
    
    return text.strip(), [], None


def stable_hash(text: str) -> int:
    """Generate a stable integer hash for deduplication."""
    return int(hashlib.md5(text.encode()).hexdigest()[:8], 16)


def assign_class(text: str, subject: str) -> int:
    """Heuristic for class 11 vs 12."""
    text_lower = text.lower()
    
    # Class 12 indicators
    class_12_keywords = [
        "integrat", "differentiat", "limit", "continuity", "matrices", "determinant",
        "probability distribution", "vector", "3d geometry", "linear programming",
        # Physics 12
        "electromagnetic", "optics", "modern physics", "semiconductor", "photoelectric",
        "nuclear", "magnetic field", "capacitor", "inductor", "AC circuit",
        # Chemistry 12
        "electrochemistry", "coordination", "polymer", "biomolecule", "amine",
        "aldehyde", "ketone", "carboxylic", "d-block", "f-block", "surface chemistry",
        "solid state", "solution", "chemical kinetics",
    ]
    
    class_12_score = sum(1 for kw in class_12_keywords if kw.lower() in text_lower)
    
    return 12 if class_12_score >= 1 else 11


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print(f"Reading dataset from: {SOURCE}")
    
    raw_questions = []
    with open(SOURCE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            data = json.loads(line)
            if data.get("label_text") in ALLOWED_SUBJECTS:
                raw_questions.append(data)
    
    print(f"Found {len(raw_questions)} MPC questions (excluding Biology)")
    
    # Process and structure questions
    processed = []
    seen_hashes = set()
    question_id = 1
    
    for raw in raw_questions:
        text = raw["text"]
        subject = SUBJECT_MAP[raw["label_text"]]
        
        # Skip very short or garbled questions  
        if len(text) < 20:
            continue
        
        # Deduplication
        h = stable_hash(text[:200])
        if h in seen_hashes:
            continue
        seen_hashes.add(h)
        
        # Parse MCQ options
        question_text, options, default_answer = parse_options(text)
        
        # Skip if question text is too short after parsing
        if len(question_text) < 10:
            continue
        
        # If we found MCQ options, use them; otherwise create a placeholder
        if len(options) >= 3:
            answer = options[0]  # First option as default answer
        else:
            # For non-MCQ questions, skip (we need MCQs for the quiz system)
            continue
        
        topic = assign_topic(text, subject)
        difficulty = assign_difficulty(text)
        class_level = assign_class(text, subject)
        
        processed.append({
            "id": question_id,
            "question": question_text[:1000],  # Cap length
            "options": options[:4],  # Max 4 options
            "answer": answer,
            "subject": subject,
            "topic": topic,
            "difficulty": difficulty,
            "class": class_level,
        })
        question_id += 1
        
        # Cap at 10000 questions for performance
        if question_id > 10000:
            break
    
    # Shuffle to mix subjects
    random.seed(42)
    random.shuffle(processed)
    
    # Re-assign sequential IDs after shuffle
    for i, q in enumerate(processed, 1):
        q["id"] = i
    
    # Print statistics
    stats = {}
    for q in processed:
        key = (q["subject"], q["topic"], q["difficulty"], q["class"])
        stats[key] = stats.get(key, 0) + 1
    
    print(f"\nTotal processed questions: {len(processed)}")
    
    subject_counts = {}
    for q in processed:
        subject_counts[q["subject"]] = subject_counts.get(q["subject"], 0) + 1
    print(f"By subject: {subject_counts}")
    
    diff_counts = {}
    for q in processed:
        diff_counts[q["difficulty"]] = diff_counts.get(q["difficulty"], 0) + 1
    print(f"By difficulty: {diff_counts}")
    
    class_counts = {}
    for q in processed:
        class_counts[q["class"]] = class_counts.get(q["class"], 0) + 1
    print(f"By class: {class_counts}")
    
    # Write output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(processed, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Wrote {len(processed)} questions to {OUTPUT_FILE}")
    print(f"   File size: {os.path.getsize(OUTPUT_FILE) / 1024:.1f} KB")


if __name__ == "__main__":
    main()
