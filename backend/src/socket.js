const { Server } = require("socket.io");

let io;

const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
            methods: ["GET", "POST"]
        }
    });

    console.log("Socket.io initialized");

    io.on("connection", (socket) => {
        console.log(`New client connected: ${socket.id}`);

        socket.on("joinAdminRoom", () => {
            console.log("Admin joined the live feed");
            socket.join("admin_room");
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected");
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

const emitAdminEvent = (type, data) => {
    if (io) {
        io.to("admin_room").emit("live_activity", {
            type,
            data,
            timestamp: new Date()
        });
    }
};

module.exports = { initSocket, getIO, emitAdminEvent };
