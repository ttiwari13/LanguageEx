import { useState, useEffect } from 'react';

const Footer = () => {
  // State for real-time clock
  const [currentTime, setCurrentTime] = useState('');

  // Placeholder weather data for New Delhi (since we cannot fetch live data)
  const DELHI_TIMEZONE = 'Asia/Kolkata';
  const DELHI_LOCATION = 'NEW DELHI, INDIA';
  const DELHI_WEATHER = '21°C AND CLEAR SKIES';

  // Effect to update the clock every second
  useEffect(() => {
    const updateTime = () => {
      // Format time for New Delhi in 12-hour format with AM/PM
      const now = new Date();
      const formattedTime = now.toLocaleTimeString('en-US', {
        timeZone: DELHI_TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).toUpperCase();
      setCurrentTime(formattedTime);
    };

    // Initial call
    updateTime();

    // Set up interval for continuous updates
    const timerId = setInterval(updateTime, 1000);

    // Cleanup function to clear the interval when the component unmounts
    return () => clearInterval(timerId);
  }, []);

  return (
    // Updated background color to-[#7A9B7E]
    <footer className="bg-[#7A9B7E] text-black px-6 sm:px-12 py-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          
          {/* Left - Real-time Clock & Location */}
          <div className="text-xs sm:text-sm space-y-1">
            <div className="font-mono font-bold text-gray-900">{currentTime}</div> {/* Live Time */}
            <div className="font-mono">{DELHI_LOCATION}</div> {/* Updated Location */}
            <div className="font-mono">{DELHI_WEATHER}</div> {/* Updated Weather */}
          </div>

          {/* Center - Newsletter */}
          <div className="flex-1 max-w-md">
            <p className="text-xs sm:text-sm mb-3 leading-relaxed tracking-wide font-medium">
              SUBSCRIBE TO OUR NEWSLETTER TO RECEIVE A<br />
              FIRST LOOK AT NEW EVENTS & GOODS
            </p>
            <div className="flex border-b border-black pb-1">
              <input
                type="email"
                placeholder="Your Email"
                className="flex-1 bg-transparent outline-none text-sm placeholder-black/60 focus:placeholder-transparent"
              />
              <button className="text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity uppercase tracking-wider">
                SUBMIT
              </button>
            </div>
          </div>

          {/* Right - Links */}
          <div className="flex gap-8 sm:gap-12 text-xs sm:text-sm tracking-widest font-medium uppercase">
            <div className="space-y-2">
              <a href="#" className="block hover:opacity-70 transition-opacity">EVENTS</a>
              <a href="#" className="block hover:opacity-70 transition-opacity">SHOP</a>
              <a href="#" className="block hover:opacity-70 transition-opacity">CONNECT</a>
            </div>
            <div className="space-y-2">
              <a href="#" className="block hover:opacity-70 transition-opacity">AGENCY</a>
              <a href="#" className="block hover:opacity-70 transition-opacity">ORC</a>
              <a href="#" className="block hover:opacity-70 transition-opacity">INSTAGRAM</a>
            </div>
          </div>
        </div>

        {/* Large Brand Text */}
        <div className="relative mb-8">
          <div className="flex items-center justify-center">
            {/* Adjusted font sizing for better responsiveness and visibility */}
            <h1 className="text-[70px] sm:text-[120px] md:text-[180px] lg:text-[230px] xl:text-[290px] font-extrabold leading-none tracking-tight">
              VOXY
            </h1>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-[10px] sm:text-xs tracking-wider uppercase">
          <div className="font-mono">
            © 2025 VOXY MATCH. CHAT. SPEAK. LEARN
          </div>
          <div className="flex gap-4 sm:gap-6 font-medium">
            <a href="#" className="hover:opacity-70 transition-opacity">PRIVACY POLICY</a>
            <span>•</span>
            <a href="#" className="hover:opacity-70 transition-opacity">TERMS OF SERVICE</a>
          </div>
          <a href="#" className="hover:opacity-70 transition-opacity underline font-medium">
            SITE CREDIT
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
