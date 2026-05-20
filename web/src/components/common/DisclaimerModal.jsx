import { useEffect } from 'react';
import PropTypes from 'prop-types';
import './DisclaimerModal.css';

const DISCLAIMERS = {
  tarot: {
    title: '塔罗占卜声明',
    content: `本页面提供的塔罗占卜结果仅供参考娱乐，不构成任何形式的决策建议。

塔罗牌是一种古老的占卜工具，通过牌面图案和直觉解读来探索问题可能的走向。其解读具有主观性，不同的塔罗师对同一牌阵可能有不同的解读。

请您理性看待占卜结果，不要过分依赖塔罗牌做出重大人生决策。命运掌握在自己手中，积极的态度和努力才是改变人生的关键。

**隐私说明**：您的问题和抽到的牌仅在前端内存中处理，不会存储到任何服务器或本地存储。`
  },
  ziwei: {
    title: '紫微斗数声明',
    content: `本页面提供的紫微斗数排盘结果仅供参考娱乐，不构成任何形式的决策建议。

紫微斗数是中国传统命理学的一种，源于易经理论，结合了天文、星象、数学等多种元素。其理论体系复杂，不同流派对星曜解读可能存在差异。

请您理性看待命盘解读，不要过分依赖命盘结果做出重大人生决策。命运掌握在自己手中，积极的态度和努力才是改变人生的关键。

**隐私说明**：您输入的出生信息仅在前端内存中处理，不会存储到任何服务器或本地存储。`
  },
  astrology: {
    title: '星盘声明',
    content: `本页面提供的西方星盘结果仅供参考娱乐，不构成任何形式的决策建议。

西方星盘（Natal Chart）是基于天文学数据计算的行星位置图，反映的是出生时刻的天体排列情况。不同的占星体系对行星含义和相位解读可能存在差异。

请您理性看待星盘解读，不要过分依赖星盘结果做出重大人生决策。占星学是一种文化传统和娱乐方式，积极的态度和努力才是改变人生的关键。

**隐私说明**：您输入的出生信息仅在前端内存中处理，不会存储到任何服务器或本地存储。`
  }
};

function DisclaimerModal({ isOpen, onClose, type = 'ziwei' }) {
  const disclaimer = DISCLAIMERS[type] || DISCLAIMERS.ziwei;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="disclaimer-modal-overlay" onClick={handleOverlayClick}>
      <div className="disclaimer-modal">
        <div className="disclaimer-modal-header">
          <h2>{disclaimer.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="disclaimer-modal-content">
          {disclaimer.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return <p key={idx} className="disclaimer-strong">{paragraph.replace(/\*\*/g, '')}</p>;
            }
            if (paragraph.startsWith('**')) {
              const parts = paragraph.split('**');
              return (
                <p key={idx}>
                  {parts.map((part, i) => (
                    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                  ))}
                </p>
              );
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>
        <div className="disclaimer-modal-footer">
          <button className="btn btn-primary" onClick={onClose}>
            我已阅读并同意
          </button>
        </div>
      </div>
    </div>
  );
}

DisclaimerModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['tarot', 'ziwei', 'astrology'])
};

export default DisclaimerModal;
