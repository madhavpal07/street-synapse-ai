# Transit data

The active sample route, stop sequence and bus assignments are in
[bus-tracker/lib/routes.js](../bus-tracker/lib/routes.js). Maintain that one source
rather than duplicating routes.json/stops.json with conflicting coordinates.

This is demonstration data, not an operator-verified transport network.
The passenger app filters stops by direction and uses straight-line distances;
it does not calculate traffic-aware arrival times.

Future data handoff: verified agencies, routes, stops, shapes, trips and stop
times, with a source and license. GTFS Static / GTFS-Realtime remain intended
interoperability targets, not implemented exports.

