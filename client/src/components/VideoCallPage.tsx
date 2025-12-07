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
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [remoteVideoOff, setRemoteVideoOff] = useState(true);
  const [callStatus, setCallStatus] = useState<string>("Connecting...");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const initializingRef = useRef(false);
  const offerRef = useRef<RTCSessionDescriptionInit | null>(null);
  const callIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state?.friendId || !state?.friendName) {
      console.error("Missing required state");
      navigate("/messages");
      return;
    }

    // Store offer and callId if receiver
    if (state.isReceiver && state.offer) {
      offerRef.current = state.offer;
    }
    if (state.callId) {
      callIdRef.current = state.callId;
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
      console.log("=== INITIALIZING CALL ===");
      console.log("Is Receiver:", state.isReceiver);
      console.log("Friend ID:", state.friendId);
      
      setCallStatus("Starting audio call...");
      
      // Get audio stream
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        console.log("✅ Audio access granted");
      } catch (error) {
        console.error("❌ Audio access error:", error);
        alert("Failed to access microphone. Please check permissions.");
        navigate(-1);
        return;
      }

      localStreamRef.current = stream;

      // Connect to socket FIRST
      setCallStatus("Connecting to server...");
      socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Wait for socket connection and register user
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Connection timeout")), 10000);

        const handleConnect = () => {
          clearTimeout(timeout);
          console.log("✅ Socket connected:", socket.id);
          
          const userId = localStorage.getItem("userId");
          if (userId) {
            console.log("📡 Registering user:", userId);
            socket.emit("register-user", parseInt(userId));
            
            // Give server time to register
            setTimeout(() => resolve(), 500);
          } else {
            reject(new Error("No userId found"));
          }
        };

        if (socket.connected) {
          handleConnect();
        } else {
          socket.on('connect', handleConnect);
          socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        }
      });

      // Setup WebRTC BEFORE setting up listeners
      setupPeerConnection(stream);
      
      // Setup socket listeners (includes incoming-call listener)
      setupSocketListeners();

      console.log("✅ Setup complete, proceeding with call flow");

      // Small delay to ensure everything is ready
      await new Promise(resolve => setTimeout(resolve, 300));

      // Now initiate or accept call
      if (!state.isReceiver) {
        console.log("👤 Initiating call as caller");
        setCallStatus("Calling...");
        await initiateCall();
      } else if (offerRef.current) {
        console.log("📞 Accepting call as receiver");
        setCallStatus("Accepting call...");
        await acceptCall();
      } else {
        console.log("⏳ Waiting for incoming call as receiver");
        setCallStatus("Waiting for call...");
      }

    } catch (error) {
      console.error("❌ Error initializing call:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Failed to initialize call: " + errorMessage);
      navigate(-1);
    }
  };

  const setupPeerConnection = (stream: MediaStream) => {
    console.log("🔧 Setting up peer connection");
    
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

    // Add local tracks
    stream.getTracks().forEach((track) => {
      console.log("➕ Adding local track:", track.kind);
      peerConnection!.addTrack(track, stream);
    });

    // Handle remote tracks
    peerConnection.ontrack = (event) => {
      console.log("✅ Received remote track:", event.track.kind);
      
      if (event.streams[0]) {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          remoteVideoRef.current.play().catch(e => console.error("Error playing:", e));
        }
        
        if (event.track.kind === 'video') {
          setRemoteVideoOff(false);
        }
      }
      
      setCallStatus("Connected");
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 Sending ICE candidate");
        socket.emit("ice-candidate", {
          targetUserId: state.friendId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      const connState = peerConnection?.connectionState;
      console.log("🔄 Connection state:", connState);
      
      if (connState === "connected") {
        setCallStatus("Connected");
      } else if (connState === "failed") {
        setCallStatus("Connection failed");
        setTimeout(() => endCall(), 2000);
      } else if (connState === "disconnected") {
        setCallStatus("Disconnected");
      }
    };

    console.log("✅ Peer connection setup complete");
  };

  const setupSocketListeners = () => {
    console.log("🎧 Setting up socket listeners");

    // For receivers: listen for incoming call
    socket.on("incoming-call", async ({ callerId, callerName, offer, callId, callerProfileImage }) => {
      console.log("📞 INCOMING CALL EVENT RECEIVED");
      console.log("Caller ID:", callerId, "Caller Name:", callerName);
      console.log("Call ID:", callId);
      
      // Store the offer and callId
      offerRef.current = offer;
      if (callId) {
        callIdRef.current = callId;
      }
      
      // If we're the receiver and haven't accepted yet, accept now
      if (state.isReceiver && peerConnection && !peerConnection.remoteDescription) {
        console.log("✅ Auto-accepting call as receiver");
        setCallStatus("Accepting call...");
        await acceptCall();
      }
    });

    // Call accepted by receiver
    socket.on("call-accepted", async ({ answer }) => {
      console.log("✅ Call accepted, setting remote description");
      if (peerConnection && answer) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          setCallStatus("Connected");
          console.log("✅ Remote description set successfully");
        } catch (error) {
          console.error("❌ Error setting remote description:", error);
        }
      }
    });

    // ICE candidates
    socket.on("ice-candidate", async ({ candidate }) => {
      console.log("🧊 Received ICE candidate");
      if (peerConnection && candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    });

    // Call rejected
    socket.on("call-rejected", () => {
      console.log("❌ Call rejected");
      alert(`${state.friendName} declined your call`);
      endCall();
    });

    // Call ended
    socket.on("call-ended", () => {
      console.log("📴 Call ended by remote user");
      endCall();
    });
    
    // Call failed
    socket.on("call-failed", ({ message }) => {
      console.log("❌ Call failed:", message);
      alert(message || "Call failed");
      endCall();
    });

    // Remote video toggle
    socket.on("remote-video-toggled", ({ videoEnabled }) => {
      console.log("📹 Remote video toggled:", videoEnabled);
      setRemoteVideoOff(!videoEnabled);
    });

    console.log("✅ Socket listeners setup complete");
  };

  const initiateCall = async () => {
    console.log("📞 Creating offer...");
    
    if (!peerConnection) {
      console.error("No peer connection");
      return;
    }

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await peerConnection.setLocalDescription(offer);
      console.log("✅ Offer created and set as local description");
      
      const userId = localStorage.getItem("userId");
      
      console.log("📡 Emitting call-user event");
      socket.emit("call-user", {
        callerId: parseInt(userId!),
        receiverId: state.friendId,
        chatRoomId: parseInt(chatRoomId!),
        offer,
      });
      
      console.log("✅ Call initiated, waiting for response");
    } catch (error) {
      console.error("Error initiating call:", error);
      throw error;
    }
  };

  const acceptCall = async () => {
    console.log("📞 Accepting call...");
    
    if (!peerConnection) {
      console.error("No peer connection");
      return;
    }

    const offer = offerRef.current || state.offer;
    
    if (!offer) {
      console.error("No offer available to accept");
      return;
    }

    try {
      console.log("Setting remote description from offer");
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      console.log("Creating answer");
      const answer = await peerConnection.createAnswer();
      
      console.log("Setting local description");
      await peerConnection.setLocalDescription(answer);
      
      const receiverId = parseInt(localStorage.getItem("userId")!);
      
      console.log("📡 Emitting accept-call event");
      socket.emit("accept-call", { 
        callerId: state.friendId, 
        answer,
        receiverId: receiverId
      });
      
      setCallStatus("Connected");
      console.log("✅ Call accepted successfully");
    } catch (error) {
      console.error("❌ Error accepting call:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert("Failed to accept call: " + errorMessage);
      endCall();
    }
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
        console.log("Requesting camera access...");
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          }
        });

        const videoTrack = videoStream.getVideoTracks()[0];
        
        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          } else {
            peerConnection.addTrack(videoTrack, localStreamRef.current!);
          }
        }

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(videoTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          await localVideoRef.current.play();
        }

        setIsVideoOff(false);
        
        socket.emit("video-toggled", {
          targetUserId: state.friendId,
          videoEnabled: true
        });
        
        console.log("✅ Video enabled");
      } else {
        if (localStreamRef.current) {
          const videoTrack = localStreamRef.current.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.stop();
            localStreamRef.current.removeTrack(videoTrack);
            
            if (peerConnection) {
              const sender = peerConnection.getSenders().find(s => s.track === videoTrack);
              if (sender) {
                peerConnection.removeTrack(sender);
              }
            }
          }
        }
        
        setIsVideoOff(true);
        
        socket.emit("video-toggled", {
          targetUserId: state.friendId,
          videoEnabled: false
        });
        
        console.log("Video disabled");
      }
    } catch (error) {
      console.error("Error toggling video:", error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          alert("Camera permission denied. Please allow camera access to enable video.");
        } else if (error.name === 'NotReadableError') {
          alert("Camera is being used by another application. Please close other apps and try again.");
        } else {
          alert("Failed to toggle video: " + error.message);
        }
      } else {
        alert("Failed to toggle video: Unknown error");
      }
    }
  };

  const endCall = async () => {
    console.log("📴 Ending call");
    
    const callId = callIdRef.current || state.callId;
    
    if (callId) {
      try {
        const token = localStorage.getItem("token");
        await fetch(`${API_URL}/api/chats/video-call/${callId}/end`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error("Error updating call status:", error);
      }
    }

    if (socket?.connected) {
      socket.emit("end-call", { 
        targetUserId: state.friendId, 
        chatRoomId, 
        callId: callId 
      });
    }

    cleanup();
    navigate("/messages");
  };

  const cleanup = () => {
    console.log("🧹 Cleaning up resources");
    
    localStreamRef.current?.getTracks().forEach(track => {
      track.stop();
      console.log("Stopped track:", track.kind);
    });
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