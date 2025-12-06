import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface LocationState {
  friendId: number;
  friendName: string;
  friendProfileImage?: string;
  isReceiver: boolean;
  offer?: RTCSessionDescriptionInit;
  callId?: number;
}

let socket: Socket;
let peerConnection: RTCPeerConnection | null = null;

const VideoCallPage = () => {
  const { chatRoomId } = useParams<{ chatRoomId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState;

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true); // Start with video OFF
  const [remoteVideoOff, setRemoteVideoOff] = useState(true); // Remote user's video state
  const [callStatus, setCallStatus] = useState<string>("Connecting...");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!state?.friendId || !state?.friendName) {
      console.error("Missing required state");
      navigate("/messages");
      return;
    }

    if (!initializingRef.current) {
      initializingRef.current = true;
      initializeCall();
    }

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      console.log("=== INITIALIZING AUDIO CALL ===");
      
      // Start with AUDIO ONLY - no camera permission needed!
      setCallStatus("Starting audio call...");
      
      let stream: MediaStream;
      try {
        // Request ONLY audio initially
        stream = await navigator.mediaDevices.getUserMedia({
          video: false, // No video initially
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log("✅ Audio access granted");
      } catch (error: any) {
        console.error("❌ Audio access error:", error);
        alert("Failed to access microphone. Please check permissions.");
        navigate(-1);
        return;
      }

      localStreamRef.current = stream;

      // Connect to socket
      setCallStatus("Connecting...");
      socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout")), 10000);

        if (socket.connected) {
          clearTimeout(timeout);
          resolve();
        } else {
          socket.on('connect', () => {
            clearTimeout(timeout);
            console.log("✅ Socket connected:", socket.id);
            
            const userId = localStorage.getItem("userId");
            if (userId) {
              socket.emit("register-user", parseInt(userId));
            }
            resolve();
          });
          
          socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        }
      });

      // Setup WebRTC
      setupPeerConnection(stream);
      setupSocketListeners();

      await new Promise(resolve => setTimeout(resolve, 300));

      // Initiate or accept call
      if (!state.isReceiver) {
        setCallStatus("Calling...");
        await initiateCall();
      } else if (state.offer) {
        setCallStatus("Accepting call...");
        await acceptCall();
      }

    } catch (error: any) {
      console.error("❌ Error initializing call:", error);
      alert("Failed to initialize call: " + error.message);
      navigate(-1);
    }
  };

  const setupPeerConnection = (stream: MediaStream) => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
      iceCandidatePoolSize: 10,
    };

    peerConnection = new RTCPeerConnection(configuration);

    stream.getTracks().forEach((track) => {
      peerConnection!.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      console.log("✅ Received remote track:", event.track.kind);
      
      if (event.track.kind === 'video') {
        setRemoteVideoOff(false);
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(e => console.error("Error playing:", e));
        }
      }
      
      setCallStatus("Connected");
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          targetUserId: state.friendId,
          candidate: event.candidate,
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      const connState = peerConnection?.connectionState;
      if (connState === "connected") setCallStatus("Connected");
      else if (connState === "failed") {
        setCallStatus("Connection failed");
        setTimeout(() => endCall(), 2000);
      }
    };
  };

  const setupSocketListeners = () => {
    socket.on("call-accepted", async ({ answer }) => {
      if (peerConnection && answer) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("Connected");
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      if (peerConnection && candidate) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call-rejected", () => {
      alert(`${state.friendName} declined your call`);
      endCall();
    });

    socket.on("call-ended", () => endCall());
    
    socket.on("call-failed", ({ message }) => {
      alert(message || "Call failed");
      endCall();
    });

    // Listen for remote user's video state changes
    socket.on("remote-video-toggled", ({ videoEnabled }) => {
      setRemoteVideoOff(!videoEnabled);
    });
  };

  const initiateCall = async () => {
    if (!peerConnection) return;
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true, // Still receive video if other person enables
    });
    await peerConnection.setLocalDescription(offer);
    
    const userId = localStorage.getItem("userId");
    socket.emit("call-user", {
      callerId: parseInt(userId!),
      receiverId: state.friendId,
      chatRoomId: parseInt(chatRoomId!),
      offer,
    });
  };

  const acceptCall = async () => {
    if (!peerConnection || !state.offer) return;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(state.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit("accept-call", { callerId: state.friendId, answer });
    setCallStatus("Connected");
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = async () => {
    try {
      if (isVideoOff) {
        // Turn ON video - request camera permission
        console.log("Requesting camera access...");
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        });

        const videoTrack = videoStream.getVideoTracks()[0];
        
        if (peerConnection) {
          // Replace audio-only with audio+video
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          } else {
            peerConnection.addTrack(videoTrack, localStreamRef.current!);
          }
        }

        // Add video track to local stream
        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        }

        // Display local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          await localVideoRef.current.play();
        }

        setIsVideoOff(false);
        
        // Notify remote user
        socket.emit("video-toggled", {
          targetUserId: state.friendId,
          videoEnabled: true
        });
        
        console.log("✅ Video enabled");
      } else {
        // Turn OFF video
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            localStreamRef.current.removeTrack(videoTrack);
            
            // Remove from peer connection
            if (peerConnection) {
              const sender = peerConnection.getSenders().find(s => s.track === videoTrack);
              if (sender) {
                peerConnection.removeTrack(sender);
              }
            }
          }
        }
        
        setIsVideoOff(true);
        
        // Notify remote user
        socket.emit("video-toggled", {
          targetUserId: state.friendId,
          videoEnabled: false
        });
        
        console.log("Video disabled");
      }
    } catch (error: any) {
      console.error("Error toggling video:", error);
      if (error.name === 'NotAllowedError') {
        alert("Camera permission denied. Please allow camera access to enable video.");
      } else if (error.name === 'NotReadableError') {
        alert("Camera is being used by another application. Please close other apps and try again.");
      } else {
        alert("Failed to toggle video: " + error.message);
      }
    }
  };

  const endCall = async () => {
    if (state.callId) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/chats/video-call/${state.callId}/end`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error("Error updating call status:", error);
      }
    }

    if (socket?.connected) {
      socket.emit("end-call", { targetUserId: state.friendId, chatRoomId, callId: state.callId });
    }

    cleanup();
    navigate("/messages");
  };

  const cleanup = () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    peerConnection?.close();
    peerConnection = null;
    if (socket?.connected) {
      socket.removeAllListeners();
      socket.disconnect();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-4 bg-black/50 backdrop-blur-sm flex items-center justify-between border-b border-gray-800">
        <div>
          <h2 className="text-xl font-semibold">{state?.friendName || "Unknown"}</h2>
          <p className="text-sm text-gray-400">{callStatus}</p>
        </div>
      </div>

      {/* Main Call Area */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Remote User Display */}
        <div className="relative w-full h-full flex items-center justify-center">
          {remoteVideoOff ? (
            // Show profile picture when video is off
            <div className="text-center">
              <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl">
                {state?.friendProfileImage ? (
                  <img 
                    src={state.friendProfileImage} 
                    alt={state?.friendName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl font-bold text-white">
                    {state?.friendName?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-2xl font-semibold mb-2">{state?.friendName}</p>
              <p className="text-gray-400">{callStatus}</p>
            </div>
          ) : (
            // Show remote video when enabled
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          )}

          {/* Local Video (Picture-in-Picture) */}
          {!isVideoOff && (
            <div className="absolute bottom-6 right-6 w-48 h-36 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-700">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Local Profile Picture when video is off */}
          {isVideoOff && (
            <div className="absolute bottom-6 right-6 w-32 h-32 bg-gray-800 rounded-full overflow-hidden shadow-2xl border-4 border-gray-700 flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">You</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 bg-black/50 backdrop-blur-sm flex justify-center gap-6 border-t border-gray-800">
        <button
          onClick={toggleMute}
          className={`p-5 rounded-full transition-all shadow-lg transform hover:scale-110 ${
            isMuted ? "bg-red-600 hover:bg-red-500" : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-5 rounded-full transition-all shadow-lg transform hover:scale-110 ${
            isVideoOff ? "bg-gray-700 hover:bg-gray-600" : "bg-blue-600 hover:bg-blue-500"
          }`}
          title={isVideoOff ? "Turn on camera" : "Turn off camera"}
        >
          {isVideoOff ? <VideoOff size={28} /> : <Video size={28} />}
        </button>

        <button
          onClick={endCall}
          className="p-5 rounded-full bg-red-600 hover:bg-red-500 transition-all shadow-lg transform hover:scale-110"
          title="End call"
        >
          <PhoneOff size={28} />
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;