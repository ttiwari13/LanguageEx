import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Video, VideoOff, AlertCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface LocationState {
  friendId: number;
  friendName: string;
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
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState<string>("Initializing...");
  const [permissionError, setPermissionError] = useState<string>("");
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

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

  const checkPermissions = async () => {
    try {
      // Check if permissions API is supported
      if (!navigator.permissions) {
        console.warn("Permissions API not supported");
        return { camera: "prompt", microphone: "prompt" };
      }

      const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      
      console.log("Camera permission:", cameraPermission.state);
      console.log("Microphone permission:", micPermission.state);
      
      return {
        camera: cameraPermission.state,
        microphone: micPermission.state
      };
    } catch (error) {
      console.warn("Could not check permissions:", error);
      return { camera: "prompt", microphone: "prompt" };
    }
  };

  const requestMediaWithRetry = async (constraints: MediaStreamConstraints, retryCount = 0): Promise<MediaStream> => {
    try {
      console.log(`Attempt ${retryCount + 1}: Requesting media with constraints:`, constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("✅ Media stream obtained:", stream.getTracks().map(t => `${t.kind}: ${t.label}`));
      return stream;
    } catch (error: any) {
      console.error(`Attempt ${retryCount + 1} failed:`, error);
      
      // If first attempt with high quality fails, try with basic constraints
      if (retryCount === 0 && (error.name === 'OverconstrainedError' || error.name === 'NotFoundError')) {
        console.log("Retrying with basic constraints...");
        return requestMediaWithRetry(
          { video: true, audio: true },
          retryCount + 1
        );
      }
      
      throw error;
    }
  };

  const initializeCall = async () => {
    try {
      console.log("=== INITIALIZING VIDEO CALL ===");
      console.log("State:", state);
      console.log("User Agent:", navigator.userAgent);
      console.log("Is HTTPS:", window.location.protocol === 'https:');
      
      // Check current permissions
      const permissions = await checkPermissions();
      console.log("Current permissions:", permissions);
      
      if (permissions.camera === 'denied' || permissions.microphone === 'denied') {
        setShowPermissionHelp(true);
        throw new Error("Camera or microphone access was previously denied. Please reset permissions in your browser settings.");
      }

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera/microphone access. Please use a modern browser like Chrome, Firefox, or Edge.");
      }

      // Request media with retry logic
      setCallStatus("🎥 Requesting camera and microphone access...");
      console.log("Requesting media permissions...");
      
      let stream: MediaStream;
      try {
        // First try with optimal settings
        stream = await requestMediaWithRetry({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
        });
      } catch (mediaError: any) {
        console.error("❌ Media access error:", mediaError);
        
        let errorMessage = "Failed to access camera/microphone. ";
        
        if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          errorMessage = "🚫 Permission Denied!\n\nYou blocked camera/microphone access. To fix this:\n\n";
          
          if (navigator.userAgent.includes('Chrome')) {
            errorMessage += "1. Click the 🔒 icon in the address bar\n2. Click 'Site settings'\n3. Allow Camera and Microphone\n4. Refresh the page";
          } else if (navigator.userAgent.includes('Firefox')) {
            errorMessage += "1. Click the 🔒 icon in the address bar\n2. Click 'More Information'\n3. Go to Permissions tab\n4. Allow Camera and Microphone\n5. Refresh the page";
          } else {
            errorMessage += "1. Check your browser settings\n2. Allow camera and microphone for this site\n3. Refresh the page";
          }
          
          setShowPermissionHelp(true);
        } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
          errorMessage = "❌ No camera or microphone found!\n\nPlease make sure:\n• A camera/microphone is connected\n• It's not being used by another application";
        } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
          errorMessage = "❌ Device is busy!\n\nYour camera or microphone is already in use by another application. Please close other apps and try again.";
        } else if (mediaError.name === 'OverconstrainedError') {
          errorMessage = "❌ Device doesn't meet requirements!\n\nYour camera/microphone doesn't support the required settings. Trying basic mode...";
        } else if (mediaError.name === 'SecurityError') {
          errorMessage = "🔒 Security Error!\n\nCamera access requires HTTPS connection or localhost.";
        } else {
          errorMessage = `❌ Error: ${mediaError.message || mediaError.name}`;
        }
        
        setPermissionError(errorMessage);
        alert(errorMessage);
        navigate(-1);
        return;
      }

      console.log("✅ Media access granted - Tracks:", stream.getTracks().map(t => ({
        kind: t.kind,
        label: t.label,
        enabled: t.enabled,
        readyState: t.readyState
      })));

      localStreamRef.current = stream;

      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(e => console.error("Error playing local video:", e));
        console.log("✅ Local video displayed");
      }

      // Connect to socket
      setCallStatus("Connecting to server...");
      console.log("Connecting to socket...");
      
      socket = io(API_URL, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Socket connection timeout"));
        }, 10000);

        if (socket.connected) {
          clearTimeout(timeout);
          console.log("✅ Socket already connected:", socket.id);
          resolve();
        } else {
          socket.on('connect', () => {
            clearTimeout(timeout);
            console.log("✅ Socket connected:", socket.id);
            
            const userId = localStorage.getItem("userId");
            if (userId) {
              socket.emit("register-user", parseInt(userId));
              console.log("Registered user with socket:", userId);
            }
            
            resolve();
          });
          
          socket.on('connect_error', (error) => {
            clearTimeout(timeout);
            console.error("❌ Socket connection error:", error);
            reject(error);
          });
        }
      });

      // Setup WebRTC
      console.log("Setting up WebRTC peer connection...");
      setupPeerConnection(stream);

      // Setup socket listeners
      console.log("Setting up socket listeners...");
      setupSocketListeners();

      await new Promise(resolve => setTimeout(resolve, 300));

      // Initiate or accept call
      if (!state.isReceiver) {
        console.log("Acting as CALLER");
        setCallStatus("Calling...");
        await initiateCall();
      } else if (state.offer) {
        console.log("Acting as RECEIVER");
        setCallStatus("Accepting call...");
        await acceptCall();
      } else {
        throw new Error("Missing offer for receiver");
      }

    } catch (error: any) {
      console.error("❌ Error initializing call:", error);
      setCallStatus("Error: " + error.message);
      if (!permissionError) {
        alert("Failed to initialize call: " + error.message);
      }
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
    console.log("✅ Peer connection created");

    stream.getTracks().forEach((track) => {
      console.log("Adding track to peer connection:", track.kind, track.label);
      peerConnection!.addTrack(track, stream);
    });

    peerConnection.ontrack = (event) => {
      console.log("✅ Received remote track:", event.track.kind);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        remoteVideoRef.current.play().catch(e => console.error("Error playing remote video:", e));
        setCallStatus("Connected");
      }
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
      console.log("Connection state:", connState);
      
      if (connState === "connected") {
        setCallStatus("Connected");
      } else if (connState === "disconnected") {
        setCallStatus("Disconnected");
      } else if (connState === "failed") {
        setCallStatus("Connection failed");
        setTimeout(() => endCall(), 2000);
      }
    };
  };

  const setupSocketListeners = () => {
    socket.on("call-accepted", async ({ answer }) => {
      console.log("✅ Call accepted");
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
  };

  const initiateCall = async () => {
    if (!peerConnection) return;
    const offer = await peerConnection.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
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

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
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

  if (showPermissionHelp) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md bg-gray-900 rounded-2xl p-8 text-center">
          <AlertCircle size={64} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-4">Permission Required</h2>
          <p className="text-gray-400 mb-6 whitespace-pre-line text-left">{permissionError}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full transition font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="p-4 bg-gray-900 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{state?.friendName || "Unknown"}</h2>
          <p className="text-sm text-gray-400">{callStatus}</p>
        </div>
      </div>

      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-900"
        />

        {callStatus !== "Connected" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
              <p className="text-gray-400">{callStatus}</p>
              <p className="text-gray-500 text-sm mt-2">{state?.friendName}</p>
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg border-2 border-gray-700">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff size={32} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="p-6 bg-gray-900 flex justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition ${
            isMuted ? "bg-red-600 hover:bg-red-500" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition ${
            isVideoOff ? "bg-red-600 hover:bg-red-500" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-500 transition"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;