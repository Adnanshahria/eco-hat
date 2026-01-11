import express from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        const duration = Date.now() - start;
        if (req.path.startsWith("/api")) {
            console.log(`${new Date().toLocaleTimeString()} [API] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
        }
    });
    next();
});

(async () => {
    await registerRoutes(httpServer, app);

    const port = parseInt(process.env.API_PORT || "3001", 10);
    httpServer.listen(port, "0.0.0.0", () => {
        console.log(`✅ API Server running on http://localhost:${port}`);
    });
})();
