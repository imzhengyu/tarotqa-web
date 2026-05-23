import { useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

/**
 * 带 poof 动画效果的导航链接
 * 等待 poof 动画完成后再执行页面跳转
 */
function PoofNavLink({ to, className, children, poofEnabled = true, onClick, ...props }) {
  const navigate = useNavigate();

  const handleClick = useCallback((e) => {
    // 如果不是左键点击或者是 modifier 键按下，不处理
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return;
    }

    e.preventDefault();

    if (poofEnabled) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      window.dispatchEvent(new CustomEvent('poof', { detail: { x, y } }));

      const button = e.currentTarget;
      button.classList.remove('btn-poof');
      void button.offsetWidth;
      button.classList.add('btn-poof');

      // 等待 poof 动画完成后再跳转 (500ms button + 1500ms particle = 2000ms total)
      setTimeout(() => {
        navigate(to);
      }, 600);
    } else {
      navigate(to);
    }

    onClick?.(e);
  }, [to, navigate, onClick, poofEnabled]);

  return (
    <NavLink
      to={to}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </NavLink>
  );
}

PoofNavLink.propTypes = {
  to: PropTypes.string.isRequired,
  className: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  children: PropTypes.node.isRequired,
  poofEnabled: PropTypes.bool,
  onClick: PropTypes.func
};

export default PoofNavLink;
