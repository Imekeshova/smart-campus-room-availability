# Five acceptance criteria for the reviewed exports

| ID | Rule | Verification |
|---|---|---|
| AC1 | A request satisfies 0 ≤ start < end ≤ 1440, with a valid current time, starts strictly in the future and lasts at most 120 minutes. | src/lib/availability.test.ts, T02–T07, T15–T16 and boundary tests. A 120-minute duration can pass while 121 minutes is rejected. |
| AC2 | Blocked rooms and positive overlaps are unavailable. Intervals can meet at an endpoint. | availability.test.ts, T01 and T08–T13. final-ui.txt shows Orion 11:30–12:30 unavailable, and 12:00–13:00 available between existing bookings. |
| AC3 | Filter by sufficient capacity and every required equipment item. Keep a matching selection, otherwise select the first match or none. Reject invalid attendee input. | src/lib/roomFiltering.test.ts, filterRooms and resolveSelectedRoom. |
| AC4 | Checking and filtering preserve the original booking, catalog and filter objects. | “preserves the original booking data” and “does not mutate the catalog or filter inputs” in availability.test.ts and roomFiltering.test.ts. |
| AC5 | The explanation agrees with the last checked room, interval where the template uses one, status and reason. An unrecognised runtime code is rejected. Declared unknown is valid for an unavailable result. | src/lib/explain.test.ts plus the Orion checker-to-code integration test. Four new cases failed in the red run and all five passed in the final run. final-direct.json also checks all eight reply variants and timeout handling. |

AGENTS.md separately preserves its original AC1–AC6 labels. The five groups above are the assignment’s cross-module acceptance contract. The fifth group exposes baseline weakness that the two mitigations close.
