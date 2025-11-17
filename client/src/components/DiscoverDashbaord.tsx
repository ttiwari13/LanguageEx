
const DiscoverDashboard = () => {
  const partners = [
    {
      id: 1,
      name: "Sophia",
      age: 28,
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      offering: "Spanish (Native)",
      offeringFlag: "🇪🇸",
      learning: "Intermediate",
      learningFlag: "🇰🇷",
      location: "Based in Tokyo • 7 hrs ahead",
      locationFlag: "🇯🇵",
      interests: ["Travel", "Travel", "Cooking", "Photography"],
      featured: true
    },
    {
      id: 2,
      name: "Raj",
      age: 30,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      offering: "Spanish",
      offeringFlag: "🇪🇸",
      learning: "Korean (Intermediate)",
      learningArrows: ">> >>",
      location: "Based in Tokyo • 7 hrs ahead",
      locationFlag: "🇮🇹"
    },
    {
      id: 3,
      name: "Raj",
      age: 30,
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
      offering: "Spanish (Native)",
      offeringFlag: "🇪🇸",
      learning: "Korean (Intermediate)",
      learningArrows: "<<",
      commonInterests: true
    },
    {
      id: 4,
      name: "Lena",
      age: 25,
      image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop",
      offering: "Learning: Spanish",
      learning: "Korean (Intermediate)",
      learningArrows: ">>",
      learningFlag: "🇰🇷",
      location: "Based in Tokyo • 7 hrs ahead",
      locationFlag: "🇮🇹",
      time: "Remote first • 23 hrs behind"
    },
    {
      id: 5,
      name: "Chien",
      age: 32,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
      offering: "Offering: Spanish",
      offeringFlag: "🇪🇸",
      learning: "Korean Korean (Intermediate)",
      learningArrows: ">>",
      commonInterests: true
    },
    {
      id: 6,
      name: "Raj",
      age: 30,
      image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop"
    },
    {
      id: 7,
      name: "Lena",
      age: 25,
      image: "https://images.unsplash.com/photo-1497551060073-4c5ab6435f12?w=400&h=400&fit=crop"
    },
    {
      id: 8,
      name: "Chien",
      age: 32,
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop"
    },
    {
      id: 9,
      name: "Oleg",
      age: 32,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-6">Discover Partners</h1>
        
        {/* Filter Buttons */}
        <div className="flex gap-3">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className={`bg-gray-800 rounded-2xl overflow-hidden hover:bg-gray-750 transition ${
              partner.featured ? 'md:col-span-2 lg:col-span-1' : ''
            }`}
          >
            {/* Image */}
            <div className={`${partner.featured ? 'h-80' : 'h-64'} overflow-hidden`}>
              <img
                src={partner.image}
                alt={partner.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-5">
              <h3 className="text-xl font-semibold mb-3">
                {partner.name}, {partner.age}
              </h3>

              {/* Details */}
              {partner.offering && (
                <div className="mb-2 text-sm text-gray-300">
                  <span className="text-gray-400">Offering:</span> {partner.offering} {partner.offeringFlag}
                </div>
              )}

              {partner.learning && (
                <div className="mb-2 text-sm text-gray-300 flex items-center gap-2">
                  <span className="text-gray-400">Learning:</span> {partner.learning}
                  {partner.learningArrows && (
                    <span className="text-gray-500">{partner.learningArrows}</span>
                  )}
                  {partner.learningFlag && <span>{partner.learningFlag}</span>}
                </div>
              )}

              {partner.location && (
                <div className="mb-3 text-sm text-gray-400 flex items-center gap-1">
                  <span>{partner.location}</span>
                  {partner.locationFlag && <span>{partner.locationFlag}</span>}
                </div>
              )}

              {partner.time && (
                <div className="mb-3 text-sm text-gray-400">
                  {partner.time}
                </div>
              )}

              {partner.commonInterests && (
                <div className="mb-3 text-sm text-gray-400">
                  Common Interests
                </div>
              )}

              {/* Interests Tags */}
              {partner.interests && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {partner.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full border border-gray-600 text-sm"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}

              {/* Say Hello Button - Only for featured */}
              {partner.featured && (
                <button className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-full transition flex items-center justify-center gap-2">
                  Say Hello 
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DiscoverDashboard;