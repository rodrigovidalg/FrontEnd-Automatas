import React from 'react';

interface ProcessStatusProps {
  show: boolean;
  title: string;
  description: string;
  progress: number;
  icon?: string;
}

const ProcessStatus: React.FC<ProcessStatusProps> = ({
  show,
  title,
  description,
  progress,
  icon = '🚀'
}) => {
  return (
    <div className={`process-status ${show ? 'show' : ''}`}>
      <div className="status-header">
        <div className="status-icon">{icon}</div>
        <div className="status-text">
          <div className="status-title">{title}</div>
          <div className="status-description">{description}</div>
        </div>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProcessStatus;