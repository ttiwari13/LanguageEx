import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Video, Edit, Search } from "lucide-react";
import { io, Socket } from "socket.io-client";

interface ChatRoom {
  chat_room_id: number;
  friend_id: number;
  friend_name: string;
  friend_username: string;
  friend_profile_image: string | null;
  is_online: boolean;
  last_call_time: string | null;
}

interface UserStatusChange {
  userId: number;
  isOnline: boolean;
}

interface IncomingCall {
  callerId: number;
  chatRoomId: number;
  offer: RTCSessionDescriptionInit;
}

let socket: Socket;

const MessagesPage = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchChatRooms();
    initializeSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  const initializeSocket = () => {
    socket = io("http://localhost:4000");

    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("user-online", parseInt(userId));
    }

    socket.on("user-status-change", ({ userId, isOnline }: UserStatusChange) => {
      setChatRooms((prev) =>
        prev.map((room) =>
          room.friend_id === userId ? { ...room, is_online: isOnline } : room
        )
      );
    });

    socket.on("incoming-call", ({ callerId, chatRoomId, offer }: IncomingCall) => {
      setChatRooms((prevRooms) => {
        const room = prevRooms.find((r) => r.chat_room_id === chatRoomId);
        if (room) {
          const confirmCall = window.confirm(
            `Incoming video call from ${room.friend_name}. Accept?`
          );
          
          if (confirmCall) {
            navigate(`/video-call/${chatRoomId}`, {
              state: {
                friendId: callerId,
                friendName: room.friend_name,
                isReceiver: true,
                offer,
              },
            });
          } else {
            socket.emit("reject-call", { callerId });
          }
        }
        return prevRooms;
      });
    });
  };

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:4000/api/chats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatRooms(res.data.chatRooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openChat = (room: ChatRoom) => {
    navigate(`/chat/${room.chat_room_id}`);
  };

  const filteredChats = chatRooms.filter((room) =>
    room.friend_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.friend_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading chats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Messages</h1>
          <button className="p-2 hover:bg-gray-800 rounded-full transition">
            <Edit size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center text-gray-400 mt-20 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-gray-700 flex items-center justify-center">
              <Edit size={32} className="text-gray-600" />
            </div>
            <p className="text-xl font-semibold mb-2">Your messages</p>
            <p className="text-sm text-gray-500">
              Send private messages to a friend
            </p>
          </div>
        ) : (
          <div>
            {filteredChats.map((room) => (
              <div
                key={room.chat_room_id}
                onClick={() => openChat(room)}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 cursor-pointer transition"
              >
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <img
                    src={room.friend_profile_image || "/default_profile.png"}
                    alt={room.friend_name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {room.is_online && (
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm truncate">
                      {room.friend_name}
                    </h3>
                    {room.last_call_time && (
                      <span className="text-xs text-gray-500">
                        {new Date(room.last_call_time).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {room.is_online ? "Active now" : `@${room.friend_username}`}
                  </p>
                </div>

                {/* Video Call Icon (only if online) */}
                {room.is_online && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/video-call/${room.chat_room_id}`, {
                        state: {
                          friendId: room.friend_id,
                          friendName: room.friend_name,
                          isReceiver: false,
                        },
                      });
                    }}
                    className="p-2 hover:bg-gray-700 rounded-full transition"
                    title="Start video call"
                  >
                    <Video size={18} className="text-blue-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;