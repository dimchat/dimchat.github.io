;

//! require <dimsdk.js>
//! require 'app.js'

!function (ns) {
    'use strict';

    var NotificationCenter = ns.stargate.NotificationCenter;

    var nc = NotificationCenter.getInstance();

    nc.kNotificationStationConnecting = 'StationConnecting';
    nc.kNotificationStationConnected  = 'StationConnected';
    nc.kNotificationStationError      = 'StationError';
    nc.kNotificationHandshakeAccepted = 'HandshakeAccepted';
    nc.kNotificationMetaAccepted      = 'MetaAccepted';
    nc.kNotificationProfileUpdated    = 'ProfileUpdated';
    nc.kNotificationMessageReceived   = 'MessageReceived';

}(DIMP);

!function (ns) {
    'use strict';

    var Immortals = ns.Immortals;

    var facebook = ns.Facebook.getInstance();

    // patch for search number
    var getIdentifier = facebook.getIdentifier;
    facebook.getIdentifier = function (string) {
        var identifier = getIdentifier.call(this, string);
        if (identifier && this.ans && !this.ans.getIdentifier(string)) {
            this.ans.cache(String(identifier.getNumber()), identifier);
        }
        return identifier;
    };

    var force_ans = function (name, identifier) {
        identifier = facebook.getIdentifier(identifier);
        // cheat the reserved names checking
        var isReserved = facebook.ans.isReserved;
        facebook.ans.isReserved = function () {return false;};
        facebook.ans.save(name, identifier);
        facebook.ans.isReserved = isReserved;
    };

    var test_names = [
        'moki', Immortals.MOKI,
        'hulk', Immortals.HULK,

        'assistant', 'assistant@2PpB6iscuBjA15oTjAsiswoX9qis5V3c1Dq',
        'xiaoxiao', 'xiaoxiao@2PhVByg7PhEtYPNzW5ALk9ygf6wop1gTccp',
        'lingling', 'lingling@2PemMVAvxpuVZw2SYwwo11iBBEBb7gCvDHa',

        'station', 'gsp-s002@wpjUWg1oYDnkHh74tHQFPxii6q9j3ymnyW',

        'moky', 'moky@4DnqXWdTV8wuZgfqSCX9GjE2kNq7HJrUgQ',
        'baloo', 'baloo@4LA5FNbpxP38UresZVpfWroC2GVomDDZ7q',
        'zero', 'zero@4Zi2iyrcaT1oq4z44sjLVQZCEWSsE8nF8k',
        'long', 'long@4LJnk9AhRnvQF5SXDeDUzWGvi5whzToGJK',
        null
    ];
    for (var i = 0; i < test_names.length; i += 2) {
        force_ans(test_names[i], test_names[i+1]);
    }

}(DIMP);

!function (ns) {
    'use strict';

    var Meta = ns.Meta;

    var Server = ns.network.Server;

    var facebook = ns.Facebook.getInstance();
    var messenger = ns.Messenger.getInstance();
    var app = ns.Application.getInstance();

    var sid = 'gsp-s002@wpjUWg1oYDnkHh74tHQFPxii6q9j3ymnyW';
    sid = facebook.getIdentifier(sid);

    var meta = {
        "version": 1,
        "seed": "gsp-s002",
        "key": {
            "algorithm": "RSA",
            "data": "-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDACQ1bmv8V3xSCvVDWy+6P4pOl\n46MkIdKEqZ3Z+kvIrpStO/y5DZMWzTRx1z1Ateibc+QCUREaLvKqECycyRNPO+aD\n04rT5WxZfSuHxf+PxajDQ1rcwImc0JR/PbkUIgD5kb2JrsSfTaEObsrhxKlgimey\nOG9bwcmSud6HzPkWZQIDAQAB\n-----END PUBLIC KEY-----",
            "mode": "ECB",
            "padding": "PKCS1",
            "digest": "SHA256"
        },
        "fingerprint": "Z1HI27oXMvY5oOpA1HaD+6d4t8/tlGty5XU+6+CIkeij5m8xS1C4vRJm3qaLTxSRsnwX6mMgkvxMAu6FfvDWe4/cisWAWt8E+aC7BrgESVanQyglWZLx0OSWDmV1jrE9Y0xAA3HlgxIoMdi3sQ4giV0NxeJHUymGenC+EsbtiUU="
    };
    meta = Meta.getInstance(meta);
    facebook.saveMeta(meta, sid);

    // var host = '127.0.0.1';
    var host = '134.175.87.98'; // gz
    var port = 9394;

    var server = new Server(sid, host, port);
    facebook.cacheUser(server);
    server.stationDelegate = app;

    messenger.delegate = server;
    messenger.server = server;
    server.messenger = messenger;

}(DIMP);
