import React from 'react';

const InfiniteCarousel = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Chen",
      language: "🇺🇸 → 🇪🇸",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
      text: "Amazing app! My Spanish improved in just 3 months!"
    },
    {
      id: 2,
      name: "Kenji Tanaka",
      language: "🇯🇵 → 🇫🇷",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kenji",
      text: "Found a perfect language partner who shares my interests!"
    },
    {
      id: 3,
      name: "Maria Rodriguez",
      language: "🇪🇸 → 🇩🇪",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      text: "Made friends across the globe while learning German!"
    },
    {
      id: 4,
      name: "Ahmed Hassan",
      language: "🇪🇬 → 🇬🇧",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed",
      text: "This platform gave me confidence to speak English!"
    },
    {
      id: 5,
      name: "Emma Wilson",
      language: "🇬🇧 → 🇰🇷",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
      text: "Best language learning experience ever! Love it!"
    },
    {
      id: 6,
      name: "Lucas Silva",
      language: "🇧🇷 → 🇮🇹",
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas",
      text: "Learning Italian through real conversations is incredible!"
    }
  ];

  // Duplicate the array for seamless infinite scroll
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  return (
    <div className="w-full py-12 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 text-gray-800">
        Loved by Language Learners Worldwide
      </h2>
      <p className="text-center text-gray-600 mb-10">
        Join thousands of users connecting and learning together
      </p>

      {/* Infinite Scrolling Container */}
      <div className="relative">
        <style>{`
          @keyframes scroll {
            0% {
              transform: translateX(0);
            }
            100% {
              transform: translateX(-50%);
            }
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>

        {/* Gradient Overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>

        {/* Scrolling Content */}
        <div className="flex animate-scroll">
          {duplicatedTestimonials.map((testimonial, index) => (
            <div
              key={`${testimonial.id}-${index}`}
              className="flex-shrink-0 w-80 mx-4"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 h-full">
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-14 h-14 rounded-full border-3 border-[#8B9D7C]"
                  />
                  <div className="ml-3">
                    <h3 className="font-bold text-gray-800">{testimonial.name}</h3>
                    <p className="text-sm text-[#8B9D7C] font-medium">{testimonial.language}</p>
                  </div>
                </div>
                
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>

                <p className="text-gray-700 text-sm leading-relaxed italic">
                  "{testimonial.text}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-12 flex flex-wrap justify-center gap-8 px-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-[#8B9D7C]">50K+</div>
          <div className="text-gray-600 mt-1">Active Users</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-[#8B9D7C]">120+</div>
          <div className="text-gray-600 mt-1">Countries</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-[#8B9D7C]">25+</div>
          <div className="text-gray-600 mt-1">Languages</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-[#8B9D7C]">1M+</div>
          <div className="text-gray-600 mt-1">Conversations</div>
        </div>
      </div>
    </div>
  );
};

export default InfiniteCarousel;