# Roles and access (RBAC)

| Role (UI name) | Stored as | Can do |
|---|---|---|
| Entrepreneur | `entrepreneur` | Create and own DPRs, use the builder, Scheme Finder, chat. Sees only their own projects. |
| District Reviewer | `officer` + `reviewDistrict` | Open the review queue (`/reviewer`) for the **one district** they are assigned. Open those DPRs read-only, approve, or send back with remarks. Cannot create DPRs, manage users or see other districts. |
| APMSMEDC Admin | `admin` | Everything: all districts, review queue (district filter), user/role/district management, policies, analytics, documents, audit log. |

## Rules enforced on the server

- **Registration always creates an entrepreneur.** A `role` sent in the request is ignored. Only an admin can change a role (`PUT /api/admin/users/:id`), which must be one of the three roles, cannot be done to oneself, is audited (`role_change`), and a District Reviewer must be given a district. The district is cleared for any other role.
- **401 vs 403.** No or invalid token: `401`. A valid user whose role is not allowed: `403 {"code":"FORBIDDEN"}`, and the attempt is written to the audit log (`access_denied`).
- **Gates:** `/api/admin/*` and `/api/documents/*` need `admin`. `/api/reviewer/*` needs `officer` or `admin`.
- **Fresh role on privileged routes.** `authorize()` re-reads the role (and district) from the database for admin/reviewer routes, so a demoted or deleted account loses access at once even with an unexpired token.
- **District scope.** A reviewer's queue, DPR detail and review calls only cover projects whose step 1 `district` matches theirs; any other DPR is `403`. The shared `GET /api/dpr/:id`, cluster DPR and KYC-file downloads and `GET /api/apmsme/entrepreneur/:id` use the same scope (admin: all, reviewer: own district, everyone else: own data only).
- **Review flow:** `POST /api/reviewer/dprs/:id/review` with `decision: approve | reject`. `reject` needs remarks. Only DPRs in status `submitted` can be reviewed (`409` otherwise). Result is stored in `DPRVersion.review`.

## Client

- `ProtectedRoute` takes `requiredRole` or `allowedRoles` and shows a 403 page (`components/auth/Forbidden.tsx`) instead of silently redirecting. The server remains the real gate.
- `/reviewer` (`pages/DistrictReview.tsx`) and the side-menu link only appear for reviewers and admins.
- Admin > Users: changing someone to District Reviewer asks for their district.

## Tests

`cd server && npm run test:rbac` (needs `npm run dev` running). It registers throw-away users, seeds two districts, and checks: privileged registration is ignored, 401/403 on every reviewer/admin route per role, district isolation, review rules, admin access, role validation, and immediate loss of access after demotion. It deletes everything it created.
