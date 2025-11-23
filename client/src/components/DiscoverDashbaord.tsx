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

  const fetchDiscover = async (pageNumber: number = 1) => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found");
        return;
      }

      const res = await axios.get(
        `http://localhost:4000/api/discover?page=${pageNumber}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setPartners(res.data.users);
      console.log("Users data:", res.data.users); 
      console.log("First user profile_image_url:", res.data.users[0]?.profile_image_url);
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
  }, [page]);

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
          <button className="px-5 py-2 rounded-full border border-gray-600 hover:border-gray-400 transition">
            Filters
          </button>
          <button className="px-5 py-2 rounded-full border border-gray-600 hover:border-gray-400 transition">
            Best Match
          </button>
          <button className="px-5 py-2 rounded-full border border-gray-600 hover:border-gray-400 transition">
            Recently Active
          </button>
        </div>
      </div>

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
                {p.location ?? "No location added"}
              </div>

              {/* Online / Offline Badge */}
              <div
                className={`text-xs px-3 py-1 rounded-full inline-block mb-3 ${
                  p.is_online ? "bg-green-600" : "bg-gray-600"
                }`}
              >
                {p.is_online
                  ? "Online"
                  : `Last seen: ${p.last_seen?.slice(0, 16)}`}
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

    </div>
  );
};

export default DiscoverDashboard;