import React, { useEffect } from 'react';
import './About.css';
import Contact from './Contact';

const About = () => {
  useEffect(() => {
    const isInViewport = (element) => {
      const rect = element.getBoundingClientRect();
      return (
        rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8 &&
        rect.bottom >= 0
      );
    };

    const handleScrollAnimation = () => {
      const featureBlocks = document.querySelectorAll('.feature-block');
      
      featureBlocks.forEach((block) => {
        if (isInViewport(block) && !block.classList.contains('animated')) {
          block.classList.add('animated');
        }
      });
    };

    handleScrollAnimation();
    window.addEventListener('scroll', handleScrollAnimation);
    
    return () => {
      window.removeEventListener('scroll', handleScrollAnimation);
    };
  }, []);

  return (
    <>
      <section className="about-section">
        <div className='about'>
          <div className='feature-text'>
            <h2>About</h2>
          </div>
        </div>

        <div className="feature-block">
          <div className="feature-text">
            <h2>Lorem ipsum dolor sit amet consectetur</h2>
            <p>At PatrolNet, we believe that safer neighborhoods begin with better communication and smarter patrol strategies. Our system optimizes tanod deployment based on patrol patterns, community input, and live incident data—ensuring that resources are used effectively and response times are minimized. Through a user-friendly interface, residents can report incidents directly, while tanods receive timely updates and guidance to act swiftly and efficiently.</p>
          </div>
          <div className="feature-image">
            <div className="image-container">
              <img src="A1.jpg" alt="AI Detection" />
              <div className="image-overlay">
                <h3>Innovation</h3>
                <p></p>
              </div>
            </div>
          </div>
        </div>

        <div className="feature-block reverse">
          <div className="feature-text">
            <h2>Lorem ipsum dolor sit amet consectetur</h2>
            <p>Developed with the unique needs of barangays in mind, PatrolNet bridges the gap between community vigilance and modern technology, fostering a more connected, proactive, and secure environment for all.</p>
          </div>
          <div className="feature-image">
            <div className="image-container">
              <img src="A1.jpg" alt="Rapid Analysis" />
              <div className="image-overlay">
                <h3>Precision</h3>
                <p>Detailed analytics</p>
              </div>
            </div>
          </div>
        </div>

        <div className="feature-block">
          <div className="feature-text">
            <h2>Lorem ipsum dolor sit amet consectetur</h2>
            <p>
Developed with the unique needs of barangays in mind, PatrolNet bridges the gap between community vigilance and modern technology, fostering a more connected, proactive, and secure environment for all.</p>
          </div>
          <div className="feature-image">
            <div className="image-container">
              <img src="A1.jpg" alt="Production Team" />
              <div className="image-overlay">
                <h3>Expertise</h3>
                <p>Professional team</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Contact Section */}
      <Contact />
    </>
  );
};

export default About;