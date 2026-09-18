import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import mqtt, { type MqttClient } from 'mqtt';

export interface NotificationMessage {
  type: 'TASK_CREATED' | 'TASK_UPDATED' | 'TASK_DELETED';
  userId: number;
  taskId: number;
  timestamp: string;
}

@Injectable()
export class MqttService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MqttService.name);
  private client: MqttClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('MQTT_URL') ?? 'mqtt://localhost:1883';
    this.client = mqtt.connect(url, {
      clientId: `backend-${Math.random().toString(16).slice(2, 10)}`,
      reconnectPeriod: 3000,
    });

    this.client.on('connect', () => this.logger.log(`MQTT connected to ${url}`));
    this.client.on('reconnect', () => this.logger.warn('MQTT reconnecting'));
    this.client.on('error', (error) => this.logger.error(`MQTT error: ${error.message}`));
    this.client.on('close', () => this.logger.warn('MQTT connection closed'));
  }

  async onModuleDestroy() {
    if (!this.client) return;
    await new Promise<void>((resolve) => {
      this.client!.end(true, undefined, () => resolve());
    });
    this.logger.log('MQTT disconnected');
  }

  publish(topic: string, payload: unknown): void {
    if (!this.client?.connected) {
      this.logger.warn(`MQTT not connected — message to "${topic}" dropped`);
      return;
    }
    this.client.publish(topic, JSON.stringify(payload));
  }

  notify(userId: number, message: Omit<NotificationMessage, 'userId' | 'timestamp'>): void {
    const payload: NotificationMessage = {
      ...message,
      userId,
      timestamp: new Date().toISOString(),
    };
    this.publish(`notifications/${userId}`, payload);
  }
}