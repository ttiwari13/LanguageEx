import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MessageCircle, UserMinus, Check, X, Loader2 } from "lucide-react";

interface FriendRequest {
  id: number;
  sender_id?: number;
  receiver_id?: number;
  name: string;
  username: string;
  profile_image_public_id?: string;
}

interface Friend {
  id: number;
  name: string;
  username: string;
  profile_image_public_id?: string;
}
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white animate-slide-in ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    }`}>
      <div className="flex items-center gap-2">
        {type === 'success' ? <Check size={20} /> : <X size={20} />}
        {message}
      </div>
    </div>
  );
};

const API_BASE_URL = "http://localhost:4000/api";

export default function FriendsDashboard() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"friends" | "incoming" | "outgoing">("incoming");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [cancelingId, setCancelingId] = useState<number | null>(null);
  const [unfriendingId, setUnfriendingId] = useState<number | null>(null);
  const [messagingId, setMessagingId] = useState<number | null>(null);

  const navigate = useNavigate();

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      showToast("Please login first", "error");
      navigate("/");
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  const RedDot = () => (
    <span className="ml-2 inline-block w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
  );
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      if (!headers) return;

      const response = await axios.get(
        `${API_BASE_URL}/friends/all`,
        { headers }
      );

      setIncomingRequests(response.data.incoming || []);
      setOutgoingRequests(response.data.outgoing || []);
      setFriends(response.data.friends || []);

    } catch (err: any) {
      console.error("Error fetching friends data:", err);
      if (err.response?.status === 401) {
        showToast("Session expired. Please login again", "error");
        navigate("/");
      } else {
        showToast("Failed to load friends data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);
  const handleAccept = async (requestId: number) => {
    setAcceptingId(requestId);
    
    const request = incomingRequests.find(r => r.id === requestId);
    if (!request) {
      setAcceptingId(null);
      return;
    }
    const originalIncoming = [...incomingRequests];
    const originalFriends = [...friends];
    
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    setFriends(prev => [...prev, {
      id: request.sender_id!,
      name: request.name,
      username: request.username,
      profile_image_public_id: request.profile_image_public_id
    }]);

    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setIncomingRequests(originalIncoming);
        setFriends(originalFriends);
        setAcceptingId(null);
        return;
      }

      await axios.post(
        `${API_BASE_URL}/friends/accept`,
        { request_id: requestId },
        { headers }
      );
      showToast("Friend request accepted!", "success");
    } catch (err: any) {
      console.error("Accept error:", err);
      if (err.response?.status === 401) {
        showToast("Session expired", "error");
        navigate("/");
      } else {
        showToast("Failed to accept request", "error");
      }
      setIncomingRequests(originalIncoming);
      setFriends(originalFriends);
    } finally {
      setAcceptingId(null);
    }
  };
  const handleReject = async (requestId: number) => {
    setRejectingId(requestId);
    
    const originalRequests = [...incomingRequests];
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setIncomingRequests(originalRequests);
        setRejectingId(null);
        return;
      }
      await axios.post(
        `${API_BASE_URL}/friends/reject`,
        { request_id: requestId },
        { headers }
      );
      showToast("Friend request rejected", "success");
    } catch (err: any) {
      console.error("Reject error:", err);
      if (err.response?.status === 401) {
        showToast("Session expired", "error");
        navigate("/");
      } else {
        showToast("Failed to reject request", "error");
      }
      setIncomingRequests(originalRequests);
    } finally {
      setRejectingId(null);
    }
  };
  const handleCancel = async (receiverId: number) => {
    setCancelingId(receiverId);
    
    const originalRequests = [...outgoingRequests];
    setOutgoingRequests(prev => prev.filter(r => r.receiver_id !== receiverId));

    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setOutgoingRequests(originalRequests);
        setCancelingId(null);
        return;
      }

      await axios.delete(
        `${API_BASE_URL}/friends/cancel/${receiverId}`,
        { headers }
      );
      showToast("Request cancelled", "success");
    } catch (err: any) {
      console.error("Cancel error:", err);
      if (err.response?.status === 401) {
        showToast("Session expired", "error");
        navigate("/");
      } else {
        showToast("Failed to cancel request", "error");
      }
      setOutgoingRequests(originalRequests);
    } finally {
      setCancelingId(null);
    }
  };
  const handleUnfriend = async (friendId: number) => {
    const confirmUnfriend = window.confirm(
      "Are you sure you want to unfriend this person? You can still message them from your chat list."
    );
    if (!confirmUnfriend) return;

    setUnfriendingId(friendId);
    
    const originalFriends = [...friends];
    setFriends(prev => prev.filter(f => f.id !== friendId));

    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setFriends(originalFriends);
        setUnfriendingId(null);
        return;
      }

      await axios.delete(
        `${API_BASE_URL}/friends/unfriend/${friendId}`,
        { headers }
      );
      showToast("Unfriended successfully", "success");
    } catch (err: any) {
      console.error("Unfriend error:", err);
      if (err.response?.status === 401) {
        showToast("Session expired", "error");
        navigate("/");
      } else {
        showToast("Failed to unfriend", "error");
      }
      setFriends(originalFriends);
    } finally {
      setUnfriendingId(null);
    }
  };

  const handleMessage = async (friendId: number) => {
    setMessagingId(friendId);
    try {
      const headers = getAuthHeaders();
      if (!headers) {
        setMessagingId(null);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/friends/create-chat`,
        { friend_id: friendId },
        { headers }
      );

      const chatRoomId = response.data.chatRoomId || response.data.chat_room_id;

      if (!chatRoomId) throw new Error("No chat room ID received");

      navigate(`/chat/${chatRoomId}`);

    } catch (err: any) {
      console.error("Message error:", err);

      if (err.response?.status === 403) {
        showToast("You are not friends with this user", "error");
      } else if (err.response?.status === 401) {
        showToast("Session expired. Please login again", "error");
        navigate("/");
      } else {
        showToast("Failed to open chat", "error");
      }
    } finally {
      setMessagingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#A3B496] mx-auto mb-4" />
          <p className="text-xl">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <h1 className="text-4xl font-bold mb-8">Friends</h1>

      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-6 py-3 font-semibold flex items-center transition ${
            activeTab === "incoming"
              ? "border-b-2 border-[#A3B496] text-[#cddbc1]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Incoming ({incomingRequests.length})
          {incomingRequests.length > 0 && <RedDot />}
        </button>

        <button
          onClick={() => setActiveTab("friends")}
          className={`px-6 py-3 font-semibold flex items-center transition ${
            activeTab === "friends"
              ? "border-b-2 border-[#A3B496] text-[#d1dfc7]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Friends ({friends.length})
        </button>

        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-6 py-3 font-semibold flex items-center transition ${
            activeTab === "outgoing"
              ? "border-b-2 border-[#A3B496] text-[#e3eddc]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Sent ({outgoingRequests.length})
          {outgoingRequests.length > 0 && <RedDot />}
        </button>
      </div>

      {/* Incoming Requests */}
      {activeTab === "incoming" && (
        <div className="space-y-4">
          {incomingRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No incoming requests</p>
          ) : (
            incomingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-gray-800 rounded-lg p-5 flex items-center justify-between hover:bg-gray-750 transition"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={
                      req.profile_image_public_id
                        ? `https://res.cloudinary.com/demo/image/upload/w_64,h_64,c_fill/${req.profile_image_public_id}`
                        : "/default_profile.png"
                    }
                    alt={req.name}
                    loading="lazy"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{req.name}</h3>
                    <p className="text-gray-400">@{req.username}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(req.id)}
                    disabled={acceptingId === req.id}
                    className="px-6 py-2 bg-[#A3B496] hover:bg-[#c8d5be] rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {acceptingId === req.id ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Accepting...
                      </>
                    ) : (
                      "Accept"
                    )}
                  </button>

                  <button
                    onClick={() => handleReject(req.id)}
                    disabled={rejectingId === req.id}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                  >
                    {rejectingId === req.id ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Declining...
                      </>
                    ) : (
                      "Decline"
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Friends List */}
      {activeTab === "friends" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.length === 0 ? (
            <p className="text-gray-400 text-center py-8 col-span-full">No friends yet</p>
          ) : (
            friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-gray-800 rounded-lg p-5 hover:bg-gray-750 transition"
              >
                <div className="flex flex-col items-center">
                  <img
                    src={
                      friend.profile_image_public_id
                        ? `https://res.cloudinary.com/demo/image/upload/w_96,h_96,c_fill/${friend.profile_image_public_id}`
                        : "/default_profile.png"
                    }
                    alt={friend.name}
                    loading="lazy"
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                  <h3 className="text-xl font-semibold text-center">{friend.name}</h3>
                  <p className="text-gray-400 text-center mb-4">@{friend.username}</p>

                  <div className="w-full space-y-2">
                    <button
                      onClick={() => handleMessage(friend.id)}
                      disabled={messagingId === friend.id || unfriendingId === friend.id}
                      className="w-full px-4 py-2 bg-[#A3B496] hover:bg-[#b9c6af] rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {messagingId === friend.id ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Opening...
                        </>
                      ) : (
                        <>
                          <MessageCircle size={18} />
                          Message
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleUnfriend(friend.id)}
                      disabled={unfriendingId === friend.id || messagingId === friend.id}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {unfriendingId === friend.id ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Removing...
                        </>
                      ) : (
                        <>
                          <UserMinus size={18} />
                          Unfriend
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Outgoing Requests */}
      {activeTab === "outgoing" && (
        <div className="space-y-4">
          {outgoingRequests.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No pending requests</p>
          ) : (
            outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-gray-800 rounded-lg p-5 flex items-center justify-between hover:bg-gray-750 transition"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={
                      req.profile_image_public_id
                        ? `https://res.cloudinary.com/demo/image/upload/w_64,h_64,c_fill/${req.profile_image_public_id}`
                        : "/default_profile.png"
                    }
                    alt={req.name}
                    loading="lazy"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{req.name}</h3>
                    <p className="text-gray-400">@{req.username}</p>
                    <p className="text-sm text-gray-500">Request pending</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCancel(req.receiver_id!)}
                  disabled={cancelingId === req.receiver_id}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {cancelingId === req.receiver_id ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Canceling...
                    </>
                  ) : (
                    "Cancel Request"
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}