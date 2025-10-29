import React from 'react';

export const IconProps = {
    size: 24,
    className: "transition-all duration-300"
};

export const ChatIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17.0182C3.52628 17.3481 3.56586 17.7495 3.42836 18.1097L2.242 21.217C2.083 21.6335 2.483 22.022 2.894 21.847L6.002 20.654C6.353 20.519 6.742 20.554 7.067 20.728C8.527 21.536 10.211 22 12 22Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M11 9H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ActivityIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const StudyPlanIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 15H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 19H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ToolsIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M14.7 6.30005L9.70001 11.3C8.80001 12.2 9.00001 13.7 10.1 14.3L11.8 15.3C11.9 15.3 12 15.5 11.9 15.7L8.90001 20.3C8.40001 21.1 7.40001 21.2 6.80001 20.6L3.40001 17.2C2.80001 16.6 2.90001 15.6 3.70001 15.1L8.30001 12.1C8.50001 12 8.70001 12.1 8.70001 12.2L9.70001 13.9C10.3 15 11.8 15.2 12.7 14.3L17.7 9.30005C18.1 8.90005 18.1 8.30005 17.7 7.90005L16.1 6.30005C15.7 5.90005 15.1 5.90005 14.7 6.30005Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 5L20 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const DictionaryIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 2H20V22H6.5A2.5 2.5 0 0 1 4 19.5V4.5A2.5 2.5 0 0 1 6.5 2Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 6H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 10H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SettingsIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12.22 2H11.78C9.77001 2.01 7.98999 3.23 7.21999 5.09L6.99999 5.62C6.91999 5.81 6.72999 5.95 6.51999 5.95H5.08999C2.70999 5.95 0.949989 8.16 1.40999 10.51L1.64999 11.74C1.94999 13.91 3.82999 15.48 5.98999 15.48H6.50999C6.71999 15.48 6.90999 15.62 6.98999 15.81L7.20999 16.34C8.01999 18.26 9.87999 19.5 11.95 19.5H12.05C14.12 19.5 15.98 18.26 16.79 16.34L17.01 15.81C17.09 15.62 17.28 15.48 17.49 15.48H18.01C20.17 15.48 22.05 13.91 22.35 11.73L22.59 10.5C23.05 8.16 21.29 5.95 18.91 5.95H17.48C17.27 5.95 17.08 5.81 17 5.62L16.78 5.09C16.01 3.23 14.23 2.01 12.22 2Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ProfileIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26003 15 3.41003 18.13 3.41003 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const UploadIcon = ({ size = 24, className = "" }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
