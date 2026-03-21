import { useState, useEffect } from 'react';

function ScrollIndicator() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setShow(scrollTop > 100 && docHeight > window.innerHeight);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!show) return null;

  return <div className="scroll-indicator" />;
}

export default ScrollIndicator;