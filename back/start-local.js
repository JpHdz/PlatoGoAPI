const { MongoMemoryServer } = require("mongodb-memory-server");

(async () => {
    try {
        console.log("Starting MongoDB Memory Server...");
        const mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        console.log("MongoDB Memory Server started at:", uri);

        process.env.DATABASE = uri;
        process.env.DATABASE_PASSWORD = "local"; // Not used but required by replace logic
        process.env.NODE_ENV = "development";
        process.env.PORT = "4000";
        process.env.JWT_SECRET = "supersecretkeyforlocaldev";
        process.env.JWT_EXPIRES_IN = "90d";

        console.log("Starting API...");
        require("./server.js");
    } catch (err) {
        console.error("Failed to start local server:", err);
        process.exit(1);
    }
})();
