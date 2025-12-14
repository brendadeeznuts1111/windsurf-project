# BUN_COOKIEMAP_GUIDE.md

In Bun, **`Bun.CookieMap`** is the built-in, Map-like interface for managing HTTP cookies.

You rarely instantiate it manually. Instead, it is automatically available as `req.cookies` inside `Bun.serve()`. When you modify this map, Bun automatically handles the `Set-Cookie` headers for you.

Here is how to use it for reading, writing, and deleting cookies.

## 1. Basic Usage in `Bun.serve`

The most common way to use `CookieMap` is within a server handler.

```javascript
Bun.serve({
  port: 3000,
  fetch(req) {
    // 1. READ: req.cookies is an instance of CookieMap
    const sessionToken = req.cookies.get("session_id");

    // 2. CHECK: See if a cookie exists
    if (req.cookies.has("theme")) {
      console.log("User has a theme set");
    }

    // 3. WRITE: Set a new cookie
    // Bun automatically adds the 'Set-Cookie' header to the response
    req.cookies.set("visited", "true", {
      httpOnly: true,
      secure: true,
      path: "/",
      maxAge: 3600, // 1 hour
    });

    // 4. DELETE: Remove a cookie
    if (req.cookies.get("reset_login")) {
      req.cookies.delete("session_id");
    }

    return new Response("Check your browser console or network tab!");
  },
});
```

## 2. CookieMap Methods API

Here is a quick reference for the methods available on `req.cookies`:

| Method | Description | Example |
| :--- | :--- | :--- |
| **`.get(name)`** | Returns the value (string) or `null`. | `req.cookies.get("token")` |
| **`.set(name, val, opts)`** | Sets a cookie with options. | `req.cookies.set("auth", "123", { secure: true })` |
| **`.has(name)`** | Returns `true` if the cookie exists. | `req.cookies.has("session")` |
| **`.delete(name)`** | Expires the cookie immediately. | `req.cookies.delete("auth")` |
| **`.toJSON()`** | Returns all cookies as a plain JS object. | `const all = req.cookies.toJSON()` |
| **`for..of`** | Iterate over cookies as `[key, val]` pairs. | `for (const [name, val] of req.cookies) { ... }` |

## 3. Setting Cookie Options

When using `.set()`, you can pass a third argument to control security and scope:

```javascript
req.cookies.set("auth_token", "secret_value", {
  domain: "example.com", // Scope to domain
  path: "/admin",        // Scope to path
  secure: true,          // HTTPS only
  httpOnly: true,        // Not accessible via client-side JS
  sameSite: "Strict",    // "Strict", "Lax", or "None"
  maxAge: 86400,         // Expires in 1 day (seconds)
});
```

## 4. Standalone Usage (Advanced)

If you are processing headers manually (outside of `Bun.serve`'s automatic behavior) or testing, you can use `CookieMap` directly.

```javascript
import { CookieMap } from "bun";

// Parse a raw cookie header string
const rawHeader = "user=alice; theme=dark";
const cookies = new CookieMap(rawHeader);

console.log(cookies.get("user")); // "alice"

// Modify cookies
cookies.set("new_cookie", "123");

// Export back to headers array
const headers = cookies.toSetCookieHeaders();
// Result: ["new_cookie=123; Path=/; SameSite=Lax"]
```