import { EventEmitter } from "node:events";

export class ConfirmChannelManager extends EventEmitter {
  constructor({ rabbitmq, logger }) {
    super();

    if (!rabbitmq) {
      throw new Error(
        "confirm channel manager required rabbitmq  connection manager"
      );
    }

    this.rabbitmq = rabbitmq;
    this.logger = logger ?? console;
    this._channel = null;
    this._connecting = false;
    this._connectWaiting = [];
  }

  async getGetChannel() {
    if (this._channel) return this._channel;
    if (this._connecting) {
      return new Promise((resolve, reject) => {
        this._connectWaiting.push({ resolve, reject });
      });
    }
    return this._connect();
  }

  async _connect() {
    this._connecting = true;
    try {
      let connection;

      if (this.rabbitmq.connection) {
        connection = this.rabbitmq.connection;
      } else {
        await this.rabbitmq.connect();

        if (!this.rabbitmq.connection) {
          throw new Error("failed to obtain rabbitmq new connection");
        }
        connection = this.rabbitmq.connection;
      }

      const confirmChannel = await connection.createConfirmChannel();

      confirmChannel.on("drain", () => this.emit("drain"));

      confirmChannel.on("close", () => {
        this._logger.warn(
          "[channelManager] confirm channel closed unexpectedly"
        );
        this._channel = null;
      });
      confirmChannel.on("error", (error) => {
        this._logger.warn(
          "[channelManager] confirm channel closed unexpectedly",
          { error: error.msg, stack: error.stack, code: error.code }
        );

        this._channel = null;
        this.emit("error", error);
      });

      this._channel = confirmChannel;
      this.logger.info("[channelManager] confirm channel ready");
      for (const w of this._connectWaiting) {
        w.resolve(confirmChannel);
      }
      this._connectWaiting = [];
      return confirmChannel;
    } catch (error) {
      for (const w of this._connectWaiting) {
        w.reject(error);
      }
      this._connectWaiting = [];
      return error;
    } finally {
      this._connecting = false;
    }
  }
}
