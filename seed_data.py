"""
Seed Data — populates the question bank and creates a sample student.

Contains 40+ questions across 3 subjects × 3 difficulty levels.
Topics: Mathematics, Physics, Chemistry
Difficulties: Easy, Medium, Hard

Run this module to populate an empty database. It's also called
automatically on app startup if the question bank is empty.
"""

from sqlalchemy.orm import Session
from models.db_models import Question, Student


def seed_questions(db: Session) -> int:
    """
    Insert all seed questions into a fresh database.
    Returns the number of questions inserted.
    """


    questions = _build_question_list()

    for q in questions:
        db.add(Question(
            question_text=q["question_text"],
            options=q["options"],
            answer=q["answer"],
            topic=q["topic"],
            difficulty=q["difficulty"],
        ))

    db.commit()
    return len(questions)


def seed_sample_student(db: Session) -> int | None:
    """Create a sample student. Returns student ID."""


    student = Student(name="Demo Student")
    db.add(student)
    db.commit()
    db.refresh(student)
    return student.id


def _build_question_list() -> list[dict]:
    """Build the full list of seed questions."""
    questions = []

    # ─── MATHEMATICS (Algebra) ───────────────────────────────────────
    questions.extend([
        # Easy
        {
            "question_text": "Solve for x: 2x + 5 = 15",
            "options": ["x = 3", "x = 5", "x = 7", "x = 10"],
            "answer": "x = 5",
            "topic": "Mathematics",
            "difficulty": "Easy",
        },
        {
            "question_text": "Simplify: 3(x + 4)",
            "options": ["3x + 4", "3x + 12", "x + 12", "3x + 7"],
            "answer": "3x + 12",
            "topic": "Mathematics",
            "difficulty": "Easy",
        },
        {
            "question_text": "What is the value of 5²?",
            "options": ["10", "20", "25", "30"],
            "answer": "25",
            "topic": "Mathematics",
            "difficulty": "Easy",
        },
        {
            "question_text": "If y = 3x and x = 4, what is y?",
            "options": ["7", "12", "34", "1"],
            "answer": "12",
            "topic": "Mathematics",
            "difficulty": "Easy",
        },
        # Medium
        {
            "question_text": "Solve: x² - 5x + 6 = 0",
            "options": ["x = 1, 6", "x = 2, 3", "x = -2, -3", "x = 0, 5"],
            "answer": "x = 2, 3",
            "topic": "Mathematics",
            "difficulty": "Medium",
        },
        {
            "question_text": "Find the discriminant of 2x² + 3x - 5 = 0",
            "options": ["49", "41", "9", "-31"],
            "answer": "49",
            "topic": "Mathematics",
            "difficulty": "Medium",
        },
        {
            "question_text": "Simplify: (x² - 9) / (x - 3)",
            "options": ["x - 3", "x + 3", "x² - 3", "x + 9"],
            "answer": "x + 3",
            "topic": "Mathematics",
            "difficulty": "Medium",
        },
        # Hard
        {
            "question_text": "Find the sum of roots of 3x² - 7x + 2 = 0",
            "options": ["7/3", "2/3", "-7/3", "3/7"],
            "answer": "7/3",
            "topic": "Mathematics",
            "difficulty": "Hard",
        },
        {
            "question_text": "If log₂(x) + log₂(x-2) = 3, find x",
            "options": ["4", "-2", "8", "6"],
            "answer": "4",
            "topic": "Mathematics",
            "difficulty": "Hard",
        },
        {
            "question_text": "Solve: |2x - 5| > 3",
            "options": ["x < 1 or x > 4", "1 < x < 4", "x > 4", "x < 1"],
            "answer": "x < 1 or x > 4",
            "topic": "Mathematics",
            "difficulty": "Hard",
        },
    ])

    # ─── MATHEMATICS (Geometry) ───────────────────────────────────────
    questions.extend([
        # Easy
        {
            "question_text": "How many sides does a hexagon have?",
            "options": ["5", "6", "7", "8"],
            "answer": "6",
            "topic": "Mathematics",
            "difficulty": "Easy",
        },
        {
            "question_text": "What is the area of a rectangle with length 5 and width 3?",
            "options": ["8", "15", "16", "20"],
            "answer": "15",
            "topic": "Mathematics",
            "difficulty": "Easy",
        },
        {
            "question_text": "What is the perimeter of a square with side 7?",
            "options": ["14", "21", "28", "49"],
            "answer": "28",
            "topic": "Mathematics",
            "difficulty": "Easy",
        },
        # Medium
        {
            "question_text": "Find the area of a circle with radius 7 (use π = 22/7)",
            "options": ["44", "154", "308", "22"],
            "answer": "154",
            "topic": "Mathematics",
            "difficulty": "Medium",
        },
        {
            "question_text": "In a right triangle with legs 6 and 8, find the hypotenuse",
            "options": ["10", "12", "14", "7"],
            "answer": "10",
            "topic": "Mathematics",
            "difficulty": "Medium",
        },
        {
            "question_text": "What is the sum of interior angles of a pentagon?",
            "options": ["360°", "540°", "720°", "180°"],
            "answer": "540°",
            "topic": "Mathematics",
            "difficulty": "Medium",
        },
        # Hard
        {
            "question_text": "Find the volume of a sphere with radius 3 (use π = 3.14)",
            "options": ["113.04", "36.00", "28.26", "84.78"],
            "answer": "113.04",
            "topic": "Mathematics",
            "difficulty": "Hard",
        },
        {
            "question_text": "Two circles have radii 5 and 12. If their centers are 13 apart, how many common tangents exist?",
            "options": ["1", "2", "3", "4"],
            "answer": "3",
            "topic": "Mathematics",
            "difficulty": "Hard",
        },
        {
            "question_text": "Find the area of a triangle with vertices (0,0), (4,0), (0,3)",
            "options": ["6", "12", "7", "3.5"],
            "answer": "6",
            "topic": "Mathematics",
            "difficulty": "Hard",
        },
    ])

    # ─── PHYSICS ──────────────────────────────────────────────────────
    questions.extend([
        # Easy
        {
            "question_text": "What is the SI unit of force?",
            "options": ["Joule", "Newton", "Watt", "Pascal"],
            "answer": "Newton",
            "topic": "Physics",
            "difficulty": "Easy",
        },
        {
            "question_text": "What is the acceleration due to gravity on Earth (approx)?",
            "options": ["8.9 m/s²", "9.8 m/s²", "10.8 m/s²", "7.8 m/s²"],
            "answer": "9.8 m/s²",
            "topic": "Physics",
            "difficulty": "Easy",
        },
        {
            "question_text": "Which of these is a vector quantity?",
            "options": ["Mass", "Temperature", "Velocity", "Energy"],
            "answer": "Velocity",
            "topic": "Physics",
            "difficulty": "Easy",
        },
        {
            "question_text": "What is the formula for speed?",
            "options": ["Distance × Time", "Distance / Time", "Time / Distance", "Force × Distance"],
            "answer": "Distance / Time",
            "topic": "Physics",
            "difficulty": "Easy",
        },
        # Medium
        {
            "question_text": "A car accelerates from 0 to 20 m/s in 5 seconds. What is the acceleration?",
            "options": ["2 m/s²", "4 m/s²", "5 m/s²", "10 m/s²"],
            "answer": "4 m/s²",
            "topic": "Physics",
            "difficulty": "Medium",
        },
        {
            "question_text": "What is the kinetic energy of a 2 kg object moving at 3 m/s?",
            "options": ["6 J", "9 J", "12 J", "18 J"],
            "answer": "9 J",
            "topic": "Physics",
            "difficulty": "Medium",
        },
        {
            "question_text": "A 10 N force moves an object 5 m. What is the work done?",
            "options": ["2 J", "15 J", "50 J", "500 J"],
            "answer": "50 J",
            "topic": "Physics",
            "difficulty": "Medium",
        },
        # Hard
        {
            "question_text": "A projectile is launched at 45° with initial velocity 20 m/s. What is the maximum height? (g=10 m/s²)",
            "options": ["5 m", "10 m", "15 m", "20 m"],
            "answer": "10 m",
            "topic": "Physics",
            "difficulty": "Hard",
        },
        {
            "question_text": "Two resistors of 6Ω and 3Ω are connected in parallel. What is the equivalent resistance?",
            "options": ["9Ω", "2Ω", "4.5Ω", "1Ω"],
            "answer": "2Ω",
            "topic": "Physics",
            "difficulty": "Hard",
        },
        {
            "question_text": "An electron moves in a magnetic field B = 0.5T with velocity 2×10⁶ m/s perpendicular to B. What is the force? (e=1.6×10⁻¹⁹ C)",
            "options": ["1.6×10⁻¹³ N", "3.2×10⁻¹³ N", "1.6×10⁻¹⁹ N", "0.8×10⁻¹³ N"],
            "answer": "1.6×10⁻¹³ N",
            "topic": "Physics",
            "difficulty": "Hard",
        },
    ])

    # ─── CHEMISTRY ────────────────────────────────────────────────────
    questions.extend([
        # Easy
        {
            "question_text": "What is the chemical symbol for water?",
            "options": ["H₂O", "CO₂", "NaCl", "O₂"],
            "answer": "H₂O",
            "topic": "Chemistry",
            "difficulty": "Easy",
        },
        {
            "question_text": "How many elements are in the periodic table (approx)?",
            "options": ["92", "108", "118", "150"],
            "answer": "118",
            "topic": "Chemistry",
            "difficulty": "Easy",
        },
        {
            "question_text": "What is the atomic number of Carbon?",
            "options": ["4", "6", "8", "12"],
            "answer": "6",
            "topic": "Chemistry",
            "difficulty": "Easy",
        },
        # Medium
        {
            "question_text": "What is the pH of a neutral solution?",
            "options": ["0", "5", "7", "14"],
            "answer": "7",
            "topic": "Chemistry",
            "difficulty": "Medium",
        },
        {
            "question_text": "Balance the equation: Fe + O₂ → Fe₂O₃. How many Fe atoms are needed?",
            "options": ["2", "3", "4", "6"],
            "answer": "4",
            "topic": "Chemistry",
            "difficulty": "Medium",
        },
        {
            "question_text": "What type of bond is formed between Na and Cl?",
            "options": ["Covalent", "Ionic", "Metallic", "Hydrogen"],
            "answer": "Ionic",
            "topic": "Chemistry",
            "difficulty": "Medium",
        },
        # Hard
        {
            "question_text": "What is the hybridization of carbon in ethylene (C₂H₄)?",
            "options": ["sp", "sp²", "sp³", "sp³d"],
            "answer": "sp²",
            "topic": "Chemistry",
            "difficulty": "Hard",
        },
        {
            "question_text": "Calculate the molarity of a solution with 4 moles of NaCl in 2 liters",
            "options": ["1 M", "2 M", "4 M", "8 M"],
            "answer": "2 M",
            "topic": "Chemistry",
            "difficulty": "Hard",
        },
        {
            "question_text": "What is the IUPAC name of CH₃CH₂OH?",
            "options": ["Methanol", "Ethanol", "Propanol", "Butanol"],
            "answer": "Ethanol",
            "topic": "Chemistry",
            "difficulty": "Hard",
        },
    ])

    return questions
