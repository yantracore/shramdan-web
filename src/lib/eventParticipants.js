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

// Statuses that mean the viewer currently HOLDS a spot (or is waitlisted for
// one). LEFT / NO_SHOW are terminal tombstones the backend retains for audit —
// the record keeps its old `role`, so role-presence alone never implies
// membership. Anything outside this set must read as "not joined".
const MEMBERSHIP_STATUSES = new Set(["CONFIRMED", "CHECKED_IN", "INVITED"]);

export function isActiveParticipationStatus(status) {
  return MEMBERSHIP_STATUSES.has(status);
}

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

// Which role (if any) the current viewer already occupies, found by matching
// their display name against each role's filledNames. Demo events have no
// /participants/me endpoint, so this is their only signal; real events fall
// back to it when the participation fetch soft-fails.
export function findViewerRoleByName(rolesNeeded, viewerName) {
  if (!viewerName || !Array.isArray(rolesNeeded)) return null;
  for (const row of rolesNeeded) {
    if (Array.isArray(row.filledNames) && row.filledNames.includes(viewerName)) {
      return row.role;
    }
  }
  return null;
}
