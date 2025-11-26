import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MessageCircle, UserMinus } from "lucide-react";

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

export default function FriendsDashboard() {
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagingFriend, setMessagingFriend] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"friends" | "incoming" | "outgoing">("incoming");
  
  const navigate = useNavigate();

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      
      const incomingRes = await axios.get(
        "http://localhost:4000/api/friends/incoming",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setIncomingRequests(incomingRes.data || []);
      
      const outgoingRes = await axios.get(
        "http://localhost:4000/api/friends/pending",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOutgoingRequests(outgoingRes.data || []);
      
      const friendsRes = await axios.get(
        "http://localhost:4000/api/friends/list",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFriends(friendsRes.data || []);
    } catch (err) {
      console.error("Error fetching friends data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAccept = async (requestId: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:4000/api/friends/accept",
        { request_id: requestId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Friend request accepted!");
      fetchAllData();
    } catch (err) {
      console.error("Accept error:", err);
      alert("Failed to accept request");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:4000/api/friends/reject",
        { request_id: requestId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Friend request rejected!");
      fetchAllData();
    } catch (err) {
      console.error("Reject error:", err);
      alert("Failed to reject request");
    }
  };

  const handleCancel = async (receiverId: number) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:4000/api/friends/cancel/${receiverId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Request cancelled!");
      fetchAllData();
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel request");
    }
  };

  const handleUnfriend = async (friendId: number) => {
    const confirmUnfriend = window.confirm(
      "Are you sure you want to unfriend this person? You can still message them from your chat list."
    );
    
    if (!confirmUnfriend) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:4000/api/friends/unfriend/${friendId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Unfriended successfully!");
      fetchAllData();
    } catch (err) {
      console.error("Unfriend error:", err);
      alert("Failed to unfriend");
    }
  };

  const handleMessage = async (friendId: number) => {
  setMessagingFriend(friendId);
  
  try {
    const token = localStorage.getItem("token");
    
    if (!token) {
      alert("Please login first");
      navigate("/");
      return;
    }
    
    // Create or get existing chat room
    const response = await axios.post(
      "http://localhost:4000/api/friends/create-chat",
      { friend_id: friendId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const chatRoomId = response.data.chatRoomId || response.data.chat_room_id;
    
    if (!chatRoomId) {
      throw new Error("No chat room ID received");
    }
    
    // Navigate directly to the chat page (like Instagram)
    navigate(`/chat/${chatRoomId}`);
    
  } catch (err: any) {
    console.error("Message error:", err);
    
    // Better error messages
    if (err.response?.status === 403) {
      alert("You are not friends with this user");
    } else if (err.response?.status === 401) {
      alert("Session expired. Please login again");
      navigate("/");
    } else {
      alert(err.response?.data?.error || "Failed to open chat. Please try again.");
    }
  } finally {
    setMessagingFriend(null);
  }
};
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl">Loading friends...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Friends</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-700">
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === "incoming"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Incoming Requests ({incomingRequests.length})
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === "friends"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-6 py-3 font-semibold transition ${
            activeTab === "outgoing"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Sent Requests ({outgoingRequests.length})
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
                        ? `https://res.cloudinary.com/demo/image/upload/${req.profile_image_public_id}`
                        : "/default_profile.png"
                    }
                    alt={req.name}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/default_profile.png";
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{req.name}</h3>
                    <p className="text-gray-400">@{req.username}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAccept(req.id)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition font-medium"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
                  >
                    Decline
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
                        ? `https://res.cloudinary.com/demo/image/upload/${friend.profile_image_public_id}`
                        : "/default_profile.png"
                    }
                    alt={friend.name}
                    className="w-24 h-24 rounded-full object-cover mb-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/default_profile.png";
                    }}
                  />
                  <h3 className="text-xl font-semibold text-center">{friend.name}</h3>
                  <p className="text-gray-400 text-center mb-4">@{friend.username}</p>
                  
                  {/* Action Buttons */}
                  <div className="w-full space-y-2">
                    <button
                      onClick={() => handleMessage(friend.id)}
                      disabled={messagingFriend === friend.id}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {messagingFriend === friend.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Opening...</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle size={18} />
                          <span>Message</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleUnfriend(friend.id)}
                      className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                      <UserMinus size={18} />
                      <span>Unfriend</span>
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
                        ? `https://res.cloudinary.com/demo/image/upload/${req.profile_image_public_id}`
                        : "/default_profile.png"
                    }
                    alt={req.name}
                    className="w-16 h-16 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/default_profile.png";
                    }}
                  />
                  <div>
                    <h3 className="text-xl font-semibold">{req.name}</h3>
                    <p className="text-gray-400">@{req.username}</p>
                    <p className="text-sm text-gray-500">Request pending</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(req.receiver_id!)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition font-medium"
                >
                  Cancel Request
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}