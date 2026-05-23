import { useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * 带 poof 动画效果的按钮包装组件
 * 当按钮被点击时会播放一个缩放+光晕的动画效果
 */
function PoofButton({ children, className = '', onClick, poofEnabled = true, ...props }) {
  const handleClick = useCallback((e) => {
    if (poofEnabled) {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      // 触发自定义 poof 事件
      window.dispatchEvent(new CustomEvent('poof', { detail: { x, y } }));

      button.classList.remove('btn-poof');
      // 强制重绘以确保动画重新触发
      void button.offsetWidth;
      button.classList.add('btn-poof');
    }

    onClick?.(e);
  }, [onClick, poofEnabled]);

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

PoofButton.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  poofEnabled: PropTypes.bool
};

export default PoofButton;
