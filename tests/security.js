// tests/security.js
// Run with: node tests/security.js
// Requires: npm run dev running in another terminal

const BASE = "http://localhost:3000";

let passed = 0;
let failed = 0;

function check(desc, expected, actual) {
  if (String(actual) === String(expected)) {
    console.log(`  PASS [${actual}] ${desc}`);
    passed++;
  } else {
    console.log(`  FAIL [got ${actual}, expected ${expected}] ${desc}`);
    failed++;
  }
}

async function getStatus(url, options = {}) {
  try {
    const res = await fetch(url, { ...options, redirect: "manual" });
    return res.status;
  } catch {
    return "ERR";
  }
}

// Store cookies across requests (simulates a browser session)
let sessionCookie = "";

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0]; // extract name=value
  }
  return res.status;
}

async function logout() {
  await fetch(`${BASE}/api/auth/logout`, {
    method: "POST",
    headers: { Cookie: sessionCookie },
  });
  sessionCookie = "";
}

function withSession(options = {}) {
  return {
    ...options,
    headers: { ...(options.headers || {}), Cookie: sessionCookie },
  };
}

async function run() {
  console.log("\n=== 1. Unauthenticated access (all should be 401) ===");

  check("GET /api/leads with no cookie", 401,
    await getStatus(`${BASE}/api/leads`));

  check("POST /api/leads with no cookie", 401,
    await getStatus(`${BASE}/api/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "test" }),
    }));

  check("PATCH /api/leads/fakeid with no cookie", 401,
    await getStatus(`${BASE}/api/leads/fakeid`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "hacked" }),
    }));

  check("DELETE /api/leads/fakeid with no cookie", 401,
    await getStatus(`${BASE}/api/leads/fakeid`, { method: "DELETE" }));

  check("GET /api/items with no cookie", 401,
    await getStatus(`${BASE}/api/items`));

  check("POST /api/organizers with no cookie", 401,
    await getStatus(`${BASE}/api/organizers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "hacker org" }),
    }));

  check("POST /api/slack/notify with no cookie", 401,
    await getStatus(`${BASE}/api/slack/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "lead_created" }),
    }));

  check("GET /api/admin/users with no cookie", 401,
    await getStatus(`${BASE}/api/admin/users`));

  console.log("\n=== 2. Forged cookie (should be 401) ===");

  check("GET /api/leads with forged cookie", 401,
    await getStatus(`${BASE}/api/leads`, {
      headers: { Cookie: "ha_crm_session=forgedvalue" },
    }));

  check("GET /api/leads with fake JWT-shaped cookie", 401,
    await getStatus(`${BASE}/api/leads`, {
      headers: { Cookie: "ha_crm_session=eyJhbGciOiJIUzI1NiJ9.fake.sig" },
    }));

  console.log("\n=== 3. Pending user cannot log in (should be 403) ===");

  const pendingStatus = await login("pending@example.com", "testpassword123");
  check("Login as pending user", 403, pendingStatus);
  sessionCookie = ""; // clear any partial cookie

  console.log("\n=== 4. Valid user login and access ===");

  const loginStatus = await login("testuser@example.com", "testpassword123");
  check("Login as approved user", 200, loginStatus);
  console.log(`  Session cookie: ${sessionCookie ? "received ✓" : "MISSING ✗"}`);

  check("GET /api/leads with valid session", 200,
    await getStatus(`${BASE}/api/leads`, withSession()));

  check("GET /api/items with valid session", 200,
    await getStatus(`${BASE}/api/items`, withSession()));

  console.log("\n=== 5. Regular user blocked from admin routes (should be 403) ===");

  check("GET /api/admin/users as regular user", 403,
    await getStatus(`${BASE}/api/admin/users`, withSession()));

  check("POST /api/organizers as regular user", 403,
    await getStatus(`${BASE}/api/organizers`, withSession({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "test org" }),
    })));

  console.log("\n=== 6. Cannot access another user's data (should be 404) ===");

  check("DELETE lead with fake ID", 404,
    await getStatus(`${BASE}/api/leads/cl0000000000000000000000000`, withSession({
      method: "DELETE",
    })));

  check("PATCH lead with fake ID", 404,
    await getStatus(`${BASE}/api/leads/cl0000000000000000000000000`, withSession({
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "hacked" }),
    })));

  console.log("\n=== 7. Logout clears session (should be 401 after) ===");

  await logout();

  check("GET /api/leads after logout", 401,
    await getStatus(`${BASE}/api/leads`, withSession()));

  console.log("\n=== 8. Admin login and access ===");

  await login("admin@example.com", "adminpassword123");

  check("GET /api/admin/users as admin", 200,
    await getStatus(`${BASE}/api/admin/users`, withSession()));

  check("POST /api/organizers as admin", 201,
    await getStatus(`${BASE}/api/organizers`, withSession({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Org " + Date.now(), email: `org${Date.now()}@test.com` }),
    })));

  await logout();

  console.log("\n=== 9. Signup rate limiting (6th attempt should be 429) ===");

  for (let i = 1; i <= 6; i++) {
    const s = await getStatus(`${BASE}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: `ratelimitest${i}${Date.now()}@test.com`,
        password: "password123",
        name: `Rate Limit Test ${i}`,
      }),
    });
    console.log(`  Attempt ${i}: ${s}${i === 6 ? " (should be 429)" : ""}`);
  }

  console.log("\n=== Results ===");
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  if (failed === 0) {
    console.log("\n  All security boundaries are working correctly.\n");
  } else {
    console.log("\n  Some checks failed — review the FAIL lines above.\n");
  }
}

run().catch(console.error);