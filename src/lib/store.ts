import { Incident, MetaOptions, UserRef, ActivityEntry } from "./types";

const USERS: UserRef[] = [
  { id: "u1", name: "Samuel Smith", initials: "SS" },
  { id: "u2", name: "Nadia Navarez", initials: "NN" },
  { id: "u3", name: "Holly Ingles", initials: "HI" },
  { id: "u4", name: "Marcus Reed", initials: "MR" },
  { id: "u5", name: "Polly Darton", initials: "PD" },
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
  // Minutes-ago for an activity entry that happened `frac` of the way through an
  // incident's life so far (0 = right at creation, 1 = just now).
  const atFraction = (ageDays: number, frac: number) => Math.round(ageDays * 1440 * (1 - frac));

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
    {
      id: "208",
      type: "Mechanical",
      priority: "Medium",
      status: "Closed",
      vehicleNumber: "45",
      driverName: "Luther Vandross",
      route: "DASH F",
      date: iso(now - 1000 * 60 * 60 * 24 * 6),
      updatedAt: iso(now - atFraction(6, 0.9) * 60000),
      closedAt: iso(now - atFraction(6, 0.9) * 60000),
      assignee: USERS[1],
      resolution: "Resolved - Vehicle repaired and returned to service.",
      description:
        "<p>Vehicle 45 reported a mechanical fault on DASH F. Driver Luther Vandross safely brought the vehicle to a stop and requested maintenance support.</p>",
      activity: [
        activity("system", "Nadia Navarez assigned Nadia Navarez to Incident 208.", undefined, atFraction(6, 0.05)),
        activity("system", "Nadia Navarez moved Incident 208 from Open to In Review.", undefined, atFraction(6, 0.35)),
        activity("comment", "Maintenance swapped the vehicle; repair scheduled.", USERS[1], atFraction(6, 0.6)),
        activity("system", "Nadia Navarez moved Incident 208 from In Review to Closed.", undefined, atFraction(6, 0.9)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "209",
      type: "Rider Complaint",
      priority: "Low",
      status: "Closed",
      vehicleNumber: "12",
      driverName: "Priya Chandra",
      route: "Route 1 - Downtown",
      date: iso(now - 1000 * 60 * 60 * 24 * 12),
      updatedAt: iso(now - atFraction(12, 0.85) * 60000),
      closedAt: iso(now - atFraction(12, 0.85) * 60000),
      assignee: USERS[2],
      resolution: "Resolved - No policy violation found.",
      description:
        "<p>A rider filed a complaint regarding service on the Route 1 - Downtown route operated by Priya Chandra (Vehicle 12). Reviewed onboard camera footage and driver logs.</p>",
      activity: [
        activity("system", "Holly Ingles moved Incident 209 from Open to In Review.", undefined, atFraction(12, 0.3)),
        activity("comment", "Footage reviewed — driver followed protocol.", USERS[2], atFraction(12, 0.6)),
        activity("system", "Holly Ingles moved Incident 209 from In Review to Closed.", undefined, atFraction(12, 0.85)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "210",
      type: "Service Disruption",
      priority: "Medium",
      status: "Open",
      vehicleNumber: "8",
      driverName: "Denise Okafor",
      route: "Westlake Express",
      date: iso(now - 1000 * 60 * 60 * 24 * 3),
      updatedAt: iso(now - atFraction(3, 0.5) * 60000),
      assignee: USERS[0],
      description:
        "<p>Service on Westlake Express was disrupted due to a road closure affecting Vehicle 8. Riders were notified via the app and the route was temporarily adjusted.</p>",
      activity: [
        activity("system", "Samuel Smith assigned Samuel Smith to Incident 210.", undefined, atFraction(3, 0.2)),
        activity("comment", "Coordinating with dispatch on a permanent detour.", USERS[0], atFraction(3, 0.5)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "211",
      type: "Emergency",
      priority: "High",
      status: "In Review",
      vehicleNumber: "31",
      driverName: "Marcus Reed",
      route: "702 Crosstown",
      date: iso(now - 1000 * 60 * 60 * 24 * 15),
      updatedAt: iso(now - atFraction(15, 0.55) * 60000),
      assignee: USERS[2],
      description:
        "<p>Emergency reported aboard Vehicle 31 on 702 Crosstown. Driver Marcus Reed pulled over immediately and requested EMS support. First responders arrived and handled the situation without further incident.</p>",
      activity: [
        activity("system", "Holly Ingles assigned Holly Ingles to Incident 211.", undefined, atFraction(15, 0.15)),
        activity("system", "Holly Ingles moved Incident 211 from Open to In Review.", undefined, atFraction(15, 0.35)),
        activity("comment", "Rider transported; following up with EMS report.", USERS[2], atFraction(15, 0.55)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "212",
      type: "Accident",
      priority: "Critical",
      status: "Closed",
      vehicleNumber: "22",
      driverName: "Alvin Valdez",
      route: "Glendale Long Loop",
      location: "Glendale Ave & Broadway",
      date: iso(now - 1000 * 60 * 60 * 24 * 19),
      updatedAt: iso(now - atFraction(19, 0.8) * 60000),
      closedAt: iso(now - atFraction(19, 0.8) * 60000),
      assignee: USERS[0],
      resolution: "Resolved - Minor damage, no injuries, claim filed.",
      description:
        "<p>Vehicle 22 was involved in a minor collision while operating Glendale Long Loop. Driver Alvin Valdez reported no injuries. Insurance and safety review completed.</p>",
      activity: [
        activity("system", "Samuel Smith moved Incident 212 from Open to In Review.", undefined, atFraction(19, 0.25)),
        activity("comment", "Insurance claim filed, photos attached.", USERS[0], atFraction(19, 0.5)),
        activity("system", "Samuel Smith moved Incident 212 from In Review to Closed.", undefined, atFraction(19, 0.8)),
      ],
      attachments: [
        {
          id: uid("att"),
          name: "collision-photo.jpg",
          dataUrl:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='200' height='150' fill='%23fee2e2'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' fill='%23991b1b'%3Ecollision-photo%3C/text%3E%3C/svg%3E",
          kind: "image",
          uploadedBy: "Samuel Smith",
          uploadedAt: iso(now - atFraction(19, 0.5) * 60000),
        },
      ],
      vehicleHistory: [],
    },
    {
      id: "213",
      type: "Other",
      priority: "Low",
      status: "Open",
      vehicleNumber: "45",
      driverName: "Luther Vandross",
      route: "DASH F",
      date: iso(now - 1000 * 60 * 60 * 24 * 4),
      updatedAt: iso(now - atFraction(4, 0.1) * 60000),
      assignee: undefined,
      description:
        "<p>An incident was logged for Vehicle 45 on DASH F that didn't fit a standard category. Luther Vandross provided initial details; team is reviewing.</p>",
      activity: [
        activity("system", "Polly Darton created this incident.", USERS[4], atFraction(4, 0.1)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "214",
      type: "Mechanical",
      priority: "High",
      status: "In Review",
      vehicleNumber: "12",
      driverName: "Priya Chandra",
      route: "Route 1 - Downtown",
      date: iso(now - 1000 * 60 * 60 * 24 * 24),
      updatedAt: iso(now - atFraction(24, 0.6) * 60000),
      assignee: USERS[4],
      description:
        "<p>Vehicle 12 experienced a mechanical issue while operating Route 1 - Downtown. Priya Chandra radioed dispatch and awaited a swap vehicle.</p>",
      activity: [
        activity("system", "Holly Ingles assigned Polly Darton to Incident 214.", undefined, atFraction(24, 0.2)),
        activity("system", "Polly Darton moved Incident 214 from Open to In Review.", USERS[4], atFraction(24, 0.4)),
        activity("comment", "Swap vehicle dispatched; awaiting confirmation.", USERS[4], atFraction(24, 0.6)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "215",
      type: "Rider Complaint",
      priority: "Medium",
      status: "Closed",
      vehicleNumber: "8",
      driverName: "Denise Okafor",
      route: "Westlake Express",
      date: iso(now - 1000 * 60 * 60 * 24 * 28),
      updatedAt: iso(now - atFraction(28, 0.75) * 60000),
      closedAt: iso(now - atFraction(28, 0.75) * 60000),
      assignee: USERS[1],
      resolution: "Resolved - Coaching provided to driver.",
      description:
        "<p>Rider complaint received for Vehicle 8 on Westlake Express. Details gathered from the rider and driver Denise Okafor for review.</p>",
      activity: [
        activity("system", "Nadia Navarez moved Incident 215 from Open to In Review.", undefined, atFraction(28, 0.3)),
        activity("comment", "Discussed with driver, coaching provided.", USERS[1], atFraction(28, 0.55)),
        activity("system", "Nadia Navarez moved Incident 215 from In Review to Closed.", undefined, atFraction(28, 0.75)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "216",
      type: "Emergency",
      priority: "Critical",
      status: "In Review",
      vehicleNumber: "31",
      driverName: "Marcus Reed",
      route: "702 Crosstown",
      date: iso(now - 1000 * 60 * 60 * 24 * 33),
      updatedAt: iso(now - atFraction(33, 0.95) * 60000),
      reopenCount: 1,
      lastReopenedAt: iso(now - atFraction(33, 0.95) * 60000),
      assignee: USERS[0],
      description:
        "<p>Emergency reported aboard Vehicle 31 on 702 Crosstown. Driver Marcus Reed pulled over immediately and requested EMS support. First responders arrived and handled the situation without further incident.</p>",
      activity: [
        activity("system", "Samuel Smith moved Incident 216 from Open to In Review.", undefined, atFraction(33, 0.2)),
        activity("comment", "EMS report received, no further injuries found.", USERS[0], atFraction(33, 0.4)),
        activity("system", "Samuel Smith moved Incident 216 from In Review to Closed.", undefined, atFraction(33, 0.6)),
        activity("comment", "Rider following up with an additional claim — reopening for review.", USERS[0], atFraction(33, 0.95)),
        activity("system", "Status changed from Closed to In Review.", undefined, atFraction(33, 0.95)),
      ],
      attachments: [
        {
          id: uid("att"),
          name: "ems-report.pdf",
          dataUrl:
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150'%3E%3Crect width='200' height='150' fill='%23fef3c7'/%3E%3Ctext x='50%25' y='50%25' font-size='14' text-anchor='middle' fill='%2392400e'%3Eems-report%3C/text%3E%3C/svg%3E",
          kind: "document",
          uploadedBy: "Samuel Smith",
          uploadedAt: iso(now - atFraction(33, 0.4) * 60000),
        },
      ],
      vehicleHistory: [],
    },
    {
      id: "217",
      type: "Service Disruption",
      priority: "Low",
      status: "Open",
      vehicleNumber: "22",
      driverName: "Alvin Valdez",
      route: "Glendale Long Loop",
      date: iso(now - 1000 * 60 * 60 * 24 * 8),
      updatedAt: iso(now - atFraction(8, 0.15) * 60000),
      assignee: undefined,
      description:
        "<p>Glendale Long Loop experienced a service disruption impacting Vehicle 22 and driver Alvin Valdez. Dispatch coordinated a detour and rider notifications went out.</p>",
      activity: [
        activity("system", "Polly Darton created this incident.", USERS[4], atFraction(8, 0.15)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "218",
      type: "Accident",
      priority: "High",
      status: "In Review",
      vehicleNumber: "45",
      driverName: "Luther Vandross",
      route: "DASH F",
      date: iso(now - 1000 * 60 * 60 * 24 * 40),
      updatedAt: iso(now - atFraction(40, 0.5) * 60000),
      assignee: USERS[2],
      description:
        "<p>A minor accident involving Vehicle 45 occurred on DASH F. Luther Vandross filed an on-scene report; no injuries reported.</p>",
      activity: [
        activity("system", "Holly Ingles assigned Holly Ingles to Incident 218.", undefined, atFraction(40, 0.2)),
        activity("system", "Holly Ingles moved Incident 218 from Open to In Review.", undefined, atFraction(40, 0.35)),
        activity("comment", "Awaiting insurance adjuster's assessment.", USERS[2], atFraction(40, 0.5)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "219",
      type: "Other",
      priority: "Medium",
      status: "Closed",
      vehicleNumber: "12",
      driverName: "Priya Chandra",
      route: "Route 1 - Downtown",
      date: iso(now - 1000 * 60 * 60 * 24 * 47),
      updatedAt: iso(now - atFraction(47, 0.7) * 60000),
      closedAt: iso(now - atFraction(47, 0.7) * 60000),
      assignee: USERS[3],
      resolution: "Resolved - Logged for reference, no action required.",
      description:
        "<p>Miscellaneous incident reported involving Vehicle 12 (Route 1 - Downtown). Driver Priya Chandra flagged the issue for review.</p>",
      activity: [
        activity("system", "Marcus Reed moved Incident 219 from Open to In Review.", undefined, atFraction(47, 0.3)),
        activity("comment", "Reviewed, no further action needed at this time.", USERS[3], atFraction(47, 0.55)),
        activity("system", "Marcus Reed moved Incident 219 from In Review to Closed.", undefined, atFraction(47, 0.7)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "220",
      type: "Mechanical",
      priority: "Low",
      status: "Open",
      vehicleNumber: "8",
      driverName: "Denise Okafor",
      route: "Westlake Express",
      date: iso(now - 1000 * 60 * 60 * 24 * 6),
      updatedAt: iso(now - atFraction(6, 0.4) * 60000),
      assignee: USERS[4],
      description:
        "<p>Vehicle 8 reported a mechanical fault on Westlake Express. Driver Denise Okafor safely brought the vehicle to a stop and requested maintenance support.</p>",
      activity: [
        activity("system", "Polly Darton assigned Polly Darton to Incident 220.", USERS[4], atFraction(6, 0.15)),
        activity("comment", "Maintenance en route to the vehicle's location.", USERS[4], atFraction(6, 0.4)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "221",
      type: "Emergency",
      priority: "High",
      status: "Open",
      vehicleNumber: "31",
      driverName: "Marcus Reed",
      route: "702 Crosstown",
      date: iso(now - 1000 * 60 * 60 * 24 * 65),
      updatedAt: iso(now - atFraction(65, 0.97) * 60000),
      reopenCount: 1,
      lastReopenedAt: iso(now - atFraction(65, 0.97) * 60000),
      assignee: USERS[1],
      description:
        "<p>Emergency reported aboard Vehicle 31 on 702 Crosstown. Driver Marcus Reed pulled over immediately and requested EMS support. First responders arrived and handled the situation without further incident.</p>",
      activity: [
        activity("system", "Nadia Navarez moved Incident 221 from Open to In Review.", undefined, atFraction(65, 0.3)),
        activity("system", "Nadia Navarez moved Incident 221 from In Review to Closed.", undefined, atFraction(65, 0.6)),
        activity("comment", "New information surfaced — reopening to reassess.", USERS[1], atFraction(65, 0.97)),
        activity("system", "Status changed from Closed to Open.", undefined, atFraction(65, 0.97)),
      ],
      attachments: [],
      vehicleHistory: [],
    },
    {
      id: "222",
      type: "Rider Complaint",
      priority: "Low",
      status: "In Review",
      vehicleNumber: "22",
      driverName: "Alvin Valdez",
      route: "Glendale Long Loop",
      date: iso(now - 1000 * 60 * 60 * 24 * 82),
      updatedAt: iso(now - atFraction(82, 0.4) * 60000),
      assignee: USERS[2],
      description:
        "<p>A rider filed a complaint regarding service on the Glendale Long Loop route operated by Alvin Valdez (Vehicle 22). Reviewing onboard camera footage and driver logs.</p>",
      activity: [
        activity("system", "Holly Ingles assigned Holly Ingles to Incident 222.", undefined, atFraction(82, 0.15)),
        activity("system", "Holly Ingles moved Incident 222 from Open to In Review.", undefined, atFraction(82, 0.4)),
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
