import PropTypes from 'prop-types';
import BirthInfoForm from '../../components/common/BirthInfoForm';
import DelayedPoofButton from '../../components/common/DelayedPoofButton';

export default function ZiweiChartForm({ birthData, onChange, onGenerate, t }) {
  return (
    <div className="ziwei-form-section">
      <div className="form-card">
        <h2>{t('出生信息', 'Birth Information')}</h2>
        <BirthInfoForm
          value={birthData}
          onChange={onChange}
          showGender={true}
        />
        <DelayedPoofButton
          className="btn btn-primary generate-btn"
          onClick={onGenerate}
          disabled={!birthData}
        >
          {t('生成命盘', 'Generate Chart')}
        </DelayedPoofButton>
      </div>
    </div>
  );
}

ZiweiChartForm.propTypes = {
  birthData: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired
};
