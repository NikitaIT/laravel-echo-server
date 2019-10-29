"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Redis = require('ioredis');
var log_1 = require("./../log");
var zlib_1 = require("zlib");
var RedisSubscriber = (function () {
    function RedisSubscriber(options) {
        this.options = options;
        this._redis = new Redis(options.databaseConfig.redis);
    }
    RedisSubscriber.prototype.subscribe = function (callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._redis.on('pmessage', function (subscribed, channel, message) {
                try {
                    if (_this.options.devMode) {
                        log_1.Log.info(JSON.stringify(message));
                    }
                    message = JSON.parse(message);
                    if (_this.options.devMode) {
                        log_1.Log.info("Channel: " + channel);
                        log_1.Log.info("Event: " + message.event);
                    }
                    if (_this.options.compressedPayload) {
                        var data = zlib_1.unzipSync(message.data, { level: 9 }).toString();
                        var dataJSON = JSON.parse(data);
                        if (_this.options.devMode) {
                            log_1.Log.info("Event data unziped string: " + data);
                            log_1.Log.info("Event data JSON: " + dataJSON);
                        }
                        message.data = dataJSON;
                    }
                    callback(channel, message);
                }
                catch (e) {
                    if (_this.options.devMode) {
                        log_1.Log.info("No JSON message");
                    }
                }
            });
            _this._redis.psubscribe('*', function (err, count) {
                if (err) {
                    reject('Redis could not subscribe.');
                }
                log_1.Log.success('Listening for redis events...');
                resolve();
            });
        });
    };
    return RedisSubscriber;
}());
exports.RedisSubscriber = RedisSubscriber;
