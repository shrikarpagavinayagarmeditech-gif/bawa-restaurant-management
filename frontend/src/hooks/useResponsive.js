import { useEffect, useState } from "react";

const getScreenType = () => {
  const width = window.innerWidth;

  if (width < 768) {
    return "mobile";
  }

  if (width <= 1024) {
    return "tablet";
  }

  return "desktop";
};

export const useResponsive = () => {
  const [screenType, setScreenType] = useState(getScreenType);

  useEffect(() => {
    const handleResize = () => {
      setScreenType(getScreenType());
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    screenType,

    isMobile: screenType === "mobile",
    isTablet: screenType === "tablet",
    isDesktop: screenType === "desktop",
  };
};