import { useState, useEffect } from 'react';

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const width = window.innerWidth;

  return {
    isMobile,
    isIOS,
    isAndroid,
    isTablet: isMobile && width >= 768,
    isPhone: isMobile && width < 768,
    isDesktop: !isMobile,
    width,
    height: window.innerHeight
  };
};

export function useDevice() {
  const [device, setDevice] = useState(getDeviceInfo);

  useEffect(() => {
    const handleResize = () => {
      setDevice(getDeviceInfo());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return device;
}

export default useDevice;