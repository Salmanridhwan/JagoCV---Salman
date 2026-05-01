// Mock / seed data

import type { UserDashboardData } from "./types";

export const mockDashboardData: UserDashboardData = {
  name: "Budi Santoso",
  role: "CS Student & Web Dev",
  profileImageUrl: "https://picsum.photos/seed/budi/400/400",
  portfolioViews: 1248,
  recentDocs: [
    {
      id: "DOC-8012",
      title: "Software Engineer - TechCorp",
      type: "ATS CV",
      status: "Selesai",
      date: "2 jam yang lalu",
    },
    {
      id: "DOC-8004",
      title: "Creative Frontend Portfolio",
      type: "Visual Resume",
      status: "Draf",
      date: "1 hari yang lalu",
    },
    {
      id: "DOC-7992",
      title: "budi.link Bio Page",
      type: "Web Portfolio",
      status: "Diterbitkan",
      date: "15 Apr 2026",
    },
  ],
};
