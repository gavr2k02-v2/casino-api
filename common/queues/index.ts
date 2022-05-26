import { Channel, connect } from 'amqplib';

export class QueueStorage {
  private _channel: Channel;

  constructor(private _name: string) {}

  async init() {
    const connection = await connect('amqp://localhost');
    this._channel = await connection.createChannel();
    await this._channel.assertQueue(this._name);
  }

  public async sendToQueue(message: string) {
    if (!this._channel) {
      await this.init();
    }

    this._channel.sendToQueue(this._name, Buffer.from(message));
  }

  public consume(callback: (message: string) => void) {
    this._channel.consume(this._name, (msg) => {
      if (!msg) {
        return;
      }

      callback(msg.content.toString());
      this._channel.ack(msg);
    });
  }
}

export const queuePayAnalytics = new QueueStorage('analytics');
