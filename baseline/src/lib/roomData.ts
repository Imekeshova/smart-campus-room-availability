export interface Booking {
  start: number;
  end: number;
}

export interface Room {
  id: string;
  name: string;
  location: string;
  capacity: number;
  equipment: string[];
  blocked: boolean;
  blockReason?: string;
  bookings: Booking[];
}

export const ROOMS: Room[] = [
  {
    id: "nova-s201",
    name: "Nova Study Room S-201",
    location: "Innovation Hub",
    capacity: 8,
    equipment: ["whiteboard", "wifi"],
    blocked: false,
    bookings: [
      { start: 600, end: 660 },
      { start: 840, end: 900 },
    ],
  },
  {
    id: "cedar-c314",
    name: "Cedar Collaboration Room C-314",
    location: "Learning Center",
    capacity: 12,
    equipment: ["projector", "whiteboard", "wifi"],
    blocked: false,
    bookings: [
      { start: 570, end: 600 },
      { start: 900, end: 960 },
    ],
  },
  {
    id: "zenith-z105",
    name: "Zenith Media Room Z-105",
    location: "Media Wing",
    capacity: 6,
    equipment: ["projector", "speakers", "wifi"],
    blocked: true,
    blockReason: "Equipment maintenance",
    bookings: [],
  },
  {
    id: "orion-o202",
    name: "Orion Computer Lab O-202",
    location: "Technology Center",
    capacity: 24,
    equipment: ["projector", "whiteboard", "computers", "wifi"],
    blocked: false,
    bookings: [
      { start: 660, end: 720 },
      { start: 780, end: 840 },
    ],
  },
];

export const DEFAULT_CURRENT_TIME = 540;
