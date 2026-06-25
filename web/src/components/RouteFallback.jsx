import { useLanguage } from '../context/LanguageContext';
import './RouteFallback.css';

export default function RouteFallback() {
  const { t } = useLanguage();
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <div className="route-fallback-pulse" />
      <p className="route-fallback-text">{t('加载中…', 'Loading…')}</p>
    </div>
  );
}
