import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { io, Socket } from "socket.io-client";

import { 
  Send, 
  ArrowLeft, 
  Info,
  Mic,
  Square,
  Trash2, 
  MoreVertical,
  X
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Message {
  id: number;
  chat_room_id: number;
  sender_id: number;
  sender_name: string;
  sender_profile_image: string | null;
  message_type: string;
  content: string;
  audio_url: string | null;
  audio_duration?: number;
  created_at: string;
  is_read: boolean;
}

interface ChatRoomInfo {
  chat_room_id: number;
  friend_id: number;
  friend_name: string;
  friend_profile_image: string | null;
}

const ChatPage = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [roomInfo, setRoomInfo] = useState<ChatRoomInfo | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false); 
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [deleteType, setDeleteType] = useState<"me" | "everyone" | null>(null);
  const [contextMenuMessageId, setContextMenuMessageId] = useState<number | null>(null);
  const [showClearChatModal, setShowClearChatModal] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<number | null>(null);
  const currentUserId = parseInt(localStorage.getItem("userId") || "0");

  const canDeleteForEveryone = (messageDate: string): boolean => {
    try {
      const messageTime = new Date(messageDate).getTime();
      const currentTime = new Date().getTime();
      const oneHour = 60 * 60 * 1000; 
      const timeDifference = currentTime - messageTime;
      return timeDifference <= oneHour;
    } catch (error) {
      console.error("Error checking delete time:", error);
      return true; 
    }
  };

  useEffect(() => {
    initializeChat();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [chatRoomId]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenuMessageId !== null) setContextMenuMessageId(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenuMessageId]);

  const initializeChat = async () => {
    setLoading(true);
    if (!socketRef.current) {
      socketRef.current = io(API_URL, {
        transports: ['websocket'],
        upgrade: false,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      setupSocketListeners();
      socketRef.current.on('connect', () => {
        console.log('Socket connected:', socketRef.current?.id);
        socketRef.current?.emit("join-chat-room", chatRoomId);
      });
      socketRef.current.on('connect_error', (error) => console.error('Socket error:', error));
      socketRef.current.on('disconnect', (reason) => console.log('Disconnected:', reason));
    }
    await Promise.all([fetchMessages(), fetchRoomInfo()]);
    setLoading(false);
  };

  const setupSocketListeners = () => {
    if (!socketRef.current) return;
    socketRef.current.on("new-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });
    socketRef.current.on("message-deleted", ({ messageId }: { messageId: number }) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
    });
    socketRef.current.on("user-typing", () => setIsTyping(true));
    socketRef.current.on("user-stopped-typing", () => setIsTyping(false));
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/chats/${chatRoomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data.messages);
      scrollToBottom();
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  const fetchRoomInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/chats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const room = res.data.chatRooms.find((r: ChatRoomInfo) => r.chat_room_id === parseInt(chatRoomId!));
      if (room) setRoomInfo(room);
    } catch (err) {
      console.error("Error fetching room info:", err);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/api/chats/${chatRoomId}/messages`, {
        message_type: "text",
        content: newMessage,
      }, { headers: { Authorization: `Bearer ${token}` }});
      socketRef.current?.emit("send-message", res.data.message);
      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async () => {
    if (!messageToDelete || !deleteType) return;
    try {
      const token = localStorage.getItem("token");
      const endpoint = messageToDelete.message_type === "audio"
        ? `${API_URL}/api/chats/${chatRoomId}/messages/${messageToDelete.id}/audio`
        : `${API_URL}/api/chats/${chatRoomId}/messages/${messageToDelete.id}`;
      await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        params: { deleteType }
      });
      if (deleteType === "everyone") {
        socketRef.current?.emit("delete-message", { chatRoomId, messageId: messageToDelete.id });
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete.id));
      setShowDeleteModal(false);
      setMessageToDelete(null);
      setDeleteType(null);
      setContextMenuMessageId(null);
    } catch (err) {
      console.error("Error deleting message:", err);
      alert("Failed to delete message");
    }
  };

  const openDeleteModal = (message: Message, type: "me" | "everyone") => {
    setMessageToDelete(message);
    setDeleteType(type);
    setShowDeleteModal(true);
    setContextMenuMessageId(null);
  };

  const handleClearChat = async () => {
    setShowClearChatModal(false);
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/chats/${chatRoomId}/messages/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
      socketRef.current?.emit("clear-chat-history", chatRoomId);
      alert("Chat history cleared!");
    } catch (err) {
      console.error("Error clearing chat:", err);
      alert("Failed to clear chat history.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
      setRecordingTime(0);
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    }
  };

  const sendAudioMessage = async () => {
    if (!audioBlob) return;
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("audio", audioBlob, "voice-message.webm");
      formData.append("chatRoomId", chatRoomId!);
      const res = await axios.post(`${API_URL}/api/chats/${chatRoomId}/audio`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      socketRef.current?.emit("send-message", res.data.message);
      setAudioBlob(null);
      setRecordingTime(0);
      scrollToBottom();
    } catch (err) {
      console.error("Error sending audio:", err);
      alert("Failed to send audio message");
    }
  };

  const handleTyping = () => {
    socketRef.current?.emit("typing", { chatRoomId, userId: currentUserId, userName: "User" });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit("stop-typing", { chatRoomId, userId: currentUserId });
    }, 1000);
  };

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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
            <button onClick={() => navigate("/messages")} className="p-2 hover:bg-gray-800 rounded-full transition">
              <ArrowLeft size={20} />
            </button>
            <img src={roomInfo?.friend_profile_image || "/default_profile.png"} alt={roomInfo?.friend_name || "Friend"} className="w-10 h-10 rounded-full object-cover" />
            <div>
              <h2 className="font-semibold text-sm">{roomInfo?.friend_name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowClearChatModal(true)} className="p-2 hover:bg-gray-800 rounded-full transition" title="Clear Chat History">
              <Trash2 size={20} className="text-gray-400" />
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
              const canDeleteEveryone = isOwn && canDeleteForEveryone(msg.created_at);
              return (
                <div key={msg.id} className="w-full group relative">
                  {isOwn ? (
                    <div className="flex justify-end items-start gap-2">
                      <div className="relative flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setContextMenuMessageId(contextMenuMessageId === msg.id ? null : msg.id); }} className="opacity-0 group-hover:opacity-100 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-all">
                          <MoreVertical size={18} className="text-gray-300" />
                        </button>
                        {contextMenuMessageId === msg.id && (
                          <div className="absolute left-0 top-12 bg-gray-800 rounded-lg shadow-2xl py-2 z-20 border border-gray-600 min-w-[180px]">
                            {canDeleteEveryone && (
                              <button onClick={(e) => { e.stopPropagation(); openDeleteModal(msg, "everyone"); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-3">
                                <Trash2 size={16} />
                                <span className="font-medium">Delete for Everyone</span>
                              </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); openDeleteModal(msg, "me"); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-3">
                              <Trash2 size={16} />
                              <span className="font-medium">Delete for Me</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="bg-blue-600 px-4 py-2 rounded-2xl max-w-xs break-words">
                        {msg.message_type === "audio" && msg.audio_url ? (
                          <div className="flex items-center gap-2">
                            <Mic size={16} />
                            <audio controls className="h-8">
                              <source src={msg.audio_url} type="audio/webm" />
                            </audio>
                            {msg.audio_duration && <span className="text-xs">{formatTime(msg.audio_duration)}</span>}
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start items-end gap-2">
                      <div className="w-7 flex-shrink-0">
                        {showAvatar ? <img src={msg.sender_profile_image || "/default_profile.png"} alt={msg.sender_name} className="w-7 h-7 rounded-full object-cover" /> : <div className="w-7"></div>}
                      </div>
                      <div className="bg-gray-800 px-4 py-2 rounded-2xl max-w-xs break-words">
                        {msg.message_type === "audio" && msg.audio_url ? (
                          <div className="flex items-center gap-2">
                            <Mic size={16} />
                            <audio controls className="h-8">
                              <source src={msg.audio_url} type="audio/webm" />
                            </audio>
                            {msg.audio_duration && <span className="text-xs">{formatTime(msg.audio_duration)}</span>}
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                      <div className="relative flex-shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); setContextMenuMessageId(contextMenuMessageId === msg.id ? null : msg.id); }} className="opacity-0 group-hover:opacity-100 p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-all">
                          <MoreVertical size={18} className="text-gray-300" />
                        </button>
                        {contextMenuMessageId === msg.id && (
                          <div className="absolute right-0 top-12 bg-gray-800 rounded-lg shadow-2xl py-2 z-20 border border-gray-600 min-w-[160px]">
                            <button onClick={(e) => { e.stopPropagation(); openDeleteModal(msg, "me"); }} className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-700 text-red-400 flex items-center gap-3">
                              <Trash2 size={16} />
                              <span className="font-medium">Delete for Me</span>
                            </button>
                          </div>
                        )}
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
          {isRecording ? (
            <>
              <button onClick={cancelRecording} className="p-2 hover:bg-gray-800 rounded-full transition text-red-500">
                <Trash2 size={20} />
              </button>
              <div className="flex-1 bg-red-900/20 rounded-full px-4 py-2 flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-500 font-mono text-sm">{formatTime(recordingTime)}</span>
              </div>
              <button onClick={stopRecording} className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition">
                <Square size={20} fill="white" />
              </button>
            </>
          ) : audioBlob ? (
            <>
              <button onClick={() => setAudioBlob(null)} className="p-2 hover:bg-gray-800 rounded-full transition text-red-500">
                <Trash2 size={20} />
              </button>
              <div className="flex-1 bg-gray-800 rounded-full px-4 py-2 flex items-center gap-2">
                <Mic size={16} className="text-blue-500" />
                <span className="text-sm text-gray-400">Voice message • {formatTime(recordingTime)}</span>
              </div>
              <button onClick={sendAudioMessage} className="font-semibold text-sm text-blue-500 hover:text-blue-400 transition">
                Send
              </button>
            </>
          ) : (
            <>
              <button onClick={startRecording} disabled={isSending} className="p-2 hover:bg-gray-800 rounded-full transition">
                <Mic size={20} className="text-gray-400" />
              </button>
              <div className="flex-1 bg-gray-800 rounded-full flex items-center px-4">
                <input type="text" value={newMessage} onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }} onKeyPress={(e) => e.key === "Enter" && sendMessage()} placeholder="Message..." disabled={isSending} className="flex-1 bg-transparent text-white py-2 focus:outline-none text-sm" />
              </div>
              <button onClick={sendMessage} disabled={!newMessage.trim() || isSending} className={`font-semibold text-sm transition ${(newMessage.trim() && !isSending) ? "text-blue-500 hover:text-blue-400" : "text-gray-600 cursor-not-allowed"}`}>
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Delete Message</h3>
              <button onClick={() => { setShowDeleteModal(false); setMessageToDelete(null); setDeleteType(null); }} className="p-1 hover:bg-gray-800 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400">
              {deleteType === "everyone" ? "Delete this message for everyone? Everyone in this chat will no longer see this message." : "Delete this message for you? This message will be removed from your chat, but others can still see it."}
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowDeleteModal(false); setMessageToDelete(null); setDeleteType(null); }} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleDeleteMessage} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full transition text-sm font-medium">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearChatModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-red-400">Clear Chat History</h3>
              <button onClick={() => setShowClearChatModal(false)} className="p-1 hover:bg-gray-800 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-400">
              Are you sure you want to clear all messages in this chat room? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowClearChatModal(false)} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition text-sm font-medium">
                Cancel
              </button>
              <button onClick={handleClearChat} disabled={loading} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-full transition text-sm font-medium disabled:opacity-50">
                {loading ? "Clearing..." : "Clear All"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;