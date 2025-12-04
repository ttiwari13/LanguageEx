import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";
import { io, Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface LocationState {
  friendId: number;
  friendName: string;
  isReceiver: boolean;
  offer?: RTCSessionDescriptionInit;
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
  const [callStatus, setCallStatus] = useState<string>("Connecting...");

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!state?.friendId || !state?.friendName) {
      console.error("Missing required state");
      navigate("/messages");
      return;
    }

    initializeCall();

    return () => {
      cleanup();
    };
  }, []);

  const initializeCall = async () => {
    try {
      // Initialize socket with API_URL
      socket = io(API_URL);
      const userId = localStorage.getItem("userId");
      if (userId) {
        socket.emit("user-online", parseInt(userId));
      }

      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Setup WebRTC
      setupPeerConnection(stream);

      // Setup socket listeners BEFORE initiating/accepting call
      setupSocketListeners();

      // Small delay to ensure socket listeners are ready
      await new Promise(resolve => setTimeout(resolve, 100));

      // If caller, initiate call
      if (!state.isReceiver) {
        await initiateCall();
      } else if (state.offer) {
        // If receiver, accept call
        await acceptCall();
      }
    } catch (error) {
      console.error("Error initializing call:", error);
      alert("Failed to access camera/microphone. Please check permissions.");
      navigate(-1);
    }
  };

  const setupPeerConnection = (stream: MediaStream) => {
    const configuration: RTCConfiguration = {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        // Free TURN server (consider getting your own for production)
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
    };

    peerConnection = new RTCPeerConnection(configuration);

    // Add local stream tracks
    stream.getTracks().forEach((track) => {
      peerConnection!.addTrack(track, stream);
    });

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log("Received remote track");
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setCallStatus("Connected");
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE candidate");
        socket.emit("ice-candidate", {
          targetUserId: state.friendId,
          candidate: event.candidate,
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log("Connection state:", peerConnection?.connectionState);
      if (peerConnection?.connectionState === "connected") {
        setCallStatus("Connected");
      } else if (peerConnection?.connectionState === "disconnected") {
        setCallStatus("Disconnected");
      } else if (peerConnection?.connectionState === "failed") {
        setCallStatus("Connection failed");
        setTimeout(() => endCall(), 2000);
      }
    };

    // Handle ICE connection state
    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peerConnection?.iceConnectionState);
    };
  };

  const setupSocketListeners = () => {
    // Listen for call acceptance
    socket.on("call-accepted", async ({ answer }: { answer: RTCSessionDescriptionInit }) => {
      console.log("Call accepted, setting remote description");
      try {
        if (peerConnection && answer) {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
          setCallStatus("Connected");
        }
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    });

    // Listen for ICE candidates
    socket.on("ice-candidate", async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      console.log("Received ICE candidate");
      try {
        if (peerConnection && candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    });

    // Listen for call rejection
    socket.on("call-rejected", () => {
      alert(`${state.friendName} declined your call`);
      endCall();
    });

    // Listen for call end
    socket.on("call-ended", () => {
      console.log("Call ended by other user");
      endCall();
    });

    // Listen for call failure
    socket.on("call-failed", ({ message }: { message: string }) => {
      alert(message || "Call failed");
      endCall();
    });

    // Listen for user offline
    socket.on("user-offline-call", () => {
      alert(`${state.friendName} is offline`);
      endCall();
    });
  };

  const initiateCall = async () => {
    try {
      setCallStatus("Calling...");

      if (!peerConnection) {
        console.error("Peer connection not initialized");
        return;
      }

      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await peerConnection.setLocalDescription(offer);

      const userId = localStorage.getItem("userId");
      console.log("Emitting call-user event");
      
      socket.emit("call-user", {
        callerId: parseInt(userId!),
        receiverId: state.friendId,
        chatRoomId: parseInt(chatRoomId!),
        offer,
      });
    } catch (error) {
      console.error("Error initiating call:", error);
      alert("Failed to initiate call");
      endCall();
    }
  };

  const acceptCall = async () => {
    try {
      setCallStatus("Accepting call...");

      if (!peerConnection || !state.offer) {
        console.error("Missing peer connection or offer");
        return;
      }

      await peerConnection.setRemoteDescription(new RTCSessionDescription(state.offer));

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      console.log("Emitting accept-call event");
      socket.emit("accept-call", {
        callerId: state.friendId,
        answer,
      });

      setCallStatus("Connected");
    } catch (error) {
      console.error("Error accepting call:", error);
      alert("Failed to accept call");
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

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    console.log("Ending call");
    
    if (socket && socket.connected) {
      socket.emit("end-call", {
        targetUserId: state.friendId,
        chatRoomId: chatRoomId,
      });
    }

    cleanup();
    navigate("/messages");
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }

    // Disconnect socket
    if (socket && socket.connected) {
      socket.disconnect();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="p-4 bg-gray-900 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{state?.friendName || "Unknown"}</h2>
          <p className="text-sm text-gray-400">{callStatus}</p>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-900"
        />

        {/* Placeholder when no remote video */}
        {callStatus === "Calling..." && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-700 rounded-full flex items-center justify-center">
                <Video size={40} className="text-gray-400" />
              </div>
              <p className="text-gray-400">Calling {state?.friendName}...</p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
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

      {/* Controls */}
      <div className="p-6 bg-gray-900 flex justify-center gap-4">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition ${
            isMuted ? "bg-red-600 hover:bg-red-500" : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-4 rounded-full transition ${
            isVideoOff ? "bg-red-600 hover:bg-red-500" : "bg-gray-700 hover:bg-gray-600"
          }`}
          title={isVideoOff ? "Turn on video" : "Turn off video"}
        >
          {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
        </button>

        <button
          onClick={endCall}
          className="p-4 rounded-full bg-red-600 hover:bg-red-500 transition"
          title="End call"
        >
          <PhoneOff size={24} />
        </button>
      </div>
    </div>
  );
};

export default VideoCallPage;