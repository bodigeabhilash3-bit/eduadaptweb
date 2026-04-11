import { Question } from './types';

export const mpcQuestions: Question[] = [
  // Mathematics (5 questions)
  {
    id: 'mpc-math-1',
    subject: 'Mathematics',
    stream: 'MPC',
    text: 'What is the derivative of sin(x)?',
    options: ['cos(x)', '-cos(x)', 'tan(x)', '-sin(x)'],
    correctAnswer: 0,
    difficulty: 'beginner',
  },
  {
    id: 'mpc-math-2',
    subject: 'Mathematics',
    stream: 'MPC',
    text: 'Find the integral of 2x dx',
    options: ['x', 'x + C', 'x² + C', '2x² + C'],
    correctAnswer: 2,
    difficulty: 'beginner',
  },
  {
    id: 'mpc-math-3',
    subject: 'Mathematics',
    stream: 'MPC',
    text: 'If f(x) = x³ - 3x² + 2x, find f\'(1)',
    options: ['0', '1', '-1', '2'],
    correctAnswer: 0,
    difficulty: 'intermediate',
  },
  {
    id: 'mpc-math-4',
    subject: 'Mathematics',
    stream: 'MPC',
    text: 'What is the limit of (sin x)/x as x approaches 0?',
    options: ['0', '1', 'infinity', 'undefined'],
    correctAnswer: 1,
    difficulty: 'intermediate',
  },
  {
    id: 'mpc-math-5',
    subject: 'Mathematics',
    stream: 'MPC',
    text: 'Solve: dy/dx = y, if y(0) = 1',
    options: ['y = eˣ', 'y = e⁻ˣ', 'y = x', 'y = ln(x)'],
    correctAnswer: 0,
    difficulty: 'advanced',
  },
  // Physics (5 questions)
  {
    id: 'mpc-phys-1',
    subject: 'Physics',
    stream: 'MPC',
    text: 'What is the SI unit of force?',
    options: ['Joule', 'Newton', 'Watt', 'Pascal'],
    correctAnswer: 1,
    difficulty: 'beginner',
  },
  {
    id: 'mpc-phys-2',
    subject: 'Physics',
    stream: 'MPC',
    text: 'According to Newton\'s second law, F equals:',
    options: ['mv', 'ma', 'mv²', 'm/a'],
    correctAnswer: 1,
    difficulty: 'beginner',
  },
  {
    id: 'mpc-phys-3',
    subject: 'Physics',
    stream: 'MPC',
    text: 'The kinetic energy of a body is proportional to:',
    options: ['velocity', 'velocity²', 'mass²', 'acceleration'],
    correctAnswer: 1,
    difficulty: 'intermediate',
  },
  {
    id: 'mpc-phys-4',
    subject: 'Physics',
    stream: 'MPC',
    text: 'In photoelectric effect, the kinetic energy of emitted electrons depends on:',
    options: ['Intensity of light', 'Frequency of light', 'Both', 'Neither'],
    correctAnswer: 1,
    difficulty: 'intermediate',
  },
  {
    id: 'mpc-phys-5',
    subject: 'Physics',
    stream: 'MPC',
    text: 'The de Broglie wavelength of a particle is given by:',
    options: ['h/mv', 'hv/m', 'mv/h', 'mh/v'],
    correctAnswer: 0,
    difficulty: 'advanced',
  },
  // Chemistry (5 questions)
  {
    id: 'mpc-chem-1',
    subject: 'Chemistry',
    stream: 'MPC',
    text: 'What is the atomic number of Carbon?',
    options: ['4', '6', '8', '12'],
    correctAnswer: 1,
    difficulty: 'beginner',
  },
  {
    id: 'mpc-chem-2',
    subject: 'Chemistry',
    stream: 'MPC',
    text: 'Which type of bond is formed between Na and Cl in NaCl?',
    options: ['Covalent', 'Ionic', 'Metallic', 'Hydrogen'],
    correctAnswer: 1,
    difficulty: 'beginner',
  },
  {
    id: 'mpc-chem-3',
    subject: 'Chemistry',
    stream: 'MPC',
    text: 'The hybridization of carbon in methane (CH₄) is:',
    options: ['sp', 'sp²', 'sp³', 'sp³d'],
    correctAnswer: 2,
    difficulty: 'intermediate',
  },
  {
    id: 'mpc-chem-4',
    subject: 'Chemistry',
    stream: 'MPC',
    text: 'Which of the following is a Lewis acid?',
    options: ['NH₃', 'BF₃', 'H₂O', 'OH⁻'],
    correctAnswer: 1,
    difficulty: 'intermediate',
  },
  {
    id: 'mpc-chem-5',
    subject: 'Chemistry',
    stream: 'MPC',
    text: 'The IUPAC name of CH₃-CH=CH-CHO is:',
    options: ['But-2-enal', 'But-3-enal', 'Butanal', 'Butenone'],
    correctAnswer: 0,
    difficulty: 'advanced',
  },
];


export const getQuestionsByStream = (stream: 'MPC'): Question[] => {
  return mpcQuestions;
};

export const getSubjectsByStream = (stream: 'MPC'): string[] => {
  return ['Mathematics', 'Physics', 'Chemistry'];
};
