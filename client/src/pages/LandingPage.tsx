import { useState } from "react";
import LangPic from "../assets/lang.png";
import img1 from "../assets/img1.png";
import img2 from "../assets/img2.png";
import hg from "../assets/hg.png";
import InfiniteCarousel from "../components/InfiniteCarousel";
import SignupModal from "./SignupModal";
import LoginModal from "./LoginModal";
import Footer from "../components/Footer";

const LandingPage = () => {
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
   const handleOpenSignup = () => {
    setIsLoginOpen(false);
    setIsSignupOpen(true);
  };

  const handleOpenLogin = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(true);
  };

  const handleCloseModals = () => {
    setIsSignupOpen(false);
    setIsLoginOpen(false);
  };
  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        {/* Decorative Background Doodles */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 z-0">
          <div className="absolute top-10 left-10 w-8 h-8 border-4 border-yellow-400 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-6 h-6 bg-pink-400 rounded-full animate-bounce"></div>
          <div className="absolute bottom-40 left-16 w-10 h-10 border-4 border-purple-400 rotate-45"></div>
          <div className="absolute top-1/3 right-10 w-7 h-7 bg-blue-400 rounded-full"></div>
          <div className="absolute bottom-20 right-32 w-12 h-12 border-4 border-green-300 rounded-full"></div>
          <svg className="absolute top-1/2 left-1/4 w-20 h-20 text-purple-300" viewBox="0 0 100 100">
            <path d="M10,50 Q30,10 50,50 T90,50" stroke="currentColor" strokeWidth="4" fill="none" />
          </svg>
        </div>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-[#8B9D7C] via-[#9BAE8C] to-[#8B9D7C] flex flex-col justify-end items-center overflow-hidden px-4 pb-0 min-h-[360px] sm:min-h-[420px] md:min-h-[500px] lg:min-h-[600px]">
          {/* Floating Doodles in Hero */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-[10%] w-12 h-12 sm:w-16 sm:h-16 border-4 border-white/30 rounded-full animate-bounce"></div>
            <div className="absolute top-32 right-[15%] w-8 h-8 sm:w-12 sm:h-12 border-4 border-yellow-300/40 rotate-45"></div>
            <div className="absolute bottom-40 left-[20%] w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full"></div>
            <div className="absolute top-1/2 right-[10%] w-6 h-16 sm:h-20 border-l-4 border-white/30 rotate-12"></div>
            <svg className="absolute bottom-1/3 right-[25%] w-16 h-16 text-white/20" viewBox="0 0 100 100">
              <path d="M20,80 Q40,20 60,80 T100,80" stroke="currentColor" strokeWidth="5" fill="none" />
            </svg>
          </div>

          {/* Join Now Button - Connected to Modal */}
          <div className="absolute top-3 right-3 sm:top-5 sm:right-6 z-20">
            <button 
              onClick={() => setIsSignupOpen(true)}
              className="bg-white/90 hover:bg-white text-[#7A9B7E] text-[10px] sm:text-xs md:text-sm font-semibold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full transition-all shadow-lg hover:shadow-xl hover:scale-105 border-2 border-[#7A9B7E]/20"
            >
              Join Now 
            </button>
          </div>

          {/* CONNECT with doodle */}
          <div className="absolute top-10 sm:top-16 md:top-20 left-4 sm:left-8 md:left-12 z-10">
            <div className="relative">
              <div className="text-lg sm:text-2xl md:text-4xl font-bold text-gray-900 tracking-wide">
                CONNECT
              </div>
              <div className="absolute -bottom-2 -right-6 w-8 h-1 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
          
          {/* LEARN with doodle */}
          <div className="absolute bottom-[35%] sm:bottom-[40%] left-4 sm:left-8 md:left-12 z-10">
            <div className="relative">
              <div className="text-lg sm:text-2xl md:text-4xl font-bold text-gray-900 tracking-wide">
                LEARN
              </div>
              <div className="absolute -top-3 -left-4 w-6 h-6 border-4 border-pink-400 rounded-full"></div>
            </div>
          </div>
          
          {/* SPEAK with doodle */}
          <div className="absolute bottom-[35%] sm:bottom-[40%] right-4 sm:right-8 md:right-12 z-10">
            <div className="relative">
              <div className="text-lg sm:text-2xl md:text-4xl font-bold text-gray-900 tracking-wide">
                SPEAK
              </div>
              <div className="absolute -bottom-3 -right-6 w-10 h-2 bg-blue-400 rounded-full transform rotate-12"></div>
            </div>
          </div>

          {/* Main Image */}
          <div className="relative flex justify-center items-end w-full max-w-[220px] sm:max-w-[320px] md:max-w-[450px] lg:max-w-[520px] xl:max-w-[600px] z-10">
            <img
              src={LangPic}
              alt="lang"
              className="w-full h-auto object-contain drop-shadow-2xl"
            />
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-300/40 rounded-full"></div>
            <div className="absolute bottom-10 -left-4 w-6 h-6 bg-pink-300/40 rounded-full"></div>
          </div>
        </div>

        {/* Decorative Images */}
        <div className="relative flex justify-between items-center px-4 py-6 sm:py-10 md:py-12">
          <div className="w-1/2 sm:w-1/3 md:w-1/4 px-2">
            <div className="relative group">
              <img
                src={img1}
                alt="Left illustration"
                className="w-full h-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -top-3 -right-3 w-6 h-6 sm:w-8 sm:h-8 border-4 border-yellow-400 rounded-full"></div>
            </div>
          </div>
          
          <div className="w-1/2 sm:w-1/3 md:w-1/4 px-2">
            <div className="relative group">
              <img
                src={img2}
                alt="Right illustration"
                className="w-full h-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -bottom-3 -left-3 w-8 h-2 sm:w-10 sm:h-2 bg-pink-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Steps Section */}
        <div className="relative bg-gradient-to-br from-[#8B9D7C] via-[#9BAE8C] to-[#8B9D7C] px-4 sm:px-6 md:px-10 py-10 md:py-16">
          {/* Background Doodles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
            <div className="absolute top-10 left-10 w-16 h-16 sm:w-20 sm:h-20 border-8 border-white rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-24 h-24 sm:w-32 sm:h-32 border-8 border-white rotate-45"></div>
            <svg className="absolute top-1/2 left-1/4 w-20 h-20 sm:w-24 sm:h-24 text-white" viewBox="0 0 100 100">
              <path d="M10,50 Q30,10 50,50 T90,50" stroke="currentColor" strokeWidth="6" fill="none" />
            </svg>
          </div>

          {/* Mobile/Tablet: Image on top, steps below */}
          <div className="md:hidden space-y-6 max-w-2xl mx-auto">
            <div className="flex justify-center">
              <div className="relative">
                <img
                  src={hg}
                  alt="Language conversation"
                  className="w-[180px] sm:w-[220px] h-auto object-contain drop-shadow-2xl"
                />
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-300/60 rounded-full animate-pulse"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-pink-300/60 rounded-full animate-bounce"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <div className="bg-gradient-to-r from-[#B5C4A8] to-[#A3B496] text-gray-700 px-6 py-3 rounded-full text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-white/30 rounded-full flex items-center justify-center font-bold text-sm">1</span>
                  <span className="font-medium">Choose the language you want to learn.</span>
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-r from-[#A3B496] to-[#8FA584] text-gray-700 px-6 py-3 rounded-full text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-white/30 rounded-full flex items-center justify-center font-bold text-sm">2</span>
                  <span className="font-medium">Select the language you can offer to teach others.</span>
                </div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-r from-[#8FA584] to-[#7A8B6E] text-gray-800 px-6 py-3 rounded-full text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-white/30 rounded-full flex items-center justify-center font-bold text-sm">3</span>
                  <span className="font-medium">Get matched instantly with a partner who complements your skills.</span>
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-r from-[#7A8B6E] to-[#65795B] text-gray-100 px-6 py-3 rounded-full text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-white/30 rounded-full flex items-center justify-center font-bold text-sm">4</span>
                  <span className="font-medium">Start chatting or calling to practice languages in real-time.</span>
                </div>
              </div>

              <div className="relative group">
                <div className="bg-gradient-to-r from-[#65795B] to-[#556B4B] text-gray-100 px-6 py-3 rounded-full text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 bg-white/30 rounded-full flex items-center justify-center font-bold text-sm">5</span>
                  <span className="font-medium">Track your progress and build global friendships!</span>
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </div>

          {/* Desktop: Horizontal Layout */}
          <div className="hidden md:flex max-w-6xl mx-auto items-center justify-center gap-8 lg:gap-12">
            {/* Left steps */}
            <div className="flex flex-col items-end gap-4 w-1/3">
              <div className="relative group w-full">
                <div className="bg-gradient-to-r from-[#B5C4A8] to-[#A3B496] text-gray-700 px-6 py-3 rounded-full text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">1</span>
                  <span className="font-medium">Choose the language you want to learn.</span>
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>

              <div className="relative group w-full">
                <div className="bg-gradient-to-r from-[#A3B496] to-[#8FA584] text-gray-700 px-6 py-3 rounded-full text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">2</span>
                  <span className="font-medium">Select the language you can offer to teach others.</span>
                </div>
              </div>

              <div className="relative group w-full">
                <div className="bg-gradient-to-r from-[#8FA584] to-[#7A8B6E] text-gray-800 px-6 py-3 rounded-full text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">3</span>
                  <span className="font-medium">Get matched instantly with a partner who complements your skills.</span>
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>

            {/* Middle image */}
            <div className="flex-shrink-0 relative">
              <img
                src={hg}
                alt="Language conversation"
                className="w-[250px] lg:w-[300px] h-auto object-contain drop-shadow-2xl"
              />
              <div className="absolute -top-4 -right-4 w-10 h-10 bg-yellow-300/60 rounded-full animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-pink-300/60 rounded-full animate-bounce"></div>
              <div className="absolute top-1/2 -left-6 w-6 h-6 bg-blue-300/60 rounded-full"></div>
              <div className="absolute top-1/4 -right-6 w-6 h-6 border-4 border-purple-300/60 rounded-full"></div>
            </div>

            {/* Right steps */}
            <div className="flex flex-col items-start gap-4 w-1/3">
              <div className="relative group w-full">
                <div className="bg-gradient-to-r from-[#7A8B6E] to-[#65795B] text-gray-100 px-6 py-3 rounded-full text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">4</span>
                  <span className="font-medium">Start chatting or calling to practice languages in real-time.</span>
                </div>
              </div>

              <div className="relative group w-full">
                <div className="bg-gradient-to-r from-[#65795B] to-[#556B4B] text-gray-100 px-6 py-3 rounded-full text-sm shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold">5</span>
                  <span className="font-medium">Track your progress and build global friendships!</span>
                </div>
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel + Footer */}
        <InfiniteCarousel />
        <Footer />
      </div>

      {/* Signup Modal */}
      <SignupModal 
        isOpen={isSignupOpen} 
        onClose={handleCloseModals}
        onLoginClick={handleOpenLogin}  // THIS IS THE KEY FIX!
      />
      
      <LoginModal 
        isOpen={isLoginOpen}
        onClose={handleCloseModals}
        onSignupClick={handleOpenSignup}
      />
      </>
  );
};

export default LandingPage;