// Import WebRTC conditionally to handle Expo Go environment
let RTCPeerConnection: any;
let RTCSessionDescription: any;
let RTCIceCandidate: any;
let mediaDevices: any;

// Flag to track if we've already shown the WebRTC warning
let webRTCWarningShown = false;

// Check if WebRTC is available
const isWebRTCAvailable = () => {
  try {
    const webrtc = require('react-native-webrtc');
    RTCPeerConnection = webrtc.RTCPeerConnection;
    RTCSessionDescription = webrtc.RTCSessionDescription;
    RTCIceCandidate = webrtc.RTCIceCandidate;
    mediaDevices = webrtc.mediaDevices;
    return true;
  } catch (error) {
    // Only show the warning once to avoid console spam
    if (!webRTCWarningShown) {
      console.warn('WebRTC is not available in this environment (likely Expo Go). Call functionality will be limited.');
      webRTCWarningShown = true;
    }
    return false;
  }
};
import { socketEvents, callFunctions } from './socket';

// ICE servers for WebRTC connection
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// WebRTC peer connection
let peerConnection: RTCPeerConnection | null = null;
let localStream: any = null;
let remoteStream: any = null;

// Initialize WebRTC connection
export const initializeWebRTC = async (callId: string, remoteUserId: string) => {
  try {
    // Check if WebRTC is available
    if (!isWebRTCAvailable()) {
      // Return mock streams for Expo Go environment
      // This allows the call UI to work without actual WebRTC functionality
      return {
        localStream: { mock: true },
        remoteStream: { mock: true },
      };
    }
    
    // Create new peer connection
    peerConnection = new RTCPeerConnection(iceServers);
    
    try {
      // Get local media stream
      localStream = await mediaDevices.getUserMedia({
        audio: true,
        video: false, // Audio-only for better performance
      });
    } catch (mediaError) {
      console.warn('Could not access media devices:', mediaError);
      // Create mock stream if media access fails
      localStream = { mock: true };
    }
    
    // Create remote stream if WebRTC is available
    try {
      remoteStream = new MediaStream();
    } catch (error) {
      console.warn('Could not create MediaStream:', error);
      remoteStream = { mock: true };
    }
    
    // Add local tracks to peer connection if not using mock stream
    if (localStream && !localStream.mock && peerConnection) {
      try {
        localStream.getTracks().forEach((track: any) => {
          peerConnection?.addTrack(track, localStream);
        });
      } catch (error) {
        console.warn('Error adding tracks to peer connection:', error);
      }
    }
    
        // Handle ICE candidates
    if (peerConnection) {
      peerConnection.addEventListener('icecandidate', (event: any) => {
        if (event.candidate) {
          // Send ICE candidate to remote peer
          callFunctions.sendSignal(
            callId,
            { type: 'candidate', candidate: event.candidate },
            remoteUserId
          );
        }
      });
    }
    
        // Handle connection state changes
    if (peerConnection) {
      peerConnection.addEventListener('connectionstatechange', () => {
        console.log('Connection state:', peerConnection?.connectionState);
      });
      
      // Handle ICE connection state changes
      peerConnection.addEventListener('iceconnectionstatechange', () => {
        console.log('ICE connection state:', peerConnection?.iceConnectionState);
      });
    }
    
    // Handle tracks from remote peer
    if (peerConnection) {
      peerConnection.addEventListener('track', (event: any) => {
        if (event.streams && event.streams[0] && remoteStream) {
          event.streams[0].getTracks().forEach((track: any) => {
            remoteStream.addTrack(track);
          });
        }
      });
    }
    
    // Set up signal event handler
    socketEvents.on('signal', handleSignal);
    
    return {
      localStream,
      remoteStream,
    };
  } catch (error) {
    console.error('Error initializing WebRTC:', error);
    cleanupWebRTC();
    throw error;
  }
};

// Create and send offer to remote peer
export const createOffer = async (callId: string, remoteUserId: string) => {
  try {
    // Check if WebRTC is available
    if (!isWebRTCAvailable() || !peerConnection) {
      console.warn('WebRTC is not available or peer connection not initialized');
      return;
    }
    
    // Create offer
    if (peerConnection) {
      const offer = await peerConnection.createOffer({});
      
      // Set local description
      await peerConnection.setLocalDescription(offer);
      
      // Send offer to remote peer
      callFunctions.sendSignal(
        callId,
        { type: 'offer', sdp: peerConnection.localDescription },
        remoteUserId
      );
    }
  } catch (error) {
    console.error('Error creating offer:', error);
    throw error;
  }
};

// Handle incoming WebRTC signals
const handleSignal = async (data: any) => {
  try {
    // Check if WebRTC is available
    if (!isWebRTCAvailable()) {
      // In Expo Go, just acknowledge signals without processing them
      // This allows the call UI to work without actual WebRTC functionality
      console.log('Received signal in Expo Go environment, simulating processing');
      return;
    }
    
    // Check if peer connection exists
    if (!peerConnection) {
      console.warn('Peer connection not initialized, cannot process signal');
      return;
    }
    
    const { callId, signal, from } = data;
    
    if (signal.type === 'offer' && peerConnection) {
      try {
        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        
        // Create answer
        const answer = await peerConnection.createAnswer();
        
        // Set local description
        await peerConnection.setLocalDescription(answer);
        
        // Send answer to remote peer
        callFunctions.sendSignal(
          callId,
          { type: 'answer', sdp: peerConnection.localDescription },
          from
        );
      } catch (error) {
        console.warn('Error processing offer:', error);
      }
    } else if (signal.type === 'answer' && peerConnection) {
      try {
        // Set remote description
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      } catch (error) {
        console.warn('Error processing answer:', error);
      }
    } else if (signal.type === 'candidate' && peerConnection) {
      try {
        // Add ICE candidate
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
      } catch (error) {
        console.warn('Error processing ICE candidate:', error);
      }
    }
  } catch (error) {
    console.error('Error handling signal:', error);
  }
};

// Clean up WebRTC resources
export const cleanupWebRTC = () => {
  try {
    // Stop local stream tracks if not a mock stream
    if (localStream && !localStream.mock) {
      try {
        localStream.getTracks().forEach((track: any) => {
          track.stop();
        });
      } catch (error) {
        console.warn('Error stopping tracks:', error);
      }
    }
    
    // Close peer connection if it exists
    if (peerConnection) {
      try {
        peerConnection.close();
      } catch (error) {
        console.warn('Error closing peer connection:', error);
      }
    }
    
    // Remove signal event handler
    try {
      socketEvents.removeListener('signal', handleSignal);
    } catch (error) {
      console.warn('Error removing signal listener:', error);
    }
    
    // Reset variables
    peerConnection = null;
    localStream = null;
    remoteStream = null;
    
    console.log('WebRTC resources cleaned up');
  } catch (error) {
    console.error('Error cleaning up WebRTC:', error);
  } finally {
    // Always ensure these are reset
    peerConnection = null;
    localStream = null;
    remoteStream = null;
  }
};

export default {
  initializeWebRTC,
  createOffer,
  cleanupWebRTC,
};
