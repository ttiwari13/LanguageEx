import React from 'react';
import LangPic from "../assets/lang.png";
import img1 from "../assets/img1.png"
import img2 from "../assets/img2.png"
import hg from "../assets/hg.png"
import InfiniteCarousel from '../components/InfiniteCarousel';
import Footer from '../components/Footer';
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-[#8B9D7C] min-h-[350px] sm:min-h-[400px] md:min-h-[460px] lg:min-h-[500px] flex flex-col justify-end items-center overflow-hidden px-4 pb-0">
        
        {/* Join Now button */}
        <div className="absolute top-3 right-3 sm:top-4 sm:right-6 z-20">
          <button className="bg-[#7A9B7E] hover:bg-[#6A8B6E] text-white text-[10px] sm:text-xs px-3 sm:px-4 py-1 sm:py-1.5 rounded-full transition-colors shadow-md">
            Join Now
          </button>
        </div>

        {/* CONNECT text */}
        <div className="absolute top-8 sm:top-12 md:top-16 lg:top-20 left-3 sm:left-6 md:left-10 lg:left-12 z-10">
          <div className="text-base sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 tracking-wide">
            CONNECT
          </div>
        </div>

        {/* LEARN text */}
        <div className="absolute top-1/2 -translate-y-1/2 left-3 sm:left-6 md:left-10 lg:left-12 z-10">
          <div className="text-base sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 tracking-wide">
            LEARN
          </div>
        </div>

        {/* SPEAK text */}
        <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-6 md:right-10 lg:right-12 z-10">
          <div className="text-base sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 tracking-wide">
            SPEAK
          </div>
        </div>

        {/* Main image (flush to bottom) */}
        <div className="flex justify-center items-end w-full max-w-[240px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[500px] xl:max-w-[550px]">
          <img
            src={LangPic}
            alt="lang"
            className="w-full h-auto object-contain block"
          />
        </div>
      </div>
       <div className="flex images-container">
      <div className="image-wrapper left-extreme">
        <img src={img1} alt="Left Extreme Style" />
      </div>
      <div className="image-wrapper right-extreme">
        <img src={img2} alt="Right Extreme Style" />
      </div>
    </div>
    <div className="bg-[#8B9D7C] px-4 sm:px-8 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          <div className="relative flex items-center justify-center">
            {/* Left side - First 3 steps */}
            <div className="flex flex-col items-start gap-2 pr-4 sm:pr-8">
              <div className="bg-[#B5C4A8] text-gray-700 px-5 py-2 rounded-full text-xs sm:text-sm shadow-sm">
                Step 1: Choose the language you want to learn.
              </div>
              <div className="bg-[#A3B496] text-gray-700 px-5 py-2 rounded-full text-xs sm:text-sm shadow-sm">
                Step 2: Select the language you can offer to teach others.
              </div>
              <div className="bg-[#8FA584] text-gray-800 px-5 py-2 rounded-full text-xs sm:text-sm shadow-sm">
                Step 3: Get matched instantly with a partner who complements your skills.
              </div>
            </div>

            {/* Center - Conversation image */}
            <div className="flex-shrink-0 mx-2 sm:mx-4">
              <img src={hg} alt="Language conversation" className="w-[200px] sm:w-[250px] md:w-[300px] h-auto" />
            </div>

            {/* Right side - Last 2 steps */}
            <div className="flex flex-col items-start gap-2 pl-4 sm:pl-8">
              <div className="bg-[#7A8B6E] text-gray-100 px-5 py-2 rounded-full text-xs sm:text-sm shadow-sm">
                Step 4: Start chatting or calling to practice languages in real-time.
              </div>
              <div className="bg-[#65795B] text-gray-100 px-5 py-2 rounded-full text-xs sm:text-sm shadow-sm">
                Step 5: Track your progress and build global friendships!
              </div>
            </div>
          </div>
        </div>
      </div> 
      <InfiniteCarousel/>
      <Footer/>
    </div>
  );
};

export default LandingPage;