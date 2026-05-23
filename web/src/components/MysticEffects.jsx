import { useEffect, useRef, useState, useCallback } from 'react';

export function MysticEffects() {
  const [particles, setParticles] = useState([]);
  const [poofParticles, setPoofParticles] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const containerRef = useRef(null);
  const lastParticleTime = useRef(0);

  // 处理鼠标移动产生的星尘
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });

      const now = Date.now();
      if (now - lastParticleTime.current > 30) {
        lastParticleTime.current = now;

        const newParticle = {
          id: `${now}-${Math.random()}`,
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 3 + 2
        };

        setParticles(prev => [...prev.slice(-20), newParticle]);

        setTimeout(() => {
          setParticles(prev => prev.filter(p => p.id !== newParticle.id));
        }, 1000);
      }
    };

    // 处理按钮点击的 poof 动画
    const handleButtonClick = (e) => {
      const button = e.target.closest('.btn');
      if (button && !button.classList.contains('btn-poof')) {
        const rect = button.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        window.dispatchEvent(new CustomEvent('poof', { detail: { x, y } }));

        button.classList.remove('btn-poof');
        void button.offsetWidth;
        button.classList.add('btn-poof');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleButtonClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleButtonClick);
    };
  }, []);

  // 处理 poof 点击爆炸效果 - 优雅的光芒扩散效果
  const handlePoofEvent = useCallback((e) => {
    const { x, y } = e.detail;
    const newPoofParticles = [];
    const particleCount = 8;

    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 15 + Math.random() * 10;
      newPoofParticles.push({
        id: `${Date.now()}-${i}-${Math.random()}`,
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 8 + Math.random() * 8,
        life: 1
      });
    }

    setPoofParticles(prev => [...prev, ...newPoofParticles]);

    // 动画更新
    const startTime = Date.now();
    const duration = 1200;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress < 1) {
        setPoofParticles(prev =>
          prev.map(p => {
            const particle = newPoofParticles.find(np => np.id === p.id);
            if (!particle) return p;
            return {
              ...p,
              x: p.x + p.vx * 0.01,
              y: p.y + p.vy * 0.01,
              life: 1 - progress,
              size: p.size * (1 - progress * 0.3)
            };
          })
        );
        requestAnimationFrame(animate);
      } else {
        setPoofParticles(prev =>
          prev.filter(p => !newPoofParticles.find(np => np.id === p.id))
        );
      }
    };

    requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    window.addEventListener('poof', handlePoofEvent);
    return () => window.removeEventListener('poof', handlePoofEvent);
  }, [handlePoofEvent]);

  return (
    <>
      {/* 神秘氛围蒙版 */}
      <div className="mist-overlay" />

      {/* 鼠标跟随光晕 */}
      <div
        className="cursor-glow"
        style={{
          left: cursorPos.x,
          top: cursorPos.y,
          transform: 'translate(-50%, -50%)'
        }}
      />

      {/* 星尘粒子 */}
      <div className="stardust-container" ref={containerRef}>
        {particles.map(particle => (
          <div
            key={particle.id}
            className="stardust-particle"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size
            }}
          />
        ))}
      </div>

      {/* Poof 爆炸粒子 */}
      <div className="poof-container">
        {poofParticles.map(particle => (
          <div
            key={particle.id}
            className="poof-particle"
            style={{
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              opacity: particle.life,
              transform: `scale(${particle.life})`
            }}
          />
        ))}
      </div>
    </>
  );
}

export default MysticEffects;
