export type IncidentType =
  | "Emergency"
  | "Service Disruption"
  | "Rider Complaint"
  | "Mechanical"
  | "Accident"
  | "Other";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export type Status = "Open" | "In Review" | "Closed";

export interface UserRef {
  id: string;
  name: string;
  initials: string;
}

export interface Attachment {
  id: string;
  name: string;
  dataUrl: string;
  kind: "image" | "document";
  uploadedBy: string;
  uploadedAt: string;
}

export interface ActivityEntry {
  id: string;
  kind: "system" | "comment";
  text: string;
  author?: UserRef;
  timestamp: string;
}

export interface VehicleHistoryPoint {
  timestamp: string;
  speedMph: number;
  heading: string;
  driverName: string;
  route: string;
  trip: string;
  run: string;
  block: string;
  lat: number;
  lng: number;
}

export interface Incident {
  id: string;
  type: IncidentType;
  priority: Priority;
  status: Status;
  vehicleNumber: string;
  driverName: string;
  route: string;
  location?: string;
  date: string;
  updatedAt: string;
  closedAt?: string;
  assignee?: UserRef;
  description: string;
  resolution?: string;
  activity: ActivityEntry[];
  attachments: Attachment[];
  vehicleHistory: VehicleHistoryPoint[];
}

export interface MetaOptions {
  incidentTypes: IncidentType[];
  priorities: Priority[];
  statuses: Status[];
  users: UserRef[];
  vehicles: { number: string; driverName: string }[];
  routes: string[];
}
