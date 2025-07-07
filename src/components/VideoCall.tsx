import React, { useEffect, useRef, useState } from 'react';
import { X, Mic, MicOff, Video, VideoOff } from 'lucide-react';

interface VideoCallProps {
  socket: any;
  peerConnection: RTCPeerConnection;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onHangUp: () => void;
}

const VideoCall: React.FC<VideoCallProps> = ({ socket, peerConnection, localStream, remoteStream, onHangUp }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] p-4 flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
          <div className="relative bg-gray-900 rounded-md overflow-hidden">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">Remote User</div>
          </div>
          <div className="relative bg-gray-800 rounded-md overflow-hidden">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-sm px-2 py-1 rounded">You</div>
          </div>
        </div>
        <div className="flex justify-center items-center gap-4 mt-4">
          <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white`}>
            {isMuted ? <MicOff /> : <Mic />}
          </button>
          <button onClick={toggleVideo} className={`p-3 rounded-full ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white`}>
            {isVideoOff ? <VideoOff /> : <Video />}
          </button>
          <button onClick={onHangUp} className="p-3 rounded-full bg-red-600 text-white">
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
