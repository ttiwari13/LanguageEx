import { useEffect, useState } from "react";
import axios from "axios";

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
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [limit] = useState<number>(12);
  
  // Filter states
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedOffering, setSelectedOffering] = useState<string>("");
  const [selectedSeeking, setSelectedSeeking] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>(""); // "match" or "active"

  const fetchDiscover = async (pageNumber: number = 1) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        return;
      }

      // Build query params
      let url = `http://localhost:4000/api/discover?page=${pageNumber}&limit=${limit}`;
      
      if (selectedOffering) {
        url += `&offering_language=${encodeURIComponent(selectedOffering)}`;
      }
      if (selectedSeeking) {
        url += `&seeking_language=${encodeURIComponent(selectedSeeking)}`;
      }
      if (sortBy === "match") {
        url += `&sort=match`;
      }
      if (sortBy === "active") {
        url += `&sort=recent`;
      }

      const res = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setPartners(res.data.users);
      setTotalPages(res.data.pagination.totalPages);
      setPage(res.data.pagination.currentPage);

    } catch (err) {
      console.error("DISCOVER FETCH ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscover(page);
  }, [page, selectedOffering, selectedSeeking, sortBy]);

  const handleAddFriend = async (receiver_id: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("Please login first!");

      await axios.post(
        "http://localhost:4000/api/friends/send",
        { receiver_id },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert("Friend request sent!");
    } catch (err) {
      console.error("Add Friend Error:", err);
      alert("Something went wrong!");
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
    
    try {
      const date = new Date(lastSeen);
      
      // Check if date is valid
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
    } catch (error) {
      console.error("Error formatting last seen:", error);
      return "Offline";
    }
  };

  if (loading) {
    return (
      <div className="text-center text-white mt-20 text-2xl">
        Loading Discover...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      
      {/* Header */}
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
            Filters {(selectedOffering || selectedSeeking) && "✓"}
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

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-6 bg-gray-800 rounded-xl border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Filter by Languages</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  They're offering (I want to learn):
                </label>
                <input
                  type="text"
                  placeholder="e.g., Spanish, French, Japanese"
                  value={selectedOffering}
                  onChange={(e) => {
                    setSelectedOffering(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  They're seeking (I can teach):
                </label>
                <input
                  type="text"
                  placeholder="e.g., English, German, Mandarin"
                  value={selectedSeeking}
                  onChange={(e) => {
                    setSelectedSeeking(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Tip: Enter language names to find partners who can help you learn what you want
            </p>
          </div>
        )}
      </div>

      {/* No Results */}
      {partners.length === 0 && (
        <div className="text-center text-gray-400 py-20">
          <p className="text-xl mb-2">No partners found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      )}

      {/* Partners Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {partners.map((p) => (
          <div
            key={p.id}
            className="bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-750 transition shadow-lg"
          >
            {/* Image Container - Fixed aspect ratio */}
            <div className="relative w-full aspect-square overflow-hidden bg-gray-700">
              <img
                src={p.profile_image_url || "/default_profile.png"}
                alt={p.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/default_profile.png";
                }}
              />
              {/* Online indicator badge */}
              {p.is_online && (
                <div className="absolute top-3 right-3 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
              )}
            </div>

            <div className="p-4 md:p-5">
              <h3 className="text-lg md:text-xl font-semibold mb-3 truncate">{p.name}</h3>

              <div className="mb-2 text-sm text-gray-300">
                <span className="text-gray-400">Offering:</span>{" "}
                {p.offering_language ?? "—"}
              </div>

              <div className="mb-2 text-sm text-gray-300">
                <span className="text-gray-400">Seeking:</span>{" "}
                {p.seeking_language ?? "—"}
              </div>

              <div className="mb-3 text-sm text-gray-400 truncate">
                📍 {p.location ?? "No location"}
              </div>

              {/* Online / Offline Status */}
              <div className="mb-3">
                {p.is_online ? (
                  <span className="text-xs px-3 py-1 rounded-full inline-block bg-green-600">
                    Online
                  </span>
                ) : p.last_seen ? (
                  <span className="text-xs px-3 py-1 rounded-full inline-block bg-gray-600 text-gray-300">
                    {formatLastSeen(p.last_seen)}
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full inline-block bg-gray-600 text-gray-400">
                    Offline
                  </span>
                )}
              </div>

              {/* Interests */}
              {p.interests && p.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {p.interests.slice(0, 3).map((i, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 rounded-full border border-gray-600 text-xs"
                    >
                      {i}
                    </span>
                  ))}
                  {p.interests.length > 3 && (
                    <span className="px-2 py-1 rounded-full border border-gray-600 text-xs">
                      +{p.interests.length - 3}
                    </span>
                  )}
                </div>
              )}
              
              <button
                className="mt-2 w-full bg-blue-600 hover:bg-blue-500 transition px-4 py-2 rounded-lg text-center text-sm md:text-base"
                onClick={() => handleAddFriend(p.id)}
              >
                Add Friend
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600 transition"
          >
            Prev
          </button>

          <span className="text-base md:text-lg">
            Page {page} / {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-40 hover:bg-gray-600 transition"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default DiscoverDashboard;