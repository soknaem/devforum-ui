"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Client } from "@stomp/stompjs";

import { api, useMeQuery, type Notification } from "@/lib/api";
import {
  NOTIFICATIONS_QUEUE,
  RESOURCES_TOPIC,
  realtimeUrl,
  type RealtimeEvent,
} from "@/lib/realtime";
import { applyRealtimeEvent } from "@/features/realtime/handleRealtimeEvent";
import { newPostArrived, setConnected } from "@/features/realtime/realtimeSlice";
import { useAppDispatch } from "@/store/hooks";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/components/theme/ThemeProvider";
import { notificationHref } from "@/lib/notificationLink";

function parse<T>(body: string): T | null {
  try {
    return JSON.parse(body) as T;
  } catch {
    return null;
  }
}

/**
 * Keeps ONE WebSocket (STOMP) open while the user is signed in and feeds it into the app:
 *
 *   /user/queue/notifications -> unread badge + notification list refresh + a toast
 *   /topic/resources          -> live comment / reaction counters, edits, deletes, new posts
 *
 * The browser sends the HttpOnly access_token cookie with the handshake, so no token is handled
 * in JavaScript. It reconnects by itself (every 5 s) and, after an outage, refreshes what could
 * have been missed.
 */
export function RealtimeBridge() {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { data: me } = useMeQuery();
  const username = me?.data?.username;

  // Latest preference, read inside the socket callback (changing it must not reconnect the socket).
  const { prefs } = useTheme();
  const desktopRef = useRef(prefs.desktopNotifications);
  useEffect(() => {
    desktopRef.current = prefs.desktopNotifications;
  }, [prefs.desktopNotifications]);

  // Read inside the socket callback, so a navigation must not reconnect the socket.
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    // AuthGate already protects this layout. Do not wait for the /me query here:
    // that query can be delayed or briefly return an empty wrapper while the
    // HttpOnly session cookie is already valid. Waiting made the socket never
    // start in exactly that state.
    let connectedBefore = false;

    const client = new Client({
      brokerURL: realtimeUrl(),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        if (process.env.NODE_ENV === "development") {
          console.info("[realtime] connected", realtimeUrl());
        }
        dispatch(setConnected(true));

        client.subscribe(NOTIFICATIONS_QUEUE, (message) => {
          const notification = parse<Notification>(message.body);
          if (!notification) return;

          // Refreshes the unread badge and the notifications page.
          dispatch(api.util.invalidateTags(["Notification"]));

          // Opt-in system notification, only when the tab is in the background.
          if (
            desktopRef.current &&
            document.visibilityState === "hidden" &&
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
          ) {
            const popup = new Notification("DevForum", {
              body: notification.message,
              tag: String(notification.id),
            });
            popup.onclick = () => {
              window.focus();
              const href = notificationHref(notification);
              if (href) window.location.assign(href);
              popup.close();
            };
          }

          if (notification.type === "NEW_POST") {
            // Only people who follow the author receive this. On the home feed the small
            // "N new posts" pill is the alert; anywhere else a short toast is.
            const postId = notification.resourceId ?? notification.targetId;
            dispatch(newPostArrived(String(postId)));
            if (pathnameRef.current !== "/") toast(notification.message, "info");
          } else {
            toast(notification.message, "info");
          }
        });

        client.subscribe(RESOURCES_TOPIC, (message) => {
          const event = parse<RealtimeEvent>(message.body);
          if (event) applyRealtimeEvent(dispatch, event, username);
        });

        // Reconnected after an outage: anything pushed meanwhile was lost, so re-sync.
        if (connectedBefore) {
          dispatch(api.util.invalidateTags(["Notification", "Comment", "Reaction"]));
        }
        connectedBefore = true;
      },

      onWebSocketClose: () => dispatch(setConnected(false)),

      onWebSocketError: (event) => {
        console.warn("[realtime] WebSocket connection failed", event);
        dispatch(setConnected(false));
      },

      onStompError: (frame) => {
        console.warn("[realtime] STOMP error:", frame.headers["message"], frame.body);
      },
    });

    client.activate();

    return () => {
      dispatch(setConnected(false));
      void client.deactivate();
    };
  }, [username, dispatch, toast]);

  return null;
}
