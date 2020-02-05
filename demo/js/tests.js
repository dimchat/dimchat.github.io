;
var facebook = DIMP.Facebook.getInstance();
var messenger = DIMP.Messenger.getInstance();

!function (ns) {
    'use strict';

    var ID = ns.ID;
    var Envelope = ns.Envelope;
    var InstantMessage = ns.InstantMessage;
    var QueryCommand = ns.protocol.group.QueryCommand;
    var SearchCommand = ns.protocol.SearchCommand;

    var Immortals = ns.Immortals;

    var sender = Immortals.HULK;
    var receiver = Immortals.MOKI;
    var name1 = facebook.getNickname(sender);
    var name2 = facebook.getNickname(receiver);

    app.write('sender: ', sender, ', nickname: ', name1);
    app.write('user: ', facebook.getUser(sender));
    app.write('receiver: ', receiver, ', nickname: ', name2);
    app.write('user: ', facebook.getUser(receiver));

    var gsp = facebook.getGroup(facebook.getIdentifier('gsp@pjKLrGZdnfnoZEQycbSjAUCkVG4ATzK9hs'));
    app.write('gsp: ', gsp);

    //
    //  Message
    //

    var group = ID.EVERYONE;
    app.write('group: ', group);
    app.write('founder: ', facebook.getFounder(group));
    app.write('owner: ', facebook.getOwner(group));

    group = new ID('Group-Naruto@7ThVZeDuQAdG3eSDF6NeFjMDPjKN5SbrnM');
    app.write('group: ', group);
    app.write('founder: ', facebook.getFounder(group));
    app.write('owner: ', facebook.getOwner(group));

    var env = Envelope.newEnvelope(sender, receiver);
    app.write('envelope: ', env);

    var query = new QueryCommand(group);
    app.write('query group info: ', query);

    var search = new SearchCommand('moky');
    app.write('search command: ', search);

    var msg = InstantMessage.newMessage(search, env);
    app.write('instant msg: ', msg);

}(DIMP);

!function (ns) {

    app.write('-------- Register --------');

    var NetworkType = ns.protocol.NetworkType;

    var Register = ns.extension.Register;

    // 1. create user
    var userRegister = new Register();
    var user = userRegister.createUser('moky', 'https://');
    app.write('user:', user.toString());
    app.write('meta: ', user.getMeta());
    app.write('profile: ', user.getProfile());

    // 2. create group
    var groupRegister = new Register(NetworkType.Polylogue);
    var group = groupRegister.createGroup('DIM Group', user.identifier);
    app.write('group:', group);
    app.write('meta: ', group.getMeta());
    app.write('profile: ', group.getProfile());

}(DIMP);

!function (ns) {

    app.write('-------- Password --------');

    var Base64 = ns.format.Base64;

    var Password = ns.extension.Password;

    //
    //  Password
    //

    var text = 'Hello world!';
    var password = '12345';
    var expect = 'Ty9C/v1XVW8IWbNxgpdg8Q==';

    var key1 = Password.generate(password);
    var key2 = Password.generate(password);
    app.write('key1: ' + key1);
    app.write('key2: ' + key2);

    if (key1.equals(key2)) {
        app.write('keys equal!');
    } else {
        app.write('keys not equal!');
    }

    var data = (new ns.type.String(text)).getBytes();
    var ciphertext = key1.encrypt(data);
    var plaintext = key2.decrypt(ciphertext);

    var base64 = Base64.encode(ciphertext);
    var res = new ns.type.String(plaintext);
    app.write(text, ' -> ', base64, ' -> ', res);

    if (base64 === expect) {
        app.write('AES ok!');
    } else {
        app.write('AES error!');
    }

}(DIMP);
