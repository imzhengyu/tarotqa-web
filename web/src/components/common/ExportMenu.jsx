import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLanguage } from '../../context/LanguageContext';
import { exportToPNG } from '../../utils/export';
import './ExportMenu.css';

function ExportMenu({ elementId, filename = 'export' }) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportToPNG(elementId, filename);
    } catch (error) {
      console.error('Export failed:', error);
      alert(language === 'zh' ? `导出失败: ${error.message}` : `Export failed: ${error.message}`);
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="export-menu" ref={menuRef}>
      <button
        className="export-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        title={language === 'zh' ? '导出' : 'Export'}
      >
        {exporting ? '...' : '📥'}
      </button>
      {isOpen && (
        <div className="export-menu-dropdown">
          <button
            className="export-menu-item"
            onClick={handleExport}
          >
            <span className="export-icon">🖼️</span>
            <span>{language === 'zh' ? '导出为 PNG' : 'Export as PNG'}</span>
          </button>
        </div>
      )}
    </div>
  );
}

ExportMenu.propTypes = {
  elementId: PropTypes.string.isRequired,
  filename: PropTypes.string
};

export default ExportMenu;
