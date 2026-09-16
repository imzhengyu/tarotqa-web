import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './NotFound.css';

function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="not-found">
      <h1 className="page-title">{t('页面不存在', 'Page Not Found')}</h1>
      <p className="not-found-hint">
        {t('你访问的页面不存在或已被移动。', 'The page you are looking for does not exist or has been moved.')}
      </p>
      <Link to="/" className="btn btn-primary">{t('返回首页', 'Back to Home')}</Link>
    </div>
  );
}

export default NotFound;
