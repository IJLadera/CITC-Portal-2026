import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "flowbite-react";
import logo from "../images/logo.png";
import { Navigate, useLocation } from 'react-router-dom';
import Cookies from "js-cookie";
import { useAppDispatch, useAppSelector } from "../../../../../../hooks";
import { fetchCurrentUser, fetchUserRole } from "../Application/slice";

export default function Header() {
  const [showLogo, setShowLogo] = useState(true);
  const [displayedText, setDisplayedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const text = "Unieventify";
  const typingSpeed = 400; // Speed of typing in milliseconds
  const location = useLocation();
  const token = Cookies.get("auth_token");

  const dispatch = useAppDispatch()

  const user = useAppSelector((state) => state.unieventify.user)
  const highestRankRole = useAppSelector((state) => state.unieventify.userRole)

  // if(!token){
  //   return <Navigate to="/login" />;
  // }

  useEffect(() => {
    dispatch(fetchCurrentUser())
    dispatch(fetchUserRole())
  }, [])

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

  const notAlumni = ["Dean", "Chairperson", "Admin", "Faculty", "Student", "Unit Org", "Mother Org" ];

  return token
    ? <Navigate
      to="unieventify/"
      replace
      state={{ from: location }} // pass current location to redirect back
    />
    : (
      <div className='flex flex-col col-span-3'>
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
              <Navbar.Link href="/unieventify" className='text-lg mb-3 mt-3 hover:border-b-sky-500 hover:border-b-2'>
                Home
              </Navbar.Link>
              <Navbar.Link href="/unieventify/events" className='text-lg mb-3 mt-3 hover:border-b-sky-500 hover:border-b-2'>Public Events</Navbar.Link>
              {highestRankRole && notAlumni.includes(highestRankRole.name || '') && (
              <Navbar.Link href="/unieventify/app" className='text-lg mb-3 mt-3 hover:border-b-sky-500 hover:border-b-2'>Calendar/Events</Navbar.Link>
            )}
            </Navbar.Collapse>
          </Navbar>
        </div>
        <div id="detail">
          <Outlet />
        </div>
      </div>
    );
}
