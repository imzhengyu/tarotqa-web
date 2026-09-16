import { useState } from 'react';

// 注：设备类型只按 UA 判定（见 git 历史 feat: refactor device detection to use UA），
// 不要在这里混用 window.innerWidth，否则布局与统计会给出互相矛盾的结论。

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
  const [device] = useState(getDeviceInfo);
  return device;
}

/**
 * 统计用的设备分类：与 useDevice 共用同一套 UA 判定，只把 'pad' 映射成 'tablet'。
 * 这样「页面布局按手机渲染」和「统计里算作手机」不会互相打架。
 */
export const detectDeviceType = () => {
  const { deviceType } = getDeviceInfo();
  return deviceType === DeviceType.PAD ? 'tablet' : deviceType;
};

export default useDevice;
