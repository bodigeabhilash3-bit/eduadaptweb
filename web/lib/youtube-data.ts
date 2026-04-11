/**
 * Curated YouTube video library for MPC topics.
 *
 * Each video has a real YouTube ID from high-quality educational channels
 * (Khan Academy, Organic Chemistry Tutor, 3Blue1Brown, Physics Wallah, etc.).
 */

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  duration: string; // approximate
  topic: string;
}

export const YOUTUBE_VIDEOS: Record<string, YouTubeVideo[]> = {
  Mathematics: [
    {
      id: "HfACrKJ_Y2w",
      title: "Quadratic Equations — Complete Guide",
      channel: "Khan Academy",
      duration: "12:30",
      topic: "Mathematics",
    },
    {
      id: "WUvTyaaNkzM",
      title: "The Essence of Calculus",
      channel: "3Blue1Brown",
      duration: "17:04",
      topic: "Mathematics",
    },
    {
      id: "pTnEG_WGd2Q",
      title: "Algebra Basics — Solving Equations",
      channel: "Khan Academy",
      duration: "10:45",
      topic: "Mathematics",
    },
    {
      id: "v8bkA_DqB10",
      title: "Logarithms Explained Simply",
      channel: "Organic Chemistry Tutor",
      duration: "18:20",
      topic: "Mathematics",
    },
    {
      id: "S9I3iskVHxE",
      title: "Geometry — Circles & Triangles",
      channel: "Khan Academy",
      duration: "14:15",
      topic: "Mathematics",
    },
    {
      id: "DOjCEIwSaKc",
      title: "Trigonometry — Full Course",
      channel: "Organic Chemistry Tutor",
      duration: "15:40",
      topic: "Mathematics",
    },
  ],
  Physics: [
    {
      id: "kKKM8Y-u7ds",
      title: "Newton's Laws of Motion",
      channel: "Khan Academy",
      duration: "14:22",
      topic: "Physics",
    },
    {
      id: "ZM8ECpBuQYE",
      title: "Work, Energy & Power",
      channel: "Khan Academy",
      duration: "13:08",
      topic: "Physics",
    },
    {
      id: "lf3a_6UuYXA",
      title: "Projectile Motion — Step by Step",
      channel: "Organic Chemistry Tutor",
      duration: "21:30",
      topic: "Physics",
    },
    {
      id: "x1-SibwIPM4",
      title: "Electromagnetic Induction",
      channel: "Physics Wallah",
      duration: "16:45",
      topic: "Physics",
    },
    {
      id: "qNTiikOUDWM",
      title: "Electric Circuits & Resistors",
      channel: "Organic Chemistry Tutor",
      duration: "19:12",
      topic: "Physics",
    },
    {
      id: "7vHh1sfZ5UA",
      title: "Waves & Optics Fundamentals",
      channel: "Khan Academy",
      duration: "11:50",
      topic: "Physics",
    },
  ],
  Chemistry: [
    {
      id: "bka20Q9TN6M",
      title: "Chemical Bonding — Ionic & Covalent",
      channel: "Khan Academy",
      duration: "12:15",
      topic: "Chemistry",
    },
    {
      id: "yQP4UJhNn0I",
      title: "Balancing Chemical Equations",
      channel: "Organic Chemistry Tutor",
      duration: "20:35",
      topic: "Chemistry",
    },
    {
      id: "zmdxMlb88Fs",
      title: "Periodic Table Trends Explained",
      channel: "Khan Academy",
      duration: "15:42",
      topic: "Chemistry",
    },
    {
      id: "ANi709MiFnY",
      title: "Acid-Base Reactions & pH",
      channel: "Organic Chemistry Tutor",
      duration: "17:28",
      topic: "Chemistry",
    },
    {
      id: "GQGaU2incFk",
      title: "Organic Chemistry — Hybridization",
      channel: "Organic Chemistry Tutor",
      duration: "13:55",
      topic: "Chemistry",
    },
    {
      id: "8Y4JSp5U82I",
      title: "Molarity & Dilution Calculations",
      channel: "Organic Chemistry Tutor",
      duration: "16:20",
      topic: "Chemistry",
    },
  ],
};

/**
 * Get videos for a specific topic (or all if no topic specified).
 */
export function getVideosForTopic(topic?: string): YouTubeVideo[] {
  if (topic && YOUTUBE_VIDEOS[topic]) {
    return YOUTUBE_VIDEOS[topic];
  }
  return Object.values(YOUTUBE_VIDEOS).flat();
}

/**
 * Get a random video recommendation for a topic.
 */
export function getRandomVideo(topic?: string): YouTubeVideo {
  const videos = getVideosForTopic(topic);
  return videos[Math.floor(Math.random() * videos.length)];
}
