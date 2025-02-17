import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "flowbite-react";
import logo from "../images/logo.png";
import { Navigate, useLocation } from 'react-router-dom';
import Cookies from "js-cookie";

export default function Header() {
  const [showLogo, setShowLogo] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const text = "Unieventify";
  const typingSpeed = 400; // Speed of typing in milliseconds
  const location = useLocation();
  const token = Cookies.get("auth_token");

  useEffect(() => {
    // Show the logo for 1.5 seconds
    const logoTimer = setTimeout(() => {
      setShowLogo(false);
    }, 2000);

    // Typing effect starts after the logo is hidden
    const typingEffectTimer = setTimeout(() => {
      let index = 0;
      const typingInterval = setInterval(() => {
        setDisplayedText((prev) => {
          const nextText = text.substring(0, index + 1);
          index++;
          if (index > text.length) {
            clearInterval(typingInterval);
            setCursorVisible(false); // Hide cursor after typing
          }
          return nextText;
        });
      }, typingSpeed);

      return () => clearInterval(typingInterval);
    }, 1500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(typingEffectTimer);
    };
  }, []);

  return token
    ? <Navigate
      to="/auth/app/"
      replace
      state={{ from: location }} // pass current location to redirect back
    />
    : (
      <div className='flex flex-col'>
        <div>
          <Navbar fluid rounded>
            <Navbar.Brand href="/">
              <span className="self-center whitespace-nowrap text-2xl dark:text-white ml-10 mb-3 mt-3 flex items-center">
                {showLogo ? (
                  <img src={logo} alt="Logo" className="h-10 mr-2 animate-fadeIn" />
                ) : (
                  <span className="relative">
                    {displayedText}
                    {cursorVisible && (
                      <span className="absolute right-0 top-0 w-1 h-full bg-black animate-blink" />
                    )}
                  </span>
                )}
              </span>
            </Navbar.Brand>
            <Navbar.Toggle />
            <Navbar.Collapse >
              <Navbar.Link href="/" className='text-lg mb-3 mt-3 hover:border-b-sky-500 hover:border-b-2'>
                Home
              </Navbar.Link>
              <Navbar.Link href="/events" className='text-lg mb-3 mt-3 hover:border-b-sky-500 hover:border-b-2'>Events</Navbar.Link>
              <Navbar.Link href="/auth" className='text-lg mb-3 mt-3 hover:border-b-sky-500 hover:border-b-2'>Login/Register</Navbar.Link>
            </Navbar.Collapse>
          </Navbar>
        </div>
        <div id="detail">
          <Outlet />
        </div>
      </div>
    );
}
