import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef(null);
  
  const messageListeners = useRef(new Set());
  const notificationListeners = useRef(new Set());

  useEffect(() => {
    if (!user) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      setConnected(false);
      return;
    }

    // Initialize STOMP client with SockJS
    const socket = new SockJS((import.meta.env.VITE_API_BASE_URL || '') + '/ws');
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => {
        // console.log(str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      setConnected(true);

      // Subscribe to private DM queue
      client.subscribe('/user/queue/messages', (message) => {
        const payload = JSON.parse(message.body);
        messageListeners.current.forEach((cb) => cb(payload));
      });

      // Subscribe to notifications queue
      client.subscribe('/user/queue/notifications', (notification) => {
        const payload = JSON.parse(notification.body);
        notificationListeners.current.forEach((cb) => cb(payload));
      });
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    client.onStompError = (frame) => {
      // console.error('Broker reported error: ' + frame.headers['message']);
      // console.error('Additional details: ' + frame.body);
    };

    client.activate();
    stompClientRef.current = client;

    return () => {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
    };
  }, [user]);

  const subscribeToMessages = (callback) => {
    messageListeners.current.add(callback);
    return () => {
      messageListeners.current.delete(callback);
    };
  };

  const subscribeToNotifications = (callback) => {
    notificationListeners.current.add(callback);
    return () => {
      notificationListeners.current.delete(callback);
    };
  };

  const sendMessage = (destination, body) => {
    if (stompClientRef.current && stompClientRef.current.connected) {
      stompClientRef.current.publish({
        destination,
        body: JSON.stringify(body)
      });
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, subscribeToMessages, subscribeToNotifications, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
