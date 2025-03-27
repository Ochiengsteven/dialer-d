import React, { createContext, useState, useEffect, useContext } from 'react';
import { callAPI } from '../services/api';
import { socketEvents, callFunctions } from '../services/socket';
import { initializeWebRTC, createOffer, cleanupWebRTC } from '../services/webrtc';
import { useAuth } from './AuthContext';

// Define call types
interface CallUser {
  id: string;
  username: string;
  gender: string;
}

interface Call {
  id: string;
  caller: CallUser;
  receiver: CallUser;
  status: 'pending' | 'active' | 'completed' | 'missed' | 'rejected';
  start_time?: string;
  end_time?: string;
  duration?: number;
  rating?: number;
  created_at: string;
}

interface IncomingCall {
  callId: string;
  caller: CallUser;
}

interface ActiveCall {
  callId: string;
  remoteUser: CallUser;
  isOutgoing: boolean;
  status: 'connecting' | 'connected' | 'ended';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

// Define call context type
interface CallContextType {
  callHistory: Call[];
  isLoadingHistory: boolean;
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  localStream: any;
  remoteStream: any;
  initiateCall: (receiverId: string) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  rateCall: (rating: number) => Promise<void>;
  refreshCallHistory: () => Promise<void>;
  error: string | null;
}

// Create call context
const CallContext = createContext<CallContextType>({
  callHistory: [],
  isLoadingHistory: false,
  incomingCall: null,
  activeCall: null,
  localStream: null,
  remoteStream: null,
  initiateCall: async () => {},
  acceptCall: async () => {},
  rejectCall: async () => {},
  endCall: async () => {},
  rateCall: async () => {},
  refreshCallHistory: async () => {},
  error: null,
});

// Call provider component
export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [callHistory, setCallHistory] = useState<Call[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load call history
  const loadCallHistory = async () => {
    if (!isAuthenticated) return;
    
    setIsLoadingHistory(true);
    
    try {
      const response = await callAPI.getCallHistory();
      
      if (response.status === 'success') {
        setCallHistory(response.data.calls);
      }
    } catch (error) {
      console.error('Error loading call history:', error);
      setError(error instanceof Error ? error.message : 'Failed to load call history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Refresh call history
  const refreshCallHistory = async () => {
    await loadCallHistory();
  };

  // Load call history on mount and when auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadCallHistory();
    } else {
      setCallHistory([]);
    }
  }, [isAuthenticated]);

  // Set up socket event listeners
  useEffect(() => {
    if (!isAuthenticated) return;
    
    // Incoming call
    const handleIncomingCall = (data: any) => {
      setIncomingCall({
        callId: data.callId,
        caller: data.caller,
      });
    };
    
    // Call initiated
    const handleCallInitiated = (data: any) => {
      setActiveCall({
        callId: data.callId,
        remoteUser: data.receiver,
        isOutgoing: true,
        status: 'connecting',
        startTime: new Date(),
      });
    };
    
    // Call accepted
    const handleCallAccepted = async (data: any) => {
      if (!activeCall) return;
      
      try {
        // Initialize WebRTC
        const { localStream: local, remoteStream: remote } = await initializeWebRTC(
          data.callId,
          data.receiver.id
        );
        
        setLocalStream(local);
        setRemoteStream(remote);
        
        // Create and send offer
        await createOffer(data.callId, data.receiver.id);
        
        // Update active call status
        setActiveCall({
          ...activeCall,
          status: 'connected',
        });
      } catch (error) {
        console.error('Error setting up WebRTC after call accepted:', error);
        setError('Failed to establish call connection');
        
        // End call if WebRTC setup fails
        callFunctions.endCall(data.callId);
      }
    };
    
    // Call connected
    const handleCallConnected = async (data: any) => {
      if (incomingCall) {
        try {
          // Initialize WebRTC
          const { localStream: local, remoteStream: remote } = await initializeWebRTC(
            data.callId,
            data.caller.id
          );
          
          setLocalStream(local);
          setRemoteStream(remote);
          
          // Update active call
          setActiveCall({
            callId: data.callId,
            remoteUser: data.caller,
            isOutgoing: false,
            status: 'connected',
            startTime: new Date(),
          });
          
          // Clear incoming call
          setIncomingCall(null);
        } catch (error) {
          console.error('Error setting up WebRTC after call connected:', error);
          setError('Failed to establish call connection');
          
          // End call if WebRTC setup fails
          callFunctions.endCall(data.callId);
        }
      }
    };
    
    // Call rejected
    const handleCallRejected = (data: any) => {
      if (activeCall && activeCall.callId === data.callId) {
        setActiveCall(null);
        cleanupWebRTC();
        setLocalStream(null);
        setRemoteStream(null);
      }
    };
    
    // Call ended
    const handleCallEnded = (data: any) => {
      if (activeCall && activeCall.callId === data.callId) {
        setActiveCall({
          ...activeCall,
          status: 'ended',
          endTime: new Date(),
          duration: data.duration,
        });
        
        // Clean up WebRTC after a short delay to allow for rating
        setTimeout(() => {
          cleanupWebRTC();
          setLocalStream(null);
          setRemoteStream(null);
          setActiveCall(null);
          
          // Refresh call history
          loadCallHistory();
        }, 5000);
      }
      
      if (incomingCall && incomingCall.callId === data.callId) {
        setIncomingCall(null);
      }
    };
    
    // Call error
    const handleCallError = (message: string) => {
      setError(message);
    };
    
    // Rating submitted
    const handleRatingSubmitted = (data: any) => {
      // Refresh call history
      loadCallHistory();
    };
    
    // Register event listeners
    socketEvents.on('incoming_call', handleIncomingCall);
    socketEvents.on('call_initiated', handleCallInitiated);
    socketEvents.on('call_accepted', handleCallAccepted);
    socketEvents.on('call_connected', handleCallConnected);
    socketEvents.on('call_rejected', handleCallRejected);
    socketEvents.on('call_ended', handleCallEnded);
    socketEvents.on('call_error', handleCallError);
    socketEvents.on('rating_submitted', handleRatingSubmitted);
    
    // Clean up event listeners on unmount
    return () => {
      socketEvents.removeListener('incoming_call', handleIncomingCall);
      socketEvents.removeListener('call_initiated', handleCallInitiated);
      socketEvents.removeListener('call_accepted', handleCallAccepted);
      socketEvents.removeListener('call_connected', handleCallConnected);
      socketEvents.removeListener('call_rejected', handleCallRejected);
      socketEvents.removeListener('call_ended', handleCallEnded);
      socketEvents.removeListener('call_error', handleCallError);
      socketEvents.removeListener('rating_submitted', handleRatingSubmitted);
    };
  }, [isAuthenticated, incomingCall, activeCall]);

  // Initiate call
  const initiateCall = async (receiverId: string) => {
    setError(null);
    
    if (!user) {
      setError('You must be logged in to make calls');
      return;
    }
    
    if (activeCall) {
      setError('You already have an active call');
      return;
    }
    
    // Initiate call via WebSocket
    callFunctions.initiateCall(receiverId);
  };

  // Accept call
  const acceptCall = async (callId: string) => {
    setError(null);
    
    if (!incomingCall) {
      setError('No incoming call to accept');
      return;
    }
    
    if (activeCall) {
      setError('You already have an active call');
      return;
    }
    
    // Accept call via WebSocket
    callFunctions.acceptCall(callId);
  };

  // Reject call
  const rejectCall = async (callId: string) => {
    setError(null);
    
    if (!incomingCall) {
      setError('No incoming call to reject');
      return;
    }
    
    // Reject call via WebSocket
    callFunctions.rejectCall(callId);
    setIncomingCall(null);
  };

  // End call
  const endCall = async () => {
    setError(null);
    
    if (!activeCall) {
      // Just clean up resources if there's no active call
      cleanupWebRTC();
      setLocalStream(null);
      setRemoteStream(null);
      return;
    }
    
    try {
      // End call via WebSocket
      callFunctions.endCall(activeCall.callId);
      
      // Update UI immediately to show the call is ending
      setActiveCall({
        ...activeCall,
        status: 'ended',
        endTime: new Date()
      });
      
      // Clean up resources after a short delay
      setTimeout(() => {
        cleanupWebRTC();
        setLocalStream(null);
        setRemoteStream(null);
        setActiveCall(null);
      }, 1000);
    } catch (error) {
      console.error('Error ending call:', error);
      // Force cleanup if there's an error
      cleanupWebRTC();
      setLocalStream(null);
      setRemoteStream(null);
      setActiveCall(null);
    }
  };

  // Rate call
  const rateCall = async (rating: number) => {
    setError(null);
    
    if (!activeCall || activeCall.status !== 'ended') {
      setError('No ended call to rate');
      return;
    }
    
    if (rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5');
      return;
    }
    
    // Rate call via WebSocket
    callFunctions.rateCall(activeCall.callId, rating);
  };

  // Call context value
  const value = {
    callHistory,
    isLoadingHistory,
    incomingCall,
    activeCall,
    localStream,
    remoteStream,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    rateCall,
    refreshCallHistory,
    error,
  };

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

// Custom hook to use call context
export const useCall = () => useContext(CallContext);

export default CallContext;
