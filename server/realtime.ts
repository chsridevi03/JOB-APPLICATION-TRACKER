import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { db, JobApplication, JobStatus } from './db.js';

interface ClientConnection {
  ws: WebSocket;
  userId?: string;
  isAlive: boolean;
}

class RealtimeService {
  private wss: WebSocketServer | null = null;
  private clients: Set<ClientConnection> = new Set();

  init(server: HttpServer) {
    this.wss = new WebSocketServer({ server, path: '/ws' });

    this.wss.on('connection', (ws: WebSocket, req) => {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const userId = url.searchParams.get('userId') || 'usr_demo_101';

      const client: ClientConnection = { ws, userId, isAlive: true };
      this.clients.add(client);

      // Send welcome handshake
      ws.send(
        JSON.stringify({
          type: 'CONNECTED',
          message: 'Real-time WebSocket connection established',
          timestamp: new Date().toISOString(),
          userId,
        })
      );

      ws.on('pong', () => {
        client.isAlive = true;
      });

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'AUTH') {
            client.userId = data.userId;
            ws.send(JSON.stringify({ type: 'AUTH_SUCCESS', userId: data.userId }));
          } else if (data.type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG', timestamp: new Date().toISOString() }));
          }
        } catch {
          // ignore malformed client frames
        }
      });

      ws.on('close', () => {
        this.clients.delete(client);
      });

      ws.on('error', () => {
        this.clients.delete(client);
      });
    });

    // Heartbeat every 30 seconds
    const interval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }
        client.isAlive = false;
        client.ws.ping();
      });
    }, 30000);

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  broadcast(type: string, payload: any, targetUserId?: string) {
    const msg = JSON.stringify({ type, payload, timestamp: new Date().toISOString() });
    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        if (!targetUserId || client.userId === targetUserId) {
          client.ws.send(msg);
        }
      }
    });
  }

  // Trigger automated email notifications based on status change and user preferences
  handleStatusChangeNotifications(userId: string, app: JobApplication, prevStatus: JobStatus | 'Initial', newStatus: JobStatus) {
    const user = db.getUserById(userId);
    if (!user) return;

    const company = db.getCompanyById(userId, app.company_id);
    const companyName = company?.company_name || 'the company';
    const prefs = user.preferences || {
      email_on_selected: true,
      email_on_rejected: true,
      email_interview_reminder: true,
      interview_reminder_days: 2,
    };

    if (newStatus === 'Selected' && prefs.email_on_selected) {
      const notif = db.addNotification({
        user_id: userId,
        application_id: app.id,
        recipient_email: user.email,
        subject: `🎉 Congratulations! Selected for ${app.job_position} at ${companyName}`,
        body: `Wonderful news! Your application for "${app.job_position}" at ${companyName} has progressed to SELECTED. Please prepare your documentation and celebrate this achievement!`,
        trigger_type: 'status_selected',
      });
      this.broadcast('NOTIFICATION_NEW', notif, userId);
    } else if (newStatus === 'Rejected' && prefs.email_on_rejected) {
      const notif = db.addNotification({
        user_id: userId,
        application_id: app.id,
        recipient_email: user.email,
        subject: `Update on your application for ${app.job_position} at ${companyName}`,
        body: `Your application for "${app.job_position}" at ${companyName} has been marked as Rejected. Every application is a stepping stone—keep pushing forward!`,
        trigger_type: 'status_rejected',
      });
      this.broadcast('NOTIFICATION_NEW', notif, userId);
    } else if (newStatus === 'Interview' && app.interview_date && prefs.email_interview_reminder) {
      const notif = db.addNotification({
        user_id: userId,
        application_id: app.id,
        recipient_email: user.email,
        subject: `📅 Interview Scheduled: ${app.job_position} at ${companyName}`,
        body: `Your interview for "${app.job_position}" with ${companyName} is scheduled for ${app.interview_date}. A reminder will be sent ${prefs.interview_reminder_days} days in advance.`,
        trigger_type: 'interview_reminder',
      });
      this.broadcast('NOTIFICATION_NEW', notif, userId);
    }
  }
}

export const realtime = new RealtimeService();
