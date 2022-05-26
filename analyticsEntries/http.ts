import { queuePayAnalytics } from '../common/queues';
import { SpinAnalyticsPayload } from '../common/queues/types';
import { GameId } from '../common/types/games/enums/GameID';
import { User } from '../common/types/user/User';
import { PubnubNotification } from '../common/util/notification/PubnubNotification';
import { mongoClient } from '../common/util/storages/mongo';
import { SpinHistory } from '../history/common/types/SpinHistory';

export default async function () {
  queuePayAnalytics.consume(sendToStorage);
}

async function sendToStorage(msg: string) {
  const collection = await mongoClient.getCollection('analytics');
  const data = JSON.parse(msg);
  await notify(data);
  await collection.insertOne(data);
}

async function notify(data: SpinAnalyticsPayload) {
  const service = new PubnubNotification();
  const collection = await mongoClient.getCollection('users');

  const user = (await collection.findOne(
    { uid: data.userId },
    { projection: { _id: 0, username: 1 } },
  )) as unknown as User;

  const message: SpinHistory = {
    action: data.action as GameId,
    amount: data.amount,
    time: data.time,
    username: user.name,
  };

  await service.notify(message, `live-spines`);
}
