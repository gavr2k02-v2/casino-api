export interface INotification<T> {
  notify(message: T): Promise<void>;
}
