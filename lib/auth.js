// Multi-tenancy seam.
// Phase A (now): single-user app, always returns user 1.
// Phase B (later, see ROADMAP.md): reads user from Auth.js session.
// Flipping this app multi-tenant only requires changing this one function.

export async function getCurrentUserId(_request) {
  return 1;
}
