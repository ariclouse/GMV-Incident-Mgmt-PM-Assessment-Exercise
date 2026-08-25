import { Incident, MetaOptions, UserRef, ActivityEntry } from "./types";

const USERS: UserRef[] = [
  { id: "u1", name: "Samuel Smith", initials: "SS" },
  { id: "u2", name: "Nadia Navarez", initials: "NN" },
  { id: "u3", name: "Holly Ingles", initials: "HI" },
  { id: "u4", name: "Marcus Reed", initials: "MR" },
  { id: "u5", name: "First Name", initials: "FN" },
];

const VEHICLES = [
  { number: "22", driverName: "Alvin Valdez" },
  { number: "45", driverName: "Luther Vandross" },
  { number: "12", driverName: "Priya Chandra" },
  { number: "8", driverName: "Denise Okafor" },
  { number: "31", driverName: "Marcus Reed" },
];

const ROUTES = [
  "Glendale Long Loop",
  "DASH F",
  "Route 1 - Downtown",
  "Westlake Express",
  "702 Crosstown",
];

export const META: MetaOptions = {
  incidentTypes: [
    "Emergency",
    "Service Disruption",
    "Rider Complaint",
    "Mechanical",
    "Accident",
    "Other",
  ],
  priorities: ["Low", "Medium", "High", "Critical"],
  statuses: ["Open", "In Review", "Closed"],
  users: USERS,
  vehicles: VEHICLES,
  routes: ROUTES,
};

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function activity(
  kind: ActivityEntry["kind"],
  text: string,
  author?: UserRef,
  minutesAgo = 0
): ActivityEntry {
  const ts = new Date(Date.now() - minutesAgo * 60000).toISOString();
  return { id: uid("act"), kind, text, author, timestamp: ts };
}

function seedIncidents(): Incident[] {
  const now = Date.now();
  const iso = (d: number) => new Date(d).toISOString();

  const base: Incident[] = [
    {
      id: "203",
      type: "Emergency",
      priority: "Critical",
      status: "Open",
      vehicleNumber: "22",
      driverName: "Alvin Valdez",
      route: "Glendale Long Loop",
      location: "5th & Grand, Glendale, CA",
      date: iso(now - 1000 * 60 * 60 * 24 * 2),
      updatedAt: iso(now - 1000 * 60 * 40),
      assignee: USERS[0],
      description:
        "<p><strong>Details regarding Emergency Incident</strong></p><ul><li>An Emergency Incident was created for an emergency that occurred on Vehicle 22 on the Glendale Long Loop Route. The incident took place at 11:33am. During this route a rider experienced a medical event and needed immediate medical assistance. The current driver, Alvin Valdez, contacted emergency services and stopped the bus at the next stop.</li><li>EMS arrived on the scene at approximately 11:38am and gave immediate assistance to the rider in need.</li></ul><p><em>There are several documents that have been uploaded regarding the incident. They are attached in the Attach Files section of this incident for reference.</em></p>",
      resolution: undefined,
      activity: [
        activity("system", "Holly Ingles assigned Samuel Smith to Incident 203.", undefined, 120),
        activity("system", "Samuel Smith moved Incident 203 from Open to In Review.", undefined, 110),
        activity("comment", "EMS has cleared the scene. Rider transported to Glendale Memorial.", USERS[0], 90),
        activity("comment", "Following up with dispatch to confirm route resumed on schedule.", USERS[1], 45),
      ],
      attachments: [
        {
          id: uid("att"),
          name: "scene-photo-1.jpg",
          dataUrl:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='200' height='150' fill='%23dbeafe'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' fill='%231e3a8a'%3Escene-photo-1%3C/text%3E%3C/svg%3E",
          kind: "image",
          uploadedBy: "Nadia Navarez",
          uploadedAt: iso(now - 1000 * 60 * 80),
        },
      ],
      vehicleHistory: [
        {
          timestamp: iso(now - 1000 * 60 * 40),
          speedMph: 45,
          heading: "North",
          driverName: "Alvin Valdez",
          route: "Glendale Long Loop",
          trip: "1904632",
          run: "23",
          block: "2",
          lat: 34.058,
          lng: -118.279,
        },
      ],
    },
    {
      id: "204",
      type: "Mechanical",
      priority: "High",
      status: "Open",
      vehicleNumber: "45",
      driverName: "Luther Vandross",
      route: "DASH F",
      location: "Westlake / MacArthur Park",
      date: iso(now - 1000 * 60 * 60 * 5),
      updatedAt: iso(now - 1000 * 60 * 15),
      assignee: undefined,
      description:
        "<p>Vehicle 45 reported a check-engine warning light and loss of power on DASH F. Driver pulled over safely at Westlake Ave / 6th St.</p>",
      activity: [
        activity("system", "Automatic incident created from vehicle diagnostic alert.", undefined, 30),
      ],
      attachments: [],
      vehicleHistory: [
        {
          timestamp: iso(now - 1000 * 60 * 15),
          speedMph: 0,
          heading: "North",
          driverName: "Luther Vandross",
          route: "DASH F - very long route tag that can",
          trip: "1904632",
          run: "23",
          block: "2",
          lat: 34.057,
          lng: -118.281,
        },
      ],
    },
    {
      id: "205",
      type: "Rider Complaint",
      priority: "Low",
      status: "In Review",
      vehicleNumber: "12",
      driverName: "Priya Chandra",
      route: "Route 1 - Downtown",
      date: iso(now - 1000 * 60 * 60 * 24),
      updatedAt: iso(now - 1000 * 60 * 60 * 3),
      assignee: USERS[2],
      description:
        "<p>Rider reported the vehicle passed their stop without pausing. Reviewing onboard camera footage and GPS logs.</p>",
      activity: [
        activity("system", "Holly Ingles moved Incident 205 from Open to In Review.", undefined, 200),
        activity("comment", "Pulled camera footage, reviewing now.", USERS[2], 180),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "206",
      type: "Service Disruption",
      priority: "Medium",
      status: "In Review",
      vehicleNumber: "8",
      driverName: "Denise Okafor",
      route: "Westlake Express",
      date: iso(now - 1000 * 60 * 60 * 30),
      updatedAt: iso(now - 1000 * 60 * 120),
      assignee: USERS[1],
      description:
        "<p>Detour required due to road closure on Wilshire Blvd. Route adjusted and riders notified via app push.</p>",
      activity: [
        activity("comment", "Detour signage confirmed in place with maintenance.", USERS[1], 60),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "207",
      type: "Accident",
      priority: "Critical",
      status: "Closed",
      vehicleNumber: "31",
      driverName: "Marcus Reed",
      route: "702 Crosstown",
      date: iso(now - 1000 * 60 * 60 * 24 * 7),
      updatedAt: iso(now - 1000 * 60 * 60 * 24 * 5),
      closedAt: iso(now - 1000 * 60 * 60 * 24 * 5),
      assignee: USERS[0],
      resolution: "Resolved - Minor damage, no injuries",
      description:
        "<p>Minor collision with a parked vehicle while merging. No injuries reported. Insurance claim filed.</p>",
      activity: [
        activity("system", "Samuel Smith moved Incident 207 from In Review to Closed.", undefined, 400),
      ],
      attachments: [],
      vehicleHistory: [],
    },
  ];

  return base;
}

class IncidentStore {
  private incidents: Incident[];

  constructor() {
    this.incidents = seedIncidents();
  }

  list(): Incident[] {
    return [...this.incidents].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  get(id: string): Incident | undefined {
    return this.incidents.find((i) => i.id === id);
  }

  create(input: Partial<Incident> & { createdBy?: UserRef }): Incident {
    const now = new Date().toISOString();
    const nextId = String(
      Math.max(0, ...this.incidents.map((i) => Number(i.id) || 0)) + 1
    );
    const creatorName = input.createdBy?.name ?? "Someone";
    const incident: Incident = {
      id: nextId,
      type: input.type ?? "Emergency",
      priority: input.priority ?? "Medium",
      status: "Open",
      vehicleNumber: input.vehicleNumber ?? "",
      driverName: input.driverName ?? "",
      route: input.route ?? "",
      location: input.location,
      date: now,
      updatedAt: now,
      assignee: input.assignee,
      description: input.description ?? "",
      activity: [activity("system", `${creatorName} created this incident.`, input.createdBy, 0)],
      attachments: [],
      vehicleHistory: [],
    };
    this.incidents.unshift(incident);
    return incident;
  }

  update(id: string, patch: Partial<Incident>): Incident | undefined {
    const incident = this.get(id);
    if (!incident) return undefined;
    Object.assign(incident, patch, {
      updatedAt: new Date().toISOString(),
    });
    return incident;
  }

  addActivity(id: string, entry: ActivityEntry): Incident | undefined {
    const incident = this.get(id);
    if (!incident) return undefined;
    incident.activity.push(entry);
    incident.updatedAt = new Date().toISOString();
    return incident;
  }

  addAttachment(id: string, attachment: Incident["attachments"][number]) {
    const incident = this.get(id);
    if (!incident) return undefined;
    incident.attachments.push(attachment);
    incident.updatedAt = new Date().toISOString();
    return incident;
  }
}

const globalForStore = globalThis as unknown as { __incidentStore?: IncidentStore };

export const store = globalForStore.__incidentStore ?? new IncidentStore();
globalForStore.__incidentStore = store;

export { uid, activity };
