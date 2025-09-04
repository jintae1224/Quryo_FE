import classNames from 'classnames/bind';
import { Database, Shield, Users,Zap } from 'lucide-react';
import React from 'react';

import styles from './HeroSection.module.css';

const cx = classNames.bind(styles);

export default function HeroSection() {
  return (
    <div className={cx('hero-section')}>
      <div className={cx('hero-content')}>
        <div className={cx('badge')}>
          <Zap className="w-4 h-4 mr-2" style={{ color: '#10b981' }} />
          <span className={cx('badge-text')}>
            AI-Powered SQL Generation
          </span>
        </div>
        
        <h1 className={cx('hero-title')}>
          Transform Natural Language to{' '}
          <span className={cx('hero-gradient')}>
            Perfect SQL
          </span>
        </h1>
        
        <p className={cx('hero-description')}>
          Generate complex SQL queries from simple English descriptions. 
          Our enterprise-grade platform helps teams query databases faster 
          and more accurately than ever before.
        </p>
        
        <div className={cx('feature-grid')}>
          {[
            { icon: Database, text: 'Support for 15+ database types' },
            { icon: Shield, text: 'Enterprise security & compliance' },
            { icon: Users, text: 'Team collaboration features' }
          ].map((feature, index) => (
            <div
              key={index}
              className={cx('feature-item')}
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className={cx('feature-icon')}>
                <feature.icon className="w-4 h-4" style={{ color: '#10b981' }} />
              </div>
              <span className={cx('feature-text')}>{feature.text}</span>
            </div>
          ))}
        </div>
        
        <div className={cx('status-indicators')}>
          <div className={cx('status-item')}>
            <div className={cx('status-dot', 'status-green')}></div>
            <span>99.9% Uptime</span>
          </div>
          <div className={cx('status-item')}>
            <div className={cx('status-dot', 'status-blue')}></div>
            <span>SOC 2 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
}