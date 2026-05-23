import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * 带 poof 动画效果的延迟按钮
 * 等待 poof 动画完成后再执行 onClick
 */
function DelayedPoofButton({ children, className = '', onClick, poofEnabled = true, delay = 600, ...props }) {
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const handleClick = useCallback((e) => {
    // 阻止事件冒泡，防止触发其他点击处理器
    e.stopPropagation();
    e.preventDefault();

    if (poofEnabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // 触发 poof 粒子效果
      window.dispatchEvent(new CustomEvent('poof', { detail: { x, y } }));

      // 触发按钮缩放动画
      e.currentTarget.classList.remove('btn-poof', 'rippling');
      void e.currentTarget.offsetWidth;
      e.currentTarget.classList.add('btn-poof', 'rippling');
    }

    if (!onClickRef.current) {
      return;
    }

    if (poofEnabled) {
      // 等待 poof 动画完成后再执行原始 onClick
      setTimeout(() => {
        onClickRef.current(e);
      }, delay);
    } else {
      onClickRef.current(e);
    }
  }, [poofEnabled, delay]);

  return (
    <button
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </button>
  );
}

DelayedPoofButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  poofEnabled: PropTypes.bool,
  delay: PropTypes.number
};

export default DelayedPoofButton;
