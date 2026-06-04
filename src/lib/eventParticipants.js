// Client-side aggregation: the backend's GET /events/{id} returns the raw
// rolePlan ([{role, count}]) and the participant list is its own resource
// (GET /events/{id}/participants). We compose them into the rolesNeeded
// shape the existing UI consumes — { role, count, filled, filledNames }.
//
// `filled` counts participants whose status keeps them on the active
// roster (CONFIRMED, CHECKED_IN). INVITED waitlists and LEFT/NO_SHOW
// terminal states are excluded from the filled count so the progress bar
// reflects who is actually expected at the event.

const ACTIVE_STATUSES = new Set(["CONFIRMED", "CHECKED_IN"]);

export function buildRolesNeeded(rolePlan, participants) {
  if (!Array.isArray(rolePlan)) return [];
  const safeParticipants = Array.isArray(participants) ? participants : [];

  const byRole = new Map();
  for (const p of safeParticipants) {
    if (!p?.role || !ACTIVE_STATUSES.has(p.status)) continue;
    const name = p.member?.name || p.memberName || null;
    if (!byRole.has(p.role)) byRole.set(p.role, []);
    if (name) byRole.get(p.role).push(name);
  }

  return rolePlan.map((row) => {
    const filledNames = byRole.get(row.role) || [];
    return {
      role: row.role,
      count: row.count ?? 0,
      filled: filledNames.length,
      filledNames
    };
  });
}

export function countActiveParticipants(participants) {
  if (!Array.isArray(participants)) return 0;
  let n = 0;
  for (const p of participants) {
    if (p?.status && ACTIVE_STATUSES.has(p.status)) n += 1;
  }
  return n;
}
