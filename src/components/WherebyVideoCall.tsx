import React from 'react';

interface WherebyVideoCallProps {
  roomUrl: string;
  onClose: () => void;
}

const WherebyVideoCall: React.FC<WherebyVideoCallProps> = ({ roomUrl, onClose }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        position: 'relative',
        width: '80%',
        height: '80%',
        backgroundColor: 'black',
      }}>
        <iframe
                    src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        ></iframe>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            padding: '8px 12px',
            backgroundColor: 'red',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default WherebyVideoCall;
