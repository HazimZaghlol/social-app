import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verifyToken } from "../Utils";
import { ChatInitiator } from "../Modules/Chat/chat";

export const connectedSockets = new Map<string, string[]>();
let io: Server | null = null;

function socketAuthentication(socket: Socket, next: Function) {
  try {
    const token = socket.handshake.auth.authorization;
    if (!token) {
      console.log("No token provided");
      return next(new Error("Authentication token missing"));
    }

    const decodedToken = verifyToken(token, process.env.JWT_SECERT_KEY! as string);
    socket.data = {
      user: {
        _id: decodedToken._id,
        firstname: decodedToken.firstname,
        lastname: decodedToken.lastname,
      },
    };

    const userTabs = connectedSockets.get(decodedToken._id);
    if (!userTabs) {
      connectedSockets.set(decodedToken._id, [socket.id]);
    } else {
      userTabs.push(socket.id);
    }

    socket.emit("connected", { user: socket.data.user });

    next();
  } catch (error) {
    console.log("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
}

function socketDisconnection(socket: Socket) {
  socket.on("disconnect", () => {
    console.log("Socket disconnecting:", socket.id);
    const userId = socket.data.user?._id;
    if (userId) {
      let userTabs = connectedSockets.get(userId);
      if (userTabs && userTabs.length) {
        userTabs = userTabs.filter((tabId) => tabId !== socket.id);
        if (!userTabs.length) {
          connectedSockets.delete(userId);
          console.log("User fully disconnected:", userId);
        }
      }
    }
  });
}

export const ioInatializer = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  io.use(socketAuthentication);

  io.on("connection", (socket: Socket) => {
    ChatInitiator(socket);
    socketDisconnection(socket);
  });
};

export const getIOInstance = () => {
  try {
    if (!io) throw new Error("IO instance not initialized");
    return io;
  } catch (error) {
    console.log(error);
  }
};
