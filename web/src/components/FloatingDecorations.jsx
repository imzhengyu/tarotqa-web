import { StarIcon, SparkleEffect, FloatingParticle } from './common/DecorativeElements';
import './FloatingDecorations.css';

export function FloatingDecorations({ position = 'all' }) {
  const corners = [];

  if (position === 'all' || position === 'top-left') {
    corners.push(
      <div key="top-left" className="floatingDecor topLeft">
        <StarIcon size={16} className="floatStar star1" />
        <StarIcon size={12} className="floatStar star2" />
        <FloatingParticle size={3} className="floatParticle particle1" />
        <SparkleEffect size={30} intensity={0.5} className="floatSparkle sparkle1" />
      </div>
    );
  }

  if (position === 'all' || position === 'top-right') {
    corners.push(
      <div key="top-right" className="floatingDecor topRight">
        <StarIcon size={14} className="floatStar star3" />
        <StarIcon size={18} className="floatStar star4" />
        <FloatingParticle size={4} className="floatParticle particle2" />
        <SparkleEffect size={35} intensity={0.6} className="floatSparkle sparkle2" />
      </div>
    );
  }

  if (position === 'all' || position === 'bottom-left') {
    corners.push(
      <div key="bottom-left" className="floatingDecor bottomLeft">
        <StarIcon size={12} className="floatStar star5" />
        <StarIcon size={16} className="floatStar star6" />
        <FloatingParticle size={3} className="floatParticle particle3" />
        <SparkleEffect size={25} intensity={0.4} className="floatSparkle sparkle3" />
      </div>
    );
  }

  if (position === 'all' || position === 'bottom-right') {
    corners.push(
      <div key="bottom-right" className="floatingDecor bottomRight">
        <StarIcon size={14} className="floatStar star7" />
        <StarIcon size={10} className="floatStar star8" />
        <FloatingParticle size={5} className="floatParticle particle4" />
        <SparkleEffect size={40} intensity={0.7} className="floatSparkle sparkle4" />
      </div>
    );
  }

  return <>{corners}</>;
}

export default FloatingDecorations;
