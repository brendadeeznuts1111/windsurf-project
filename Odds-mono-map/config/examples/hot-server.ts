#!/usr/bin/env bun

/**
 * 🔥 Bun Hot Reloading YAML Server
 * 
 * Native Bun hot reloading with YAML configuration
 * Run with: bun --hot hot-server.ts
 */

import serverConfig from "./server-config.yaml";

// Destructure the properties we need (native Bun pattern)
const { server, features, routes } = serverConfig;

console.log("🔥 Bun Hot Reloading YAML Server");
console.log("===============================");

console.log(`📋 Configuration loaded:`);
console.log(`   Server: ${server.host}:${server.port}`);
console.log(`   Debug: ${features.debug ? '✅' : '❌'}`);
console.log(`   Verbose: ${features.verbose ? '✅' : '❌'}`);
console.log(`   Routes: ${Object.keys(routes).length} configured`);

console.log(`🚀 Starting server on ${server.host}:${server.port}`);

if (features.debug) {
    console.log("🐛 Debug mode enabled");
}

// Create the server with YAML configuration
const bunServer = Bun.serve({
    port: server.port,
    hostname: server.host,
    fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;

        // Verbose logging if enabled
        if (features.verbose) {
            console.log(`📝 ${method} ${path}`);
        }

        // Route handling from YAML configuration
        const route = routes[path] as {
            method: string;
            handler: string;
            enabled: boolean;
        } | undefined;

        if (route && route.method === method && route.enabled) {
            switch (route.handler) {
                case "config":
                    return Response.json({
                        message: "Current configuration",
                        config: { server, features, routes },
                        timestamp: new Date().toISOString(),
                        hotReload: "Active - Modify server-config.yaml to see changes!"
                    });

                case "status":
                    return Response.json({
                        status: "healthy",
                        server: server,
                        features: features,
                        uptime: process.uptime(),
                        timestamp: new Date().toISOString(),
                        hotReload: "✅ Active"
                    });

                case "debug":
                    if (features.debug) {
                        return Response.json({
                            debug: true,
                            config: { server, features, routes },
                            memory: process.memoryUsage(),
                            uptime: process.uptime(),
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        return Response.json({
                            error: "Debug mode is disabled",
                            enable: "Set features.debug to true in server-config.yaml"
                        }, { status: 403 });
                    }

                case "reload":
                    return Response.json({
                        message: "Hot reload is active",
                        config: { server, features, routes },
                        note: "Modify server-config.yaml to see live changes",
                        timestamp: new Date().toISOString()
                    });
            }
        }

        // Default response
        return Response.json({
            message: "Bun Hot Reloading YAML Server",
            endpoints: Object.entries(routes)
                .filter(([_, route]) => (route as any).enabled)
                .map(([path, route]) => `${(route as any).method} ${path}`),
            hotReload: "✅ Active - Modify server-config.yaml to see changes!"
        });
    },
});

console.log(`🔥 Server running at http://${server.host}:${server.port}`);
console.log("💡 Modify server-config.yaml to see live changes!");
console.log("🌐 Available endpoints:");

Object.entries(routes)
    .filter(([_, route]) => (route as any).enabled)
    .forEach(([path, route]) => {
        console.log(`   ${(route as any).method} http://${server.host}:${server.port}${path}`);
    });

console.log("\n🔥 Hot Reload Instructions:");
console.log("1. Keep this server running");
console.log("2. Edit server-config.yaml");
console.log("3. Save the file");
console.log("4. Watch the server reload automatically!");
console.log("\n💡 Try changing:");
console.log("   - features.debug: true/false");
console.log("   - features.verbose: true/false");
console.log("   - server.port: 3001");
console.log("   - Add new routes");
