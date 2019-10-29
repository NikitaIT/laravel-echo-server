var Redis = require('ioredis');
import { Log } from './../log';
import { Subscriber } from './subscriber';
import { unzipSync } from 'zlib';

export class RedisSubscriber implements Subscriber {
    /**
     * Redis pub/sub client.
     *
     * @type {object}
     */
    private _redis: any;

    /**
     * Create a new instance of subscriber.
     *
     * @param {any} options
     */
    constructor(private options) {
        this._redis = new Redis(options.databaseConfig.redis);
    }

    /**
     * Subscribe to events to broadcast.
     *
     * @return {Promise<any>}
     */
    subscribe(callback): Promise<any> {

        return new Promise((resolve, reject) => {
            this._redis.on('pmessage', (subscribed, channel, message) => {
                try {
                    if (this.options.devMode) {
                        Log.info(JSON.stringify(message));
                    }
                    message = JSON.parse(message);
                    if (this.options.devMode) {
                        Log.info("Channel: " + channel);
                        Log.info("Event: " + message.event);
                    }
                    if (this.options.compressedPayload) {
                        const data = unzipSync(message.data, { level: 9 }).toString();
                        const dataJSON = JSON.parse(data);
                        if (this.options.devMode) {
                            Log.info("Event data unziped string: " + data);
                            Log.info("Event data JSON: " + dataJSON);
                        }
                        message.data = dataJSON;
                    }

                    callback(channel, message);
                } catch (e) {
                    if (this.options.devMode) {
                        Log.info("No JSON message");
                    }
                }
            });

            this._redis.psubscribe('*', (err, count) => {
                if (err) {
                    reject('Redis could not subscribe.')
                }

                Log.success('Listening for redis events...');

                resolve();
            });
        });
    }
}
