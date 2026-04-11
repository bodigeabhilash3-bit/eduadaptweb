import { Topic, Stream } from './types';

export const mpcTopics: Topic[] = [
  // Mathematics
  { id: 'mpc-m1', subject: 'Mathematics', stream: 'MPC', title: 'Limits and Continuity', description: 'Understanding limits, continuity, and their applications in calculus', duration: 2, difficulty: 'beginner' },
  { id: 'mpc-m2', subject: 'Mathematics', stream: 'MPC', title: 'Differentiation', description: 'Rules of differentiation and their applications', duration: 2, difficulty: 'beginner' },
  { id: 'mpc-m3', subject: 'Mathematics', stream: 'MPC', title: 'Integration', description: 'Indefinite and definite integrals, techniques of integration', duration: 2, difficulty: 'intermediate' },
  { id: 'mpc-m4', subject: 'Mathematics', stream: 'MPC', title: 'Differential Equations', description: 'Solving first and second order differential equations', duration: 2, difficulty: 'advanced' },
  { id: 'mpc-m5', subject: 'Mathematics', stream: 'MPC', title: 'Matrices and Determinants', description: 'Operations on matrices, properties of determinants', duration: 2, difficulty: 'intermediate' },
  // Physics
  { id: 'mpc-p1', subject: 'Physics', stream: 'MPC', title: 'Kinematics', description: 'Motion in one and two dimensions, projectile motion', duration: 2, difficulty: 'beginner' },
  { id: 'mpc-p2', subject: 'Physics', stream: 'MPC', title: 'Laws of Motion', description: 'Newton\'s laws, friction, and circular motion', duration: 2, difficulty: 'beginner' },
  { id: 'mpc-p3', subject: 'Physics', stream: 'MPC', title: 'Work, Energy and Power', description: 'Conservation of energy, different forms of energy', duration: 2, difficulty: 'intermediate' },
  { id: 'mpc-p4', subject: 'Physics', stream: 'MPC', title: 'Electromagnetism', description: 'Electric and magnetic fields, electromagnetic induction', duration: 2, difficulty: 'advanced' },
  { id: 'mpc-p5', subject: 'Physics', stream: 'MPC', title: 'Modern Physics', description: 'Photoelectric effect, atomic models, nuclear physics', duration: 2, difficulty: 'advanced' },
  // Chemistry
  { id: 'mpc-c1', subject: 'Chemistry', stream: 'MPC', title: 'Atomic Structure', description: 'Electronic configuration, quantum numbers', duration: 2, difficulty: 'beginner' },
  { id: 'mpc-c2', subject: 'Chemistry', stream: 'MPC', title: 'Chemical Bonding', description: 'Types of bonds, molecular geometry', duration: 2, difficulty: 'beginner' },
  { id: 'mpc-c3', subject: 'Chemistry', stream: 'MPC', title: 'Thermodynamics', description: 'Laws of thermodynamics, enthalpy, entropy', duration: 2, difficulty: 'intermediate' },
  { id: 'mpc-c4', subject: 'Chemistry', stream: 'MPC', title: 'Organic Chemistry', description: 'Hydrocarbons, functional groups, reactions', duration: 2, difficulty: 'intermediate' },
  { id: 'mpc-c5', subject: 'Chemistry', stream: 'MPC', title: 'Coordination Chemistry', description: 'Werner\'s theory, nomenclature, isomerism', duration: 2, difficulty: 'advanced' },
];


export const getTopicsByStream = (stream: Stream): Topic[] => {
  return mpcTopics;
};

export const getTopicsBySubject = (stream: Stream, subject: string): Topic[] => {
  const topics = getTopicsByStream(stream);
  return topics.filter(t => t.subject === subject);
};

export const getWeakTopics = (stream: Stream, weakSubjects: string[]): Topic[] => {
  const topics = getTopicsByStream(stream);
  return topics.filter(t => weakSubjects.includes(t.subject));
};
