// Types and Interfaces

export type DocType =
  | "ATS CV"
  | "Visual Resume"
  | "Web Portfolio"
  | "Cover Letter";

export type DocStatus = "Selesai" | "Draf" | "Diterbitkan";

export interface RecentDocument {
  id: string;
  title: string;
  type: DocType;
  status: DocStatus;
  date: string;
}

export interface UserDashboardData {
  name: string;
  role: string;
  profileImageUrl: string;
  portfolioViews: number;
  recentDocs: RecentDocument[];
}
