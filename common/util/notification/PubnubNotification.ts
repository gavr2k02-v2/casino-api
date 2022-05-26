import { INotification } from '../../types/misc/INotification';
import Pubnub from 'pubnub';

export class PubnubNotification<T> implements INotification<T> {
  private _pubnub: Pubnub;

  constructor(protected channel?: string) {
    this._pubnub = new Pubnub({
      publishKey: 'pub-c-1f2ce736-ed6a-40ec-a0e1-808832fe3807',
      subscribeKey: 'sub-c-853c8ce2-095a-11ec-8f04-0664d1b72b66',
      uuid: 'service',
    });
  }

  public async notify(message: T, channel?: string): Promise<void> {
    await this._pubnub.publish({ channel: channel || this.channel, message });
  }
}
