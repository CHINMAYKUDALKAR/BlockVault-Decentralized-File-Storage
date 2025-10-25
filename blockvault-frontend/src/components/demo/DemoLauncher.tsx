import React, { useState } from 'react';
import SimpleDemoInterface from './SimpleDemoInterface';

const DemoLauncher: React.FC = () => {
  const [showDemo, setShowDemo] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowDemo(true)}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
      >
        🎬 Launch Demo
      </button>

      {showDemo && (
        <SimpleDemoInterface onClose={() => setShowDemo(false)} />
      )}
    </>
  );
};

export default DemoLauncher;
