import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@/contexts/AuthContext';
import { useCall } from '@/contexts/CallContext';

interface User {
  id: string;
  username: string;
  gender: string;
}

function HomeScreen() {
  const { user, isAuthenticated, logout } = useAuth();
  
  // Handle authentication redirect
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated) {
        // Delay navigation to prevent "navigation before mounting" errors
        const timer = setTimeout(() => {
          router.replace('/auth/login');
        }, 100);
        return () => clearTimeout(timer);
      }
    }, [isAuthenticated])
  );
  const { 
    callHistory, 
    isLoadingHistory, 
    refreshCallHistory, 
    initiateCall,
    incomingCall,
    activeCall,
    acceptCall,
    rejectCall,
    endCall,
    rateCall
  } = useCall();
  
  const [receiverId, setReceiverId] = useState('');
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login' as any);
    }
  }, [isAuthenticated]);

  // Handle incoming call
  useEffect(() => {
    if (incomingCall) {
      Alert.alert(
        'Incoming Call',
        `${incomingCall.caller.username} is calling you`,
        [
          {
            text: 'Reject',
            onPress: () => rejectCall(incomingCall.callId),
            style: 'cancel',
          },
          {
            text: 'Accept',
            onPress: () => acceptCall(incomingCall.callId),
          },
        ],
        { cancelable: false }
      );
    }
  }, [incomingCall, acceptCall, rejectCall]);

  // Handle active call ending
  useEffect(() => {
    if (activeCall && activeCall.status === 'ended') {
      setShowRating(true);
    } else {
      setShowRating(false);
    }
  }, [activeCall]);

  // Handle call initiation
  const handleInitiateCall = () => {
    if (!receiverId) {
      Alert.alert('Error', 'Please enter a user ID to call');
      return;
    }

    initiateCall(receiverId);
  };

  // Handle call rating
  const handleRateCall = (selectedRating: number) => {
    setRating(selectedRating);
    rateCall(selectedRating);
    setShowRating(false);
  };

  // Fill test user ID
  const fillTestUser1 = () => {
    setReceiverId('3ae982e6-8766-47b5-811f-a3478309f38a'); // Friend76122
  };

  const fillTestUser2 = () => {
    setReceiverId('78db33fb-c54e-4860-aaa9-33134cc671e6'); // Member53165
  };

  // Render call history item
  const renderCallItem = ({ item }: { item: any }) => {
    const isOutgoing = item.caller.id === user?.id;
    const otherUser = isOutgoing ? item.receiver : item.caller;
    const callIcon = isOutgoing ? 'call-outline' : 'call-sharp';
    const callStatusColor = 
      item.status === 'completed' ? '#4CAF50' : 
      item.status === 'rejected' ? '#F44336' : 
      item.status === 'missed' ? '#FF9800' : '#2196F3';

    return (
      <ThemedView style={styles.callItem}>
        <ThemedView style={styles.callIconContainer}>
          <Ionicons name={callIcon} size={24} color={callStatusColor} />
        </ThemedView>
        <ThemedView style={styles.callDetails}>
          <ThemedText style={styles.callUser}>{otherUser.username}</ThemedText>
          <ThemedText style={styles.callStatus}>
            {isOutgoing ? 'Outgoing' : 'Incoming'} · {item.status} 
            {item.duration ? ` · ${item.duration}s` : ''}
          </ThemedText>
        </ThemedView>
        <ThemedText style={styles.callTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </ThemedText>
      </ThemedView>
    );
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText type="title">Drunk Dial</ThemedText>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={24} color="#F44336" />
        </TouchableOpacity>
      </ThemedView>

      {/* User Info */}
      <ThemedView style={styles.userInfoContainer}>
        <ThemedView style={styles.avatarContainer}>
          <ThemedText style={styles.avatarText}>
            {user?.username.charAt(0).toUpperCase()}
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.userDetails}>
          <ThemedText style={styles.username}>{user?.username}</ThemedText>
          <ThemedText style={styles.email}>{user?.email}</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Active Call */}
      {activeCall && (
        <ThemedView style={styles.activeCallContainer}>
          <ThemedText style={styles.activeCallTitle}>
            {activeCall.status === 'connecting' ? 'Connecting...' : 
             activeCall.status === 'connected' ? 'On Call' : 'Call Ended'}
          </ThemedText>
          <ThemedText style={styles.activeCallUser}>
            {activeCall.remoteUser.username}
          </ThemedText>
          {(activeCall.status === 'connected' || activeCall.status === 'connecting') && (
            <TouchableOpacity 
              style={[styles.endCallButton, activeCall.status === 'connecting' ? styles.cancelCallButton : null]} 
              onPress={endCall}
            >
              <Ionicons name={activeCall.status === 'connecting' ? "close-circle" : "call"} size={24} color="#fff" />
              <ThemedText style={styles.endCallText}>
                {activeCall.status === 'connecting' ? 'Cancel' : 'End'}
              </ThemedText>
            </TouchableOpacity>
          )}
        </ThemedView>
      )}

      {/* Rating UI */}
      {showRating && (
        <ThemedView style={styles.ratingContainer}>
          <ThemedText style={styles.ratingTitle}>Rate the call</ThemedText>
          <ThemedView style={styles.ratingButtons}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                style={styles.ratingButton}
                onPress={() => handleRateCall(star)}
              >
                <ThemedText style={styles.ratingButtonText}>{star}</ThemedText>
              </TouchableOpacity>
            ))}
          </ThemedView>
        </ThemedView>
      )}

      {/* Make Call */}
      <ThemedView style={styles.makeCallContainer}>
        <ThemedText style={styles.makeCallTitle}>Make a Call</ThemedText>
        <TextInput
          style={styles.receiverInput}
          value={receiverId}
          onChangeText={setReceiverId}
          placeholder="Enter User ID to call"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.callButton} onPress={handleInitiateCall}>
          <ThemedText style={styles.callButtonText}>Start Call</ThemedText>
        </TouchableOpacity>

        {/* Test User Buttons */}
        <ThemedView style={styles.testUsersContainer}>
          <ThemedText style={styles.testUsersTitle}>Test Users</ThemedText>
          <ThemedView style={styles.testUserButtons}>
            <TouchableOpacity style={styles.testUserButton} onPress={fillTestUser1}>
              <ThemedText style={styles.testUserText}>Friend76122</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.testUserButton} onPress={fillTestUser2}>
              <ThemedText style={styles.testUserText}>Member53165</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ThemedView>

      {/* Call History */}
      <ThemedView style={styles.callHistoryContainer}>
        <ThemedView style={styles.callHistoryHeader}>
          <ThemedText style={styles.callHistoryTitle}>Call History</ThemedText>
          <TouchableOpacity onPress={refreshCallHistory}>
            <Ionicons name="refresh" size={20} color="#4CAF50" />
          </TouchableOpacity>
        </ThemedView>
        
        {isLoadingHistory ? (
          <ActivityIndicator size="large" color="#4CAF50" style={styles.loader} />
        ) : callHistory.length > 0 ? (
          <FlatList
            data={callHistory}
            renderItem={renderCallItem}
            keyExtractor={(item) => item.id}
            style={styles.callList}
          />
        ) : (
          <ThemedView style={styles.emptyCallHistory}>
            <ThemedText style={styles.emptyCallHistoryText}>
              No call history yet
            </ThemedText>
          </ThemedView>
        )}
      </ThemedView>
    </ThemedView>
  );
}

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoutButton: {
    padding: 8,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.7,
  },
  activeCallContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#2196F3',
    marginBottom: 20,
    alignItems: 'center',
  },
  activeCallTitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  activeCallUser: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  endCallButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelCallButton: {
    backgroundColor: '#FF9800',
  },
  endCallText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  ratingContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 20,
    alignItems: 'center',
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  ratingButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  makeCallContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 20,
  },
  makeCallTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  receiverInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  callButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testUsersContainer: {
    marginTop: 8,
  },
  testUsersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  testUserButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  testUserButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  testUserText: {
    fontSize: 14,
  },
  callHistoryContainer: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 16,
  },
  callHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  callHistoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 20,
  },
  callList: {
    flex: 1,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  callIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  callDetails: {
    flex: 1,
  },
  callUser: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  callStatus: {
    fontSize: 14,
    opacity: 0.7,
  },
  callTime: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyCallHistory: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCallHistoryText: {
    fontSize: 16,
    opacity: 0.7,
  },
});
