import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { 
  Video, 
  Send, 
  ArrowLeft, 
  Info
} from "lucide-react";

interface Message {
  id: number;
  chat_room_id: number;
  sender_id: number;
  sender_name: string;
  sender_profile_image: string | null;
  message_type: string;
  content: string;
  audio_url: string | null;
  created_at: string;
  is_read: boolean;
}

interface ChatRoomInfo {
  chat_room_id: number;
  friend_id: number;
  friend_name: string;
  friend_profile_image: string | null;
  is_online: boolean;
}

let socket: Socket;

const ChatPage = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [roomInfo, setRoomInfo] = useState<ChatRoomInfo | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const currentUserId = parseInt(localStorage.getItem("userId") || "0");

  useEffect(() => {
    initializeChat();

    return () => {
      if (socket) socket.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [chatRoomId]);

  const initializeChat = async () => {
    socket = io("http://localhost:4000");
    
    const userId = localStorage.getItem("userId");
    if (userId) {
      socket.emit("user-online", parseInt(userId));
    }

    socket.emit("join-chat-room", chatRoomId);
    setupSocketListeners();

    await Promise.all([fetchMessages(), fetchRoomInfo()]);
    
    setLoading(false);
  };

  const setupSocketListeners = () => {
    socket.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    socket.on("user-typing", () => {
      setIsTyping(true);
    });

    socket.on("user-stopped-typing", () => {
      setIsTyping(false);
    });

    socket.on("user-status-change", ({ userId, isOnline }: { userId: number; isOnline: boolean }) => {
      if (roomInfo && roomInfo.friend_id === userId) {
        setRoomInfo((prev) => prev ? { ...prev, is_online: isOnline } : null);
      }
    });
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `http://localhost:4000/api/chats/${chatRoomId}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data.messages);
      scrollToBottom();
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const fetchRoomInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://localhost:4000/api/chats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const room = res.data.chatRooms.find(
        (r: ChatRoomInfo) => r.chat_room_id === parseInt(chatRoomId!)
      );
      
      if (room) setRoomInfo(room);
    } catch (err) {
      console.error("Error fetching room info:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:4000/api/chats/${chatRoomId}/messages`,
        {
          message_type: "text",
          content: newMessage,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      socket.emit("send-message", res.data.message);
      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  const handleTyping = () => {
    socket.emit("typing", {
      chatRoomId,
      userId: currentUserId,
      userName: "User",
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      socket.emit("stop-typing", { chatRoomId, userId: currentUserId });
    }, 1000);
  };

  const startVideoCall = () => {
    if (!roomInfo?.is_online) {
      alert(`${roomInfo?.friend_name} is currently offline`);
      return;
    }

    navigate(`/video-call/${chatRoomId}`, {
      state: {
        friendId: roomInfo.friend_id,
        friendName: roomInfo.friend_name,
        isReceiver: false,
      },
    });
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  if (loading) {
    return (
      <div className="h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col">
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate("/messages")} 
              className="p-2 hover:bg-gray-800 rounded-full transition"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="relative">
              <img
                src={roomInfo?.friend_profile_image || "/default_profile.png"}
                alt={roomInfo?.friend_name || "Friend"}
                className="w-10 h-10 rounded-full object-cover"
              />
              {roomInfo?.is_online && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
              )}
            </div>

            <div>
              <h2 className="font-semibold text-sm">{roomInfo?.friend_name}</h2>
              <p className="text-xs text-gray-400">
                {roomInfo?.is_online ? "Active now" : "Offline"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={startVideoCall}
              className={`p-2 rounded-full transition ${
                roomInfo?.is_online 
                  ? "hover:bg-gray-800" 
                  : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!roomInfo?.is_online}
            >
              <Video size={20} className="text-blue-500" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-full transition">
              <Info size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6" style={{ backgroundColor: '#000' }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="w-24 h-24 mb-4 rounded-full border-2 border-gray-800 flex items-center justify-center">
              <Send size={40} className="text-gray-700" />
            </div>
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-2xl mx-auto">
            {messages.map((msg, index) => {
              const isOwn = msg.sender_id === currentUserId;
              const showAvatar = index === messages.length - 1 || messages[index + 1]?.sender_id !== msg.sender_id;
              
              return (
                <div key={msg.id} className="w-full">
                  {isOwn ? (
                    <div className="flex justify-end">
                      <div className="bg-blue-600 px-4 py-2 rounded-2xl max-w-xs break-words">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start items-end gap-2">
                      <div className="w-7 flex-shrink-0">
                        {showAvatar ? (
                          <img
                            src={msg.sender_profile_image || "/default_profile.png"}
                            alt={msg.sender_name}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7"></div>
                        )}
                      </div>
                      <div className="bg-gray-800 px-4 py-2 rounded-2xl max-w-xs break-words">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 flex-shrink-0"></div>
                <div className="bg-gray-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="bg-gray-900 border-t border-gray-800 p-4">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="flex-1 bg-gray-800 rounded-full flex items-center px-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Message..."
              className="flex-1 bg-transparent text-white py-2 focus:outline-none text-sm"
            />
          </div>

          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className={`font-semibold text-sm transition ${
              newMessage.trim()
                ? "text-blue-500 hover:text-blue-400"
                : "text-gray-600 cursor-not-allowed"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;