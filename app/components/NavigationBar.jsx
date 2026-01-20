import React from 'react';
import '../../public/styles/NavigationBar.css';

const NavigationBar = ({ 
    onSearchClick, 
    onHomeClick, 
    onSettingsClick,
    showFullView,
    onToggleView 
  }) => {
    return (
      <nav className="navigation-bar">
        <div className="nav-container">
          <button style={{display: "none"}} className="nav-item" onClick={onHomeClick}>
            <div className="nav-icon">🏠</div>
            <span className="nav-label">الرئيسية</span>
          </button>
          
          <button className="nav-item" onClick={onSearchClick}>
            <div className="nav-icon">🔍</div>
            <span className="nav-label">بحث</span>
          </button>
          
          {onToggleView && (
            <button  style={{display: "none"}} className="nav-item" onClick={onToggleView}>
              <div className="nav-icon">
                {showFullView ? '📄' : '📖'}
              </div>
              <span className="nav-label">
                {showFullView ? 'آية واحدة' : 'عرض الكل'}
              </span>
            </button>
          )}
          
          <button  style={{display: "none"}} className="nav-item" onClick={onSettingsClick}>
            <div className="nav-icon">⚙️</div>
            <span className="nav-label">الإعدادات</span>
          </button>
        </div>
      </nav>
    );
  };
  
  export default NavigationBar;