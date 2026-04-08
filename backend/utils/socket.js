const { Server } = require('socket.io');

let io;

module.exports = {
    init: (httpServer) => {
        io = new Server(httpServer, {
            cors: {
                origin: "*",
                methods: ["GET", "POST", "PUT"]
            }
        });
        return io;
    },
    getIO: () => {
        if (!io) {
            console.warn("Socket.io not initialized. Cannot broadcast event.");
            return null; // Return null gracefully so we don't crash the monitoring agent if called early
        }
        return io;
    }
};
