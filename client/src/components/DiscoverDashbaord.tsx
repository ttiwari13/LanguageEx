import { useEffect, useState } from "react";
import axios from "axios";
import useDebounce from "../hooks/useDebounce";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface User {
  id: number;
  name: string;
  username: string;
  offering_language: string | null;
  seeking_language: string | null;
  profile_image_url?: string | null;
  location: string | null;
  interests: string[] | null;
  is_online: boolean;
  last_seen: string | null;
}

const DiscoverDashboard = () => {
  const [partners, setPartners] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [requestSent, setRequestSent] = useState<Set<number>>(new Set());
  
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(12);
  const [friendIds, setFriendIds] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedOffering, setSelectedOffering] = useState<string>("");
  const [selectedSeeking, setSelectedSeeking] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("");

  const debouncedOffering = useDebounce(selectedOffering, 500);
  const debouncedSeeking = useDebounce(selectedSeeking, 500);

const fetchDiscover = async (pageNumber: number = 1) => {
  try {
    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) return;
    const friendDataRes = await axios.get(`${API_URL}/api/friends/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const currentFriendIds = new Set<number>(
  friendDataRes.data.friends?.map((f: any) => f.id as number) || []
);
    setFriendIds(currentFriendIds);

    let url = `${API_URL}/api/discover?page=${pageNumber}&limit=${limit}`;

    if (debouncedOffering) url += `&offering_language=${encodeURIComponent(debouncedOffering)}`;
    if (debouncedSeeking) url += `&seeking_language=${encodeURIComponent(debouncedSeeking)}`;
    if (sortBy === "match") url += `&sort=match`;
    if (sortBy === "active") url += `&sort=recent`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const filteredUsers = res.data.users.filter(
      (user: User) => !currentFriendIds.has(user.id)
    );

    setPartners(filteredUsers);
    setTotalPages(res.data.pagination.totalPages);
    setPage(res.data.pagination.currentPage);

  } catch (err) {
    console.error("Discover fetch error", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    setPage(1);
    fetchDiscover(1);
  }, [debouncedOffering, debouncedSeeking, sortBy]);

  useEffect(() => {
    if (page !== 1) fetchDiscover(page);
  }, [page]);

const handleAddFriend = async (receiver_id: number) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      return;
    }

    const response = await axios.post(
      `${API_URL}/api/friends/send`,
      { receiver_id },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setRequestSent(prev => new Set(prev).add(receiver_id));
    if (response.data.request?.status === 'accepted') {
      setPartners(prev => prev.filter(p => p.id !== receiver_id));
      alert("You are now friends!");
    } else {
      alert("Friend request sent!");
    }

  } catch (error: any) {
    const message = error.response?.data?.message || "Something went wrong";
    alert(message);
  }
};

  const handleResetFilters = () => {
    setSelectedOffering("");
    setSelectedSeeking("");
    setSortBy("");
    setPage(1);
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Offline";
    const date = new Date(lastSeen);
    if (isNaN(date.getTime())) return "Offline";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours === 1) return "1 hour ago";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString();
  };

  if (loading && partners.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading partners...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-6">Discover Partners</h1>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-5 py-2 rounded-full border transition ${
              showFilters || selectedOffering || selectedSeeking
                ? "border-blue-500 bg-blue-500/20"
                : "border-gray-600 hover:border-gray-400"
            }`}
          >
            Filters
          </button>

          <button
            onClick={() => setSortBy(sortBy === "match" ? "" : "match")}
            className={`px-5 py-2 rounded-full border transition ${
              sortBy === "match"
                ? "border-blue-500 bg-blue-500/20"
                : "border-gray-600 hover:border-gray-400"
            }`}
          >
            Best Match
          </button>

          <button
            onClick={() => setSortBy(sortBy === "active" ? "" : "active")}
            className={`px-5 py-2 rounded-full border transition ${
              sortBy === "active"
                ? "border-blue-500 bg-blue-500/20"
                : "border-gray-600 hover:border-gray-400"
            }`}
          >
            Recently Active
          </button>

          {(selectedOffering || selectedSeeking || sortBy) && (
            <button
              onClick={handleResetFilters}
              className="px-5 py-2 rounded-full border border-red-500 hover:bg-red-500/20 transition"
            >
              Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 p-6 bg-gray-800 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Filter by Languages</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  They're offering:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Spanish"
                  value={selectedOffering}
                  onChange={(e) => setSelectedOffering(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  They're seeking:
                </label>
                <input
                  type="text"
                  placeholder="e.g., English"
                  value={selectedSeeking}
                  onChange={(e) => setSelectedSeeking(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none text-white"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {partners.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-20">
          <p className="text-xl mb-2">No partners found</p>
          <p className="text-sm">Try adjusting your filters or check back later</p>
        </div>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {partners.map((p) => {
          const isRequestSent = requestSent.has(p.id);
          const isAlreadyFriend = friendIds.has(p.id);
          
          return (
            <div
              key={p.id}
              className="bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-750 transition shadow-lg"
            >
              <div className="relative w-full aspect-square bg-gray-700 overflow-hidden">
                <img
                  src={p.profile_image_url || "/default_profile.png"}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover"
                  alt={p.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/default_profile.png";
                  }}
                />

                {p.is_online && (
                  <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                )}
              </div>

              <div className="p-4 md:p-5">
                <h3 className="text-lg md:text-xl font-semibold mb-2">{p.name}</h3>

                <p className="text-sm text-gray-300 mb-1">
                  <span className="text-gray-400">Offering:</span>{" "}
                  {p.offering_language ?? "—"}
                </p>

                <p className="text-sm text-gray-300 mb-1">
                  <span className="text-gray-400">Seeking:</span>{" "}
                  {p.seeking_language ?? "—"}
                </p>

                <p className="text-sm text-gray-400 mb-3">
                  {p.location ?? "No location"}
                </p>

                <div className="mb-2">
                  {p.is_online ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-green-600">
                      Online
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-600">
                      {formatLastSeen(p.last_seen)}
                    </span>
                  )}
                </div>

                {p.interests && p.interests.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {p.interests.slice(0, 3).map((i, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 text-xs border border-gray-600 rounded-full"
                      >
                        {i}
                      </span>
                    ))}

                    {p.interests.length > 3 && (
                      <span className="px-2 py-1 text-xs border border-gray-600 rounded-full">
                        +{p.interests.length - 3}
                      </span>
                    )}
                  </div>
                )}

                <button
  onClick={() => handleAddFriend(p.id)}
  disabled={isRequestSent || isAlreadyFriend}
  className={`w-full px-4 py-2 rounded-lg transition ${
    isAlreadyFriend
      ? "bg-green-600 cursor-not-allowed"
      : isRequestSent
      ? "bg-gray-600 cursor-not-allowed"
      : "bg-blue-600 hover:bg-blue-500"
  }`}
>
  {isAlreadyFriend ? "Already Friends" : isRequestSent ? "Request Sent" : "Add Friend"}
</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Loading indicator during pagination */}
      {loading && partners.length > 0 && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#A3B496] mx-auto"></div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            disabled={page === 1 || loading}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-600 transition"
          >
            Prev
          </button>

          <span className="text-gray-300">
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages || loading}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-600 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DiscoverDashboard;