import React from 'react';
import { ProcessStatus as ProcessStatusType } from '../../types/user.types';

interface ProcessStatusProps {
  status: ProcessStatusType;
}

export const ProcessStatus: React.FC<ProcessStatusProps> = ({ status }) => {
  if (!status.isVisible) return null;

  return (
    <div className={`process-status fixed top-8 right-8 bg-white/95 backdrop-blur-xl rounded-2xl p-5 shadow-2xl z-50 min-w-80 transition-transform duration-400 border border-gray-300/30 ${status.isVisible ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="status-header flex items-center gap-3 mb-4">
        <div className="status-icon w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center text-xl">
          {status.icon}
        </div>
        <div className="status-text flex-1">
          <div className="status-title text-lg font-bold text-gray-900 mb-1">
            {status.title}
          </div>
          <div className="status-description text-sm text-gray-600">
            {status.description}
          </div>
        </div>
      </div>
      <div className="progress-bar h-1.5 bg-gray-200 rounded-full overflow-hidden relative mt-3">
        <div 
          className="progress-fill h-full bg-teal-500 rounded-full transition-all duration-400"
          style={{ width: `${status.progress}%` }}
        />
      </div>
    </div>
  );
};