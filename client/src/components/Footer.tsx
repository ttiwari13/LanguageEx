import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-[#C4A574] text-black px-6 sm:px-12 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
          {/* Left - Location & Weather */}
          <div className="text-xs sm:text-sm space-y-1">
            <div className="font-mono">11:31:17AM</div>
            <div className="font-mono">LOS ANGELES, CA</div>
            <div className="font-mono">66° AND HAZE</div>
          </div>

          {/* Center - Newsletter */}
          <div className="flex-1 max-w-md">
            <p className="text-xs sm:text-sm mb-3 leading-relaxed">
              SUBSCRIBE TO OUR NEWSLETTER TO RECEIVE A<br />
              FIRST LOOK AT NEW EVENTS & GOODS
            </p>
            <div className="flex border-b border-black pb-1">
              <input
                type="email"
                placeholder="Your Email"
                className="flex-1 bg-transparent outline-none text-sm placeholder-black/60"
              />
              <button className="text-xs sm:text-sm font-medium hover:opacity-70 transition-opacity">
                SUBMIT
              </button>
            </div>
          </div>

          {/* Right - Links */}
          <div className="flex gap-8 sm:gap-12 text-xs sm:text-sm">
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
            <h1 className="text-[120px] sm:text-[180px] md:text-[240px] lg:text-[320px] font-bold leading-none tracking-tight">
              Usal
            </h1>
            <div className="absolute right-0 sm:right-12 top-0 sm:top-4 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-black flex items-center justify-center">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold">R</span>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
          <div className="font-mono">
            © 2024 USAL 3021 ROWENA AVE LOS ANGELES CA 90039
          </div>
          <div className="flex gap-4 sm:gap-6">
            <a href="#" className="hover:opacity-70 transition-opacity">PRIVACY POLICY</a>
            <span>•</span>
            <a href="#" className="hover:opacity-70 transition-opacity">TERMS OF SERVICE</a>
          </div>
          <a href="#" className="hover:opacity-70 transition-opacity underline">
            SITE CREDIT
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;