import { useState } from 'react';
import { platform, isWeb } from './adapters';

function App() {
  const [status, setStatus] = useState('');

  // Test platform detection
  const testPlatform = () => {
    setStatus(`Running on: ${isWeb() ? 'Web Browser' : 'Native App'}`);
  };

  // Test localStorage
  const testStorage = async () => {
    try {
      await platform.saveToLocal('test', { message: 'Hello from adapter!' });
      const data = await platform.getFromLocal('test');
      setStatus(`Storage test: ${data.message}`);
    } catch (error) {
      setStatus(`Storage error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>Video Journal</h1>
      <p>Testing platform adapter...</p>
      
      <div style={{ marginTop: '20px' }}>
        <button onClick={testPlatform} style={buttonStyle}>
          Test Platform Detection
        </button>
        
        <button onClick={testStorage} style={buttonStyle}>
          Test Local Storage
        </button>
      </div>

      {status && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: '#f0f0f0',
          borderRadius: '5px' 
        }}>
          {status}
        </div>
      )}
    </div>
  );
}

const buttonStyle = {
  padding: '10px 20px',
  marginRight: '10px',
  marginTop: '10px',
  cursor: 'pointer',
  background: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
};

export default App;