# Priority 1: authentication and environment ownership

## Current progress

Implemented the separate login page, session bootstrap, redirects, logout, BCrypt credentials, and Spring Security API authentication with CSRF protection. Six integration tests exercise the real session flow. Local development currently seeds one configured account; see [setup instructions](../README.md).

Next learning step: enforce per-user ownership in the backend (Step 3), add the second test user, and replace the user-ID-based environment API. Authentication alone does not yet isolate one signed-in user's inventory from another's.

## Goal

A signed-in user can only list, create, read, update, and delete inventory in environments they own. Changing an item ID, environment ID, or user ID in a request must never grant access to someone else's data.

Authentication answers “who is making this request?” Authorization answers “may this user act on this resource?” A login screen completes only the first part.

## Proposed approach

Use Spring Security with a server-side session and an HttpOnly session cookie. Keep React and `/api` on the same origin in deployment; Vite already proxies `/api` during development. Keep CSRF protection enabled and send the CSRF token on requests that change data, including login and logout. Use HTTPS and secure session-cookie settings in production.

Use Spring Security's password encoder and authentication filters. Avoid writing a custom password comparison or manually managing the security context. Password hashes belong in persistence entities and must never appear in API responses.

Start with two development accounts. Public registration, password recovery, and shared environments can be later features.

Reference: [session management](https://docs.spring.io/spring-security/reference/servlet/authentication/session-management.html), [CSRF integration](https://docs.spring.io/spring-security/reference/servlet/exploits/csrf.html), [password storage](https://docs.spring.io/spring-security/reference/features/authentication/password-storage.html).

## How we work through each step

1. Explain one concept and identify the files involved.
2. Make one small change and read the request flow together.
3. Exercise both a successful request and a rejected request.
4. Add a regression test for the behavior before moving on.

## Step 1 — define identity and the API contract

Learning goal: understand the difference between the persisted user, the authenticated principal, and a public user response.

- Extend `User` with a unique login identifier and a password hash. Plan a database migration, including how existing users obtain credentials.
- Introduce an authenticated principal that carries the database user ID.
- Define a public current-user response containing only ID and display information.
- Agree on endpoints: `GET /api/auth/csrf`, `POST /api/auth/login`, `GET /api/auth/me`, and `POST /api/auth/logout`.
- Login will use Spring Security's configured authentication filter, with JSON success/failure responses. Document the credential request format used by that filter.
- Replace `/api/users/{userId}/environments` with `/api/environments`, deriving the owner from the authenticated principal.

Checkpoint: explain why supplying `userId` in the browser cannot prove identity.

## Step 2 — authenticate requests

Learning goal: trace browser → security filter → authentication provider → user lookup → password verification → session → controller.

- Add the Spring Security dependency and configure a `SecurityFilterChain` for the installed Spring Boot version.
- Load users through a `UserDetailsService` and verify encoded passwords through the framework.
- Allow the CSRF bootstrap and login endpoints; require authentication for inventory and environments.
- Return JSON API errors: unauthenticated requests receive 401, rejected CSRF requests receive 403, and valid login creates a session. Avoid redirects to HTML login pages for API requests.
- Fetch a fresh CSRF token after login and logout.
- Restrict the development initializer to a development profile. Seed two accounts with distinct environments and encoded passwords using explicit development configuration.

Checkpoint: anonymous inventory request → 401; incorrect password → 401 with a generic message; valid credentials plus CSRF token → session; `/me` → the correct public user; logout → subsequent inventory request receives 401.

## Step 3 — enforce ownership in the backend

Learning goal: authentication alone does not authorize access to a supplied object ID.

- Introduce a transactional inventory service with owner-scoped repository queries.
- List only the principal's items. If an environment filter is supplied, verify that the principal owns it.
- Load individual items using both item ID and owner ID for reads, updates, and deletes.
- Resolve the target environment by both environment ID and owner ID during creation and update. Require an owned environment for new items.
- Return 404 for missing or foreign resources to avoid revealing their existence.
- Use request DTOs accepting only editable fields; response DTOs exclude credentials and persistence internals.
- Validate that supplied subitem IDs belong to the edited item. Reject foreign IDs before changing the entity graph.
- Remove or secure the old user-ID-based environment endpoints.

Checkpoint: Alice cannot list, read, update, or delete Bob's items, create an item in Bob's environment, reassign an item there, or attach Bob's subitem. Bob's data remains unchanged after every rejected write.

## Step 4 — connect React

Learning goal: the frontend represents server authentication state; it does not decide authorization.

- Bootstrap `/me`, show the login form when unauthenticated, and add logout.
- Replace the hardcoded user-1 environment request with `/api/environments`.
- Send CSRF headers on POST, PUT, and DELETE; clear inventory and profile state on logout or session expiry.
- Load inventory only after selecting an owned environment. Cancel or ignore stale inventory responses when switching environments or logging out.
- Bind the edit form to the item's original environment. Make a transfer an explicit action if we support it later.
- Handle 401 as expired/absent authentication, and show useful messages for validation failures.

Checkpoint: login as Alice, refresh, logout, then login as Bob. No Alice inventory remains visible or reappears from an older request.

## Step 5 — prove isolation

Learning goal: tests must prove rejected actions cannot change data.

- Use two users with distinct environments, items, and subitems in backend integration tests.
- Cover all ownership checks above, plus requests without an environment filter.
- Test real login, session persistence, CSRF rejection, and logout in addition to tests using mock principals.
- Verify legitimate owner operations still succeed.
- Cover login failure, logout cleanup, and session expiry in frontend tests.

Done when two users can use the app independently, all cross-user operations are rejected, credentials never appear in responses, and regression tests pass.

## First learning exercise

Trace the current `GET /api/users/1/environments` call from `App.jsx` through `EnvironmentProfileController` to the repository. Identify which part currently establishes that the caller is user 1. There is no such check: the path is only a claim. Our first implementation step will replace that claim with a server-verified principal.
