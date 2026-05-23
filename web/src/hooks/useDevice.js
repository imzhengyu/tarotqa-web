import { useState, useEffect } from 'react';

/**
 * Device types based on User Agent only
 */
export const DeviceType = {
  MOBILE: 'mobile',
  PAD: 'pad',
  DESKTOP: 'desktop'
};

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const uaLower = ua.toLowerCase();

  // iOS devices
  const isIOS = /iPhone|iPad|iPod/i.test(ua);

  // Android devices
  const isAndroid = /Android/i.test(ua);

  // Mobile keywords
  const mobileKeywords = ['android', 'iphone', 'mobile', 'windows phone', 'blackberry'];
  const isMobileKeyword = mobileKeywords.some(keyword => uaLower.includes(keyword));

  // Tablet detection - iPad or Android tablet
  const isTablet = uaLower.includes('ipad') ||
                   (uaLower.includes('android') && !uaLower.includes('mobile'));

  // Phone = mobile but not tablet
  const isPhone = isMobileKeyword && !isTablet;

  // Pad = iPad or Android tablet
  const isPad = isTablet;

  // Desktop = everything else
  const isDesktop = !isMobileKeyword && !isTablet;

  return {
    isMobile: isPhone,
    isPad,
    isDesktop,
    isIOS,
    isAndroid,
    deviceType: isPhone ? DeviceType.MOBILE : (isPad ? DeviceType.PAD : DeviceType.DESKTOP)
  };
};

export function useDevice() {
  const [device, setDevice] = useState(getDeviceInfo);

  useEffect(() => {
    // UA doesn't change during runtime, but we still call it for consistency
    setDevice(getDeviceInfo());
  }, []);

  return device;
}

export default useDevice;
