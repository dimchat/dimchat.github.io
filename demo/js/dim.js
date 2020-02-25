/**
 *  DIM-Client (v0.1.0)
 *  (DIMP: Decentralized Instant Messaging Protocol)
 *
 * @author    moKy <albert.moky at gmail.com>
 * @date      Feb. 25, 2020
 * @copyright (c) 2020 Albert Moky
 * @license   {@link https://mit-license.org | MIT License}
 */;
! function(ns) {
    var Command = ns.protocol.Command;
    var SearchCommand = function(info) {
        var keywords = null;
        if (!info) {
            info = SearchCommand.ONLINE_USERS
        } else {
            if (typeof info === "string") {
                if (info !== SearchCommand.SEARCH && info !== SearchCommand.ONLINE_USERS) {
                    keywords = info;
                    info = SearchCommand.SEARCH
                }
            }
        }
        Command.call(this, info);
        if (keywords) {
            this.setKeywords(keywords)
        }
    };
    ns.Class(SearchCommand, Command, null);
    SearchCommand.SEARCH = "search";
    SearchCommand.ONLINE_USERS = "users";
    SearchCommand.prototype.setKeywords = function(keywords) {
        this.setValue("keywords", keywords)
    };
    SearchCommand.prototype.getUsers = function() {
        return this.getValue("users")
    };
    SearchCommand.prototype.getResults = function() {
        return this.getValue("results")
    };
    Command.register(SearchCommand.SEARCH, SearchCommand);
    Command.register(SearchCommand.ONLINE_USERS, SearchCommand);
    ns.protocol.SearchCommand = SearchCommand
}(DIMP);
! function(ns) {
    var ContentType = ns.protocol.ContentType;
    var TextContent = ns.protocol.TextContent;
    var FileContent = ns.protocol.FileContent;
    var ImageContent = ns.protocol.ImageContent;
    var AudioContent = ns.protocol.AudioContent;
    var VideoContent = ns.protocol.VideoContent;
    var PageContent = ns.protocol.PageContent;
    var ReceiptCommand = ns.protocol.ReceiptCommand;
    var ContentProcessor = ns.cpu.ContentProcessor;
    var NotificationCenter = ns.stargate.NotificationCenter;
    var DefaultContentProcessor = ns.cpu.DefaultContentProcessor;
    var process = DefaultContentProcessor.prototype.process;
    DefaultContentProcessor.prototype.process = function(content, sender, msg) {
        var text;
        if (content instanceof FileContent) {
            if (content instanceof ImageContent) {
                text = "Image received"
            } else {
                if (content instanceof AudioContent) {
                    text = "Voice message received"
                } else {
                    if (content instanceof VideoContent) {
                        text = "Movie received"
                    } else {
                        text = "File received"
                    }
                }
            }
        } else {
            if (content instanceof TextContent) {
                text = "Text message received"
            } else {
                if (content instanceof PageContent) {
                    text = "Web page received"
                } else {
                    return process.call(this, content, sender, msg)
                }
            }
        }
        var nc = NotificationCenter.getInstance();
        nc.postNotification(nc.kNotificationMessageReceived, this, msg);
        var group = content.getGroup();
        if (group) {
            return null
        }
        var res = new ReceiptCommand(content.sn);
        res.setMessage(text);
        res.setEnvelope(msg.envelope);
        return res
    };
    ContentProcessor.register(ContentType.UNKNOWN, DefaultContentProcessor);
    ns.cpu.DefaultContentProcessor = DefaultContentProcessor;
    var GroupCommand = ns.protocol.GroupCommand;
    var InviteCommand = ns.protocol.group.InviteCommand;
    var ExpelCommand = ns.protocol.group.ExpelCommand;
    var QuitCommand = ns.protocol.group.QuitCommand;
    var ResetCommand = ns.protocol.group.ResetCommand;
    var QueryCommand = ns.protocol.group.QueryCommand;
    var getFacebook = function() {
        return ns.Facebook.getInstance()
    };
    var getUsername = function(string) {
        return getFacebook().getUsername(string)
    };
    var MessageBuilder = {
        getContentText: function(content) {
            if (content instanceof FileContent) {
                if (content instanceof ImageContent) {
                    return "[Image:" + content.getFilename() + "]"
                }
                if (content instanceof AudioContent) {
                    return "[Voice:" + content.getFilename() + "]"
                }
                if (content instanceof VideoContent) {
                    return "[Movie:" + content.getFilename() + "]"
                }
                return "[File:" + content.getFilename() + "]"
            }
            if (content instanceof TextContent) {
                return content.getText()
            }
            if (content instanceof PageContent) {
                return "[File:" + content.getURL() + "]"
            }
            var type = content.type.toLocaleString();
            return "Current version doesn't support this message type: " + type
        },
        getCommandText: function(cmd, commander) {
            if (cmd instanceof GroupCommand) {
                return this.getGroupCommandText(cmd, commander)
            }
            return "Current version doesn't support this command: " + cmd.getCommand()
        },
        getGroupCommandText: function(cmd, commander) {
            var text = cmd.getValue("text");
            if (text) {
                return text
            }
            if (cmd instanceof InviteCommand) {
                return this.getInviteCommandText(cmd, commander)
            }
            if (cmd instanceof ExpelCommand) {
                return this.getExpelCommandText(cmd, commander)
            }
            if (cmd instanceof QuitCommand) {
                return this.getQuitCommandText(cmd, commander)
            }
            if (cmd instanceof ResetCommand) {
                return this.getResetCommandText(cmd, commander)
            }
            if (cmd instanceof QueryCommand) {
                return this.getQueryCommandText(cmd, commander)
            }
            throw Error("unsupported group command: " + cmd)
        },
        getInviteCommandText: function(cmd, commander) {
            var addedList = cmd.getValue("added");
            if (!addedList || addedList.length === 0) {
                return null
            }
            var names = [];
            for (var i = 0; i < addedList.length; ++i) {
                names.push(getUsername(addedList[i]))
            }
            var text = getUsername(commander) + " has invited members: " + names.join(", ");
            cmd.setValue("text", text);
            return text
        },
        getExpelCommandText: function(cmd, commander) {
            var removedList = cmd.getValue("removed");
            if (!removedList || removedList.length === 0) {
                return null
            }
            var names = [];
            for (var i = 0; i < removedList.length; ++i) {
                names.push(getUsername(removedList[i]))
            }
            var text = getUsername(commander) + " has removed members: " + names.join(", ");
            cmd.setValue("text", text);
            return text
        },
        getQuitCommandText: function(cmd, commander) {
            var text = getUsername(commander) + " has quit group chat.";
            cmd.setValue("text", text);
            return text
        },
        getResetCommandText: function(cmd, commander) {
            var text = getUsername(commander) + " has updated members";
            var i, names;
            var removedList = cmd.getValue("removed");
            if (removedList && removedList.length > 0) {
                names = [];
                for (i = 0; i < removedList.length; ++i) {
                    names.push(getUsername(removedList[i]))
                }
                text += ", removed: " + names.join(", ")
            }
            var addedList = cmd.getValue("added");
            if (addedList && addedList.length > 0) {
                names = [];
                for (i = 0; i < addedList.length; ++i) {
                    names.push(getUsername(addedList[i]))
                }
                text += ", added: " + names.join(", ")
            }
            cmd.setValue("text", text);
            return text
        },
        getQueryCommandText: function(cmd, commander) {
            var text = getUsername(commander) + " was querying group info, responding...";
            cmd.setValue("text", text);
            return text
        }
    };
    ns.cpu.MessageBuilder = MessageBuilder
}(DIMP);
! function(ns) {
    var Command = ns.protocol.Command;
    var HandshakeCommand = ns.protocol.HandshakeCommand;
    var CommandProcessor = ns.cpu.CommandProcessor;
    var HandshakeCommandProcessor = function(messenger) {
        CommandProcessor.call(this, messenger)
    };
    ns.Class(HandshakeCommandProcessor, CommandProcessor, null);
    var success = function() {
        var session = this.getContext("session_key");
        var server = this.messenger.server;
        server.handshakeAccepted(session, true);
        return null
    };
    var restart = function(session) {
        this.setContext("session_key", session);
        return new HandshakeCommand.restart(session)
    };
    HandshakeCommandProcessor.prototype.process = function(cmd, sender, msg) {
        var message = cmd.getMessage();
        if (message === "DIM!" || message === "OK!") {
            return success.call(this)
        } else {
            if (message === "DIM?") {
                return restart.call(this, cmd.getSessionKey())
            } else {
                throw Error("handshake command error: " + cmd)
            }
        }
    };
    CommandProcessor.register(Command.HANDSHAKE, HandshakeCommandProcessor);
    ns.cpu.HandshakeCommandProcessor = HandshakeCommandProcessor
}(DIMP);
! function(ns) {
    var Command = ns.protocol.Command;
    var CommandProcessor = ns.cpu.CommandProcessor;
    var ReceiptCommandProcessor = function(messenger) {
        CommandProcessor.call(this, messenger)
    };
    ns.Class(ReceiptCommandProcessor, CommandProcessor, null);
    ReceiptCommandProcessor.prototype.process = function(cmd, sender, msg) {
        return null
    };
    CommandProcessor.register(Command.RECEIPT, ReceiptCommandProcessor);
    ns.cpu.ReceiptCommandProcessor = ReceiptCommandProcessor
}(DIMP);
! function(ns) {
    var Meta = ns.Meta;
    var SearchCommand = ns.protocol.SearchCommand;
    var CommandProcessor = ns.cpu.CommandProcessor;
    var Facebook = ns.Facebook;
    var NotificationCenter = ns.stargate.NotificationCenter;
    var SearchCommandProcessor = function(messenger) {
        CommandProcessor.call(this, messenger)
    };
    ns.Class(SearchCommandProcessor, CommandProcessor, null);
    var user_info = function(string) {
        var facebook = Facebook.getInstance();
        var identifier = facebook.getIdentifier(string);
        if (!identifier) {
            return string
        }
        var nickname = facebook.getNickname(identifier);
        var number = facebook.getNumberString(identifier);
        return identifier + " (" + number + ') "' + nickname + '"'
    };
    SearchCommandProcessor.prototype.process = function(cmd, sender, msg) {
        var users = cmd.getUsers();
        var online = cmd.getCommand() === SearchCommand.ONLINE_USERS;
        var cnt = users ? users.length : 0;
        var text;
        if (cnt === 0) {
            if (online) {
                text = "No user online now."
            } else {
                text = "User not found."
            }
        } else {
            if (cnt === 1) {
                if (online) {
                    text = "One user online now,\n" + user_info(users[0])
                } else {
                    text = "Got one user,\n" + user_info(users[0])
                }
            } else {
                if (online) {
                    text = cnt + " users online now,"
                } else {
                    text = "Got " + cnt + " users,"
                }
                for (var i = 0; i < cnt; ++i) {
                    text += "\n" + user_info(users[i])
                }
            }
        }
        var results = cmd.getResults();
        if (results) {
            var facebook = Facebook.getInstance();
            var id, meta;
            var keys = Object.keys(results);
            for (var j = 0; j < keys.length; ++j) {
                id = keys[j];
                meta = results[id];
                id = facebook.getIdentifier(id);
                if (!id) {
                    continue
                }
                meta = Meta.getInstance(meta);
                if (!meta) {
                    continue
                }
                facebook.saveMeta(meta, id)
            }
        }
        cmd.setValue("text", text);
        var nc = NotificationCenter.getInstance();
        nc.postNotification(nc.kNotificationMessageReceived, this, msg);
        return null
    };
    CommandProcessor.register(SearchCommand.SEARCH, SearchCommandProcessor);
    CommandProcessor.register(SearchCommand.ONLINE_USERS, SearchCommandProcessor);
    ns.cpu.SearchCommandProcessor = SearchCommandProcessor
}(DIMP);
! function(ns) {
    var AsymmetricKey = ns.crypto.AsymmetricKey;
    var PrivateKey = ns.crypto.PrivateKey;
    var NetworkType = ns.protocol.NetworkType;
    var MetaType = ns.protocol.MetaType;
    var Meta = ns.Meta;
    var Profile = ns.Profile;
    var MetaCommand = ns.protocol.MetaCommand;
    var ProfileCommand = ns.protocol.ProfileCommand;
    var Facebook = ns.Facebook;
    var Messenger = ns.Messenger;
    var Register = function(type) {
        if (type) {
            this.network = type
        } else {
            this.network = NetworkType.Main
        }
        this.privateKey = null
    };
    Register.prototype.createUser = function(name, avatar) {
        var key = this.generatePrivateKey();
        var meta = this.generateMeta("web-demo");
        var identifier = this.generateIdentifier(meta, NetworkType.Main);
        var profile = this.createProfile(identifier, {
            name: name,
            avatar: avatar
        });
        var facebook = Facebook.getInstance();
        facebook.saveMeta(meta, identifier);
        facebook.savePrivateKey(key, identifier);
        facebook.saveProfile(profile);
        return facebook.getUser(identifier)
    };
    Register.prototype.createGroup = function(name, founder) {
        var facebook = Facebook.getInstance();
        this.privateKey = facebook.getPrivateKeyForSignature(founder);
        var meta = this.generateMeta("group");
        var identifier = this.generateIdentifier(meta, NetworkType.Polylogue);
        var profile = this.createProfile(identifier, {
            name: name
        });
        facebook.saveMeta(meta, identifier);
        facebook.saveProfile(profile);
        return facebook.getGroup(identifier)
    };
    Register.prototype.generatePrivateKey = function(algorithm) {
        if (!algorithm) {
            algorithm = AsymmetricKey.RSA
        }
        this.privateKey = PrivateKey.generate(algorithm);
        return this.privateKey
    };
    Register.prototype.generateMeta = function(seed) {
        if (!seed) {
            seed = "anonymous"
        }
        return Meta.generate(MetaType.Default, this.privateKey, seed)
    };
    Register.prototype.generateIdentifier = function(meta, type) {
        if (!type) {
            type = this.network
        }
        return meta.generateIdentifier(type)
    };
    Register.prototype.createProfile = function(identifier, properties) {
        var profile = Profile.getInstance({
            "ID": identifier
        });
        if (properties) {
            var keys = Object.keys(properties);
            var name, value;
            for (var i = 0; i < keys.length; ++i) {
                name = keys[i];
                value = properties[name];
                if (name && value) {
                    profile.setProperty(name, value)
                }
            }
        }
        profile.sign(this.privateKey);
        return profile
    };
    Register.prototype.upload = function(identifier, meta, profile) {
        var cmd;
        if (profile) {
            cmd = ProfileCommand.response(identifier, profile, meta)
        } else {
            if (meta) {
                cmd = MetaCommand.response(identifier, meta)
            }
        }
        return Messenger.getInstance().sendCommand(cmd)
    };
    if (typeof ns.extensions !== "object") {
        ns.extensions = {}
    }
    ns.extensions.Register = Register
}(DIMP);
! function(ns) {
    var Data = ns.type.Data;
    var Base64 = ns.format.Base64;
    var SHA256 = ns.digest.SHA256;
    var SymmetricKey = ns.crypto.SymmetricKey;
    var Password = {
        KEY_SIZE: 32,
        BLOCK_SIZE: 16,
        generate: function(string) {
            var data = ns.type.String.from(string).getBytes("UTF-8");
            var digest = SHA256.digest(data);
            var len = Password.KEY_SIZE - data.length;
            if (len > 0) {
                var merged = new Data(Password.KEY_SIZE);
                merged.push(digest.subarray(0, len));
                merged.push(data);
                data = merged.getBytes(false)
            } else {
                if (len < 0) {
                    data = digest
                }
            }
            var pos = Password.KEY_SIZE - Password.BLOCK_SIZE;
            var iv = digest.subarray(pos);
            var key = {
                "algorithm": SymmetricKey.AES,
                "data": Base64.encode(data),
                "iv": Base64.encode(iv)
            };
            return SymmetricKey.getInstance(key)
        }
    };
    if (typeof ns.extensions !== "object") {
        ns.extensions = {}
    }
    ns.extensions.Password = Password
}(DIMP);
! function(ns) {
    var State = ns.fsm.State;
    var ServerState = function(name) {
        State.call(this);
        this.name = name
    };
    ns.Class(ServerState, State, null);
    ServerState.prototype.equals = function(state) {
        if (state instanceof ServerState) {
            return this.name === state.name
        } else {
            if (typeof state === "string") {
                return this.name === state
            } else {
                throw Error("state error: " + state)
            }
        }
    };
    ServerState.prototype.toString = function() {
        return "<ServerState:" + this.name + ">"
    };
    ServerState.prototype.toLocaleString = function() {
        return "<ServerState:" + this.name.toLocaleString() + ">"
    };
    ServerState.prototype.onEnter = function(machine) {
        console.assert(machine !== null, "machine empty");
        console.log("onEnter: " + this.name + " state")
    };
    ServerState.prototype.onExit = function(machine) {
        console.assert(machine !== null, "machine empty")
    };
    if (typeof ns.network !== "object") {
        ns.network = {}
    }
    ns.network.ServerState = ServerState
}(DIMP);
! function(ns) {
    var Transition = ns.fsm.Transition;
    var Machine = ns.fsm.Machine;
    var ServerState = ns.network.ServerState;
    var StarStatus = ns.stargate.StarStatus;
    var defaultState = "default";
    var connectingState = "connecting";
    var connectedState = "connected";
    var handshakingState = "handshaking";
    var runningState = "running";
    var errorState = "error";
    var stoppedState = "stopped";
    var transition = function(target, evaluate) {
        var trans = new Transition(target);
        trans.evaluate = evaluate;
        return trans
    };
    var server_state = function(name, transitions) {
        var state = new ServerState(name);
        for (var i = 1; i < arguments.length; ++i) {
            state.addTransition(arguments[i])
        }
        return state
    };
    var default_state = function() {
        return server_state(defaultState, transition(connectingState, function(machine) {
            var server = machine.server;
            if (server && server.getCurrentUser()) {
                var status = server.getStatus();
                return status.equals(StarStatus.Connecting) || status.equals(StarStatus.Connected)
            } else {
                return false
            }
        }))
    };
    var connecting_state = function() {
        return server_state(connectingState, transition(connectedState, function(machine) {
            var server = machine.server;
            var status = server.getStatus();
            return status.equals(StarStatus.Connected)
        }), transition(errorState, function(machine) {
            var server = machine.server;
            var status = server.getStatus();
            return status.equals(StarStatus.Error)
        }))
    };
    var connected_state = function() {
        return server_state(connectedState, transition(handshakingState, function(machine) {
            var server = machine.server;
            return server.getCurrentUser()
        }))
    };
    var handshaking_state = function() {
        return server_state(handshakingState, transition(runningState, function(machine) {
            var server = machine.server;
            return server.session
        }), transition(errorState, function(machine) {
            var server = machine.server;
            var status = server.getStatus();
            return !status.equals(StarStatus.Connected)
        }))
    };
    var running_state = function() {
        return server_state(runningState, transition(errorState, function(machine) {
            var server = machine.server;
            var status = server.getStatus();
            return !status.equals(StarStatus.Connected)
        }), transition(defaultState, function(machine) {
            var server = machine.server;
            return !server.session
        }))
    };
    var error_state = function() {
        return server_state(errorState, transition(defaultState, function(machine) {
            var server = machine.server;
            var status = server.getStatus();
            return !status.equals(StarStatus.Error)
        }))
    };
    var stopped_state = function() {
        return server_state(stoppedState)
    };
    var StateMachine = function(defaultStateName) {
        if (!defaultStateName) {
            defaultStateName = StateMachine.defaultState
        }
        Machine.call(this, defaultStateName);
        this.addState(default_state());
        this.addState(connecting_state());
        this.addState(connected_state());
        this.addState(handshaking_state());
        this.addState(running_state());
        this.addState(error_state());
        this.addState(stopped_state());
        this.server = null
    };
    ns.Class(StateMachine, Machine, null);
    StateMachine.prototype.addState = function(state) {
        Machine.prototype.addState.call(this, state, state.name)
    };
    var start_tick = function(machine) {
        if (machine.ti) {
            clearInterval(machine.ti)
        }
        machine.ti = setInterval(function() {
            machine.tick()
        }, 500)
    };
    var stop_tick = function(machine) {
        if (machine.ti) {
            clearInterval(machine.ti);
            machine.ti = null
        }
    };
    var is_stop = function(machine) {
        if (!machine.currentState) {
            return false
        }
        return machine.currentState.name === StateMachine.stoppedState
    };
    StateMachine.prototype.tick = function() {
        if (is_stop(this)) {
            stop_tick(this);
            return
        }
        Machine.prototype.tick.call(this)
    };
    StateMachine.prototype.start = function() {
        Machine.prototype.start.call(this);
        start_tick(this)
    };
    StateMachine.prototype.stop = function() {
        stop_tick(this);
        Machine.prototype.stop.call(this)
    };
    StateMachine.prototype.pause = function() {
        stop_tick(this);
        Machine.prototype.pause.call(this)
    };
    StateMachine.prototype.resume = function() {
        Machine.prototype.resume.call(this);
        start_tick(this)
    };
    StateMachine.defaultState = defaultState;
    StateMachine.connectingState = connectingState;
    StateMachine.connectedState = connectedState;
    StateMachine.handshakingState = handshakingState;
    StateMachine.runningState = runningState;
    StateMachine.errorState = errorState;
    StateMachine.stoppedState = stoppedState;
    if (typeof ns.network !== "object") {
        ns.network = {}
    }
    ns.network.StateMachine = StateMachine
}(DIMP);
! function(ns) {
    var StationDelegate = function() {};
    StationDelegate.prototype.didSendPackage = function(data, server) {
        console.assert(data !== null, "data empty");
        console.assert(server !== null, "server empty");
        console.assert(false, "implement me!")
    };
    StationDelegate.prototype.didFailToSendPackage = function(error, data, server) {
        console.assert(error !== null, "error empty");
        console.assert(data !== null, "data empty");
        console.assert(server !== null, "server empty");
        console.assert(false, "implement me!")
    };
    if (typeof ns.network !== "object") {
        ns.network = {}
    }
    ns.network.StationDelegate = StationDelegate
}(DIMP);
! function(ns) {
    var Base64 = ns.format.Base64;
    var SHA256 = ns.digest.SHA256;
    var RequestWrapper = function(data, handler) {
        this.data = data;
        this.handler = handler
    };
    RequestWrapper.getKey = function(data) {
        var hash = SHA256.digest(data);
        return Base64.encode(hash)
    };
    if (typeof ns.network !== "object") {
        ns.network = {}
    }
    ns.network.RequestWrapper = RequestWrapper
}(DIMP);
! function(ns) {
    var Envelope = ns.Envelope;
    var InstantMessage = ns.InstantMessage;
    var HandshakeCommand = ns.protocol.HandshakeCommand;
    var HandshakeState = ns.protocol.HandshakeState;
    var Station = ns.Station;
    var MessengerDelegate = ns.MessengerDelegate;
    var StateDelegate = ns.fsm.StateDelegate;
    var StateMachine = ns.network.StateMachine;
    var NotificationCenter = ns.stargate.NotificationCenter;
    var StarStatus = ns.stargate.StarStatus;
    var StarDelegate = ns.stargate.StarDelegate;
    var SocketClient = ns.stargate.extensions.SocketClient;
    var RequestWrapper = ns.network.RequestWrapper;
    var Server = function(identifier, host, port) {
        Station.call(this, identifier, host, port);
        var fsm = new StateMachine();
        fsm.server = this;
        fsm.delegate = this;
        fsm.start();
        this.fsm = fsm;
        this.star = null;
        this.stationDelegate = null;
        this.messenger = null;
        this.session = null;
        this.currentUser = null;
        this.waitingList = [];
        this.sendingTable = {}
    };
    ns.Class(Server, Station, MessengerDelegate, StarDelegate, StateDelegate);
    Server.prototype.getCurrentUser = function() {
        return this.currentUser
    };
    Server.prototype.setCurrentUser = function(user) {
        if (user.equals(this.currentUser)) {
            return
        }
        this.currentUser = user;
        this.session = null
    };
    Server.prototype.getCurrentState = function() {
        return this.fsm.currentState
    };
    Server.prototype.getStatus = function() {
        return this.star.getStatus()
    };
    Server.prototype.send = function(data, delegate) {
        if (!delegate) {
            delegate = this
        }
        var str = new ns.type.String(data, "UTF-8");
        this.star.send(str.toString(), delegate)
    };
    Server.prototype.handshake = function(session) {
        var state = this.getCurrentState();
        if (!state.equals(StateMachine.handshakingState)) {
            console.log("server state error: " + state);
            return
        }
        if (!this.getStatus().equals(StarStatus.Connected)) {
            console.log("server state error: " + state);
            return
        }
        var user = this.getCurrentUser();
        var cmd = HandshakeCommand.restart(session);
        var env = Envelope.newEnvelope(user.identifier, this.identifier, 0);
        var iMsg = InstantMessage.newMessage(cmd, env);
        var sMsg = this.messenger.encryptMessage(iMsg);
        var rMsg = this.messenger.signMessage(sMsg);
        if (!rMsg) {
            throw Error("failed to encrypt and sign message: " + iMsg)
        }
        if (cmd.getState().equals(HandshakeState.START)) {
            rMsg.setMeta(user.getMeta())
        }
        var data = this.messenger.serializeMessage(rMsg);
        this.send(data)
    };
    Server.prototype.handshakeAccepted = function(session, success) {
        var state = this.getCurrentState();
        if (!state.equals(StateMachine.handshakingState)) {
            console.log("server state error: " + state)
        }
        if (success) {
            console.log("handshake accepted for user: " + this.getCurrentUser());
            this.session = session;
            var nc = NotificationCenter.getInstance();
            nc.postNotification(nc.kNotificationHandshakeAccepted, this, {
                session: session
            })
        } else {
            console.log("handshake again with session: " + session)
        }
    };
    Server.prototype.connect = function(host, port) {
        this.fsm.changeState(this.fsm.defaultStateName);
        if (this.getStatus().equals(StarStatus.Connected) && host === this.host && port === this.port) {
            console.log("already connected to " + host + ":" + port);
            return
        }
        var nc = NotificationCenter.getInstance();
        nc.postNotification(nc.kNotificationStationConnecting, this, {
            "host": host,
            "port": port
        });
        this.star.connect(host, port);
        this.host = host;
        this.port = port
    };
    Server.prototype.start = function(options) {
        this.messenger.delegate = this;
        if (options) {
            if (options["host"]) {
                this.host = options["host"]
            } else {
                options["host"] = this.host
            }
            if (options["port"]) {
                this.port = options["port"]
            } else {
                options["port"] = this.port
            }
        } else {
            options = {
                "host": this.host,
                "port": this.port
            }
        }
        var nc = NotificationCenter.getInstance();
        nc.postNotification(nc.kNotificationStationConnecting, this, options);
        if (!this.star) {
            var socket = new SocketClient(this);
            var onConnected = socket.onConnected;
            socket.onConnected = function() {
                onConnected.call(this);
                var nc = NotificationCenter.getInstance();
                nc.postNotification(nc.kNotificationStationConnected, this, options)
            };
            this.star = socket
        }
        this.star.launch(options)
    };
    Server.prototype.stop = function() {
        this.star.terminate();
        this.fsm.stop()
    };
    Server.prototype.pause = function() {
        this.star.pause();
        this.fsm.pause()
    };
    Server.prototype.resume = function() {
        this.star.resume();
        this.fsm.resume()
    };
    Server.prototype.onReceived = function(data, star) {
        if (!data || data.length === 0) {
            return
        }
        var response = this.messenger.onReceivePackage(data);
        if (response) {
            this.send(response)
        }
    };
    Server.prototype.onStatusChanged = function(status, star) {
        this.fsm.tick()
    };
    Server.prototype.onSent = function(data, error, star) {
        if (error) {
            this.stationDelegate.didFailToSendPackage(error, data, this)
        } else {
            this.stationDelegate.didSendPackage(data, this)
        }
    };
    Server.prototype.sendPackage = function(data, handler) {
        var wrapper = new RequestWrapper(data, handler);
        var state = this.getCurrentState();
        if (!state.equals(StateMachine.runningState)) {
            this.waitingList.push(wrapper);
            return true
        }
        this.send(data);
        if (handler) {
            var key = RequestWrapper.getKey(data);
            this.sendingTable[key] = wrapper
        }
        return true
    };
    Server.prototype.uploadData = function(data, msg) {
        return null
    };
    Server.prototype.downloadData = function(url, msg) {
        return null
    };
    var carry_on = function() {
        var state;
        var wrapper;
        while (this.waitingList.length > 0) {
            wrapper = this.waitingList.shift();
            state = this.getCurrentState();
            if (state.equals(StateMachine.runningState)) {
                this.sendPackage(wrapper.data, wrapper.handler)
            } else {
                console.log("connection lost, waiting task(s) interrupted");
                this.waitingList.unshift(wrapper);
                break
            }
        }
    };
    Server.prototype.enterState = function(state, machine) {
        if (state.equals(StateMachine.defaultState)) {} else {
            if (state.equals(StateMachine.connectingState)) {} else {
                if (state.equals(StateMachine.connectedState)) {} else {
                    if (state.equals(StateMachine.handshakingState)) {
                        var session = this.session;
                        this.session = null;
                        this.handshake(session)
                    } else {
                        if (state.equals(StateMachine.runningState)) {
                            var srv = this;
                            setTimeout(function() {
                                carry_on.call(srv)
                            }, 1000)
                        } else {
                            if (state.equals(StateMachine.errorState)) {
                                console.log("Station connection error!");
                                var nc = NotificationCenter.getInstance();
                                nc.postNotification(nc.kNotificationStationError, this, null)
                            } else {
                                if (state.equals(StateMachine.stoppedState)) {
                                    console.log("Station stop.")
                                }
                            }
                        }
                    }
                }
            }
        }
    };
    Server.prototype.exitState = function(state, machine) {};
    Server.prototype.pauseState = function(state, machine) {};
    Server.prototype.resumeState = function(state, machine) {};
    if (typeof ns.network !== "object") {
        ns.network = {}
    }
    ns.network.Server = Server
}(DIMP);
! function(ns) {
    var LocalStorage = ns.stargate.LocalStorage;
    var Table = {
        create: function(clazz) {
            var name = clazz.name;
            var table = this.tables[name];
            if (!table) {
                table = new clazz();
                this.tables[name] = table
            }
            return table
        },
        load: function(clazz) {
            var name = clazz.name;
            return LocalStorage.loadJSON(name)
        },
        save: function(data, clazz) {
            var name = clazz.name;
            return LocalStorage.saveJSON(data, name)
        },
        tables: {}
    };
    if (typeof ns.db !== "object") {
        ns.db = {}
    }
    ns.db.Table = Table
}(DIMP);
! function(ns) {
    var Meta = ns.Meta;
    var Facebook = ns.Facebook;
    var NotificationCenter = ns.stargate.NotificationCenter;
    var Table = ns.db.Table;
    var save_metas = function(map) {
        return Table.save(map, MetaTable)
    };
    var load_metas = function() {
        var metas = {};
        var map = Table.load(MetaTable);
        if (map) {
            var facebook = Facebook.getInstance();
            var identifier, meta;
            var list = Object.keys(map);
            for (var i = 0; i < list.length; ++i) {
                identifier = list[i];
                meta = map[identifier];
                identifier = facebook.getIdentifier(identifier);
                meta = Meta.getInstance(meta);
                if (identifier && meta) {
                    metas[identifier] = meta
                }
            }
        }
        return metas
    };
    var MetaTable = function() {
        this.metas = null
    };
    MetaTable.prototype.loadMeta = function(identifier) {
        if (!this.metas) {
            this.metas = load_metas()
        }
        return this.metas[identifier]
    };
    MetaTable.prototype.saveMeta = function(meta, identifier) {
        this.loadMeta(identifier);
        if (this.metas[identifier]) {
            console.log("meta already exists: " + identifier);
            return true
        }
        this.metas[identifier] = meta;
        console.log("saving meta for " + identifier);
        var nc = NotificationCenter.getInstance();
        if (save_metas(this.metas)) {
            nc.postNotification(nc.kNotificationMetaAccepted, this, {
                "ID": identifier,
                "meta": meta
            })
        } else {
            var text = "failed to save meta: " + identifier + " -> " + ns.format.JSON.encode(meta);
            console.log(text)
        }
    };
    ns.db.MetaTable = MetaTable
}(DIMP);
! function(ns) {
    var PrivateKey = ns.crypto.PrivateKey;
    var Facebook = ns.Facebook;
    var Table = ns.db.Table;
    var save_keys = function(map) {
        return Table.save(map, PrivateTable)
    };
    var load_keys = function() {
        var keys = {};
        var map = Table.load(PrivateTable);
        if (map) {
            var facebook = Facebook.getInstance();
            var identifier, key;
            var list = Object.keys(map);
            for (var i = 0; i < list.length; ++i) {
                identifier = list[i];
                key = map[identifier];
                identifier = facebook.getIdentifier(identifier);
                key = PrivateKey.getInstance(key);
                if (identifier && key) {
                    keys[identifier] = key
                }
            }
        }
        return keys
    };
    var PrivateTable = function() {
        this.privateKeys = null
    };
    PrivateTable.prototype.loadPrivateKey = function(identifier) {
        if (!this.privateKeys) {
            this.privateKeys = load_keys()
        }
        return this.privateKeys[identifier]
    };
    PrivateTable.prototype.savePrivateKey = function(key, identifier) {
        this.loadPrivateKey(identifier);
        this.privateKeys[identifier] = key;
        console.log("saving private key for " + identifier);
        return save_keys(this.privateKeys)
    };
    ns.db.PrivateTable = PrivateTable
}(DIMP);
! function(ns) {
    var Profile = ns.Profile;
    var Facebook = ns.Facebook;
    var NotificationCenter = ns.stargate.NotificationCenter;
    var Table = ns.db.Table;
    var save_profiles = function(map) {
        return Table.save(map, ProfileTable)
    };
    var load_profiles = function() {
        var profiles = {};
        var map = Table.load(ProfileTable);
        if (map) {
            var facebook = Facebook.getInstance();
            var user, profile;
            var list = Object.keys(map);
            for (var i = 0; i < list.length; ++i) {
                user = list[i];
                profile = map[user];
                user = facebook.getIdentifier(user);
                profile = Profile.getInstance(profile);
                if (user && profile) {
                    profiles[user] = profile
                }
            }
        }
        return profiles
    };
    var ProfileTable = function() {
        this.profiles = null
    };
    ProfileTable.prototype.loadProfile = function(identifier) {
        if (!this.profiles) {
            this.profiles = load_profiles()
        }
        return this.profiles[identifier]
    };
    ProfileTable.prototype.saveProfile = function(profile, identifier) {
        this.loadProfile(identifier);
        this.profiles[identifier] = profile;
        console.log("saving profile for " + identifier);
        var nc = NotificationCenter.getInstance();
        if (save_profiles(this.profiles)) {
            nc.postNotification(nc.kNotificationProfileUpdated, this, profile)
        } else {
            var text = "failed to save profile: " + profile.getIdentifier() + " -> " + profile.getValue("data");
            console.log(text)
        }
    };
    ns.db.ProfileTable = ProfileTable
}(DIMP);
! function(ns) {
    var User = ns.User;
    var Facebook = ns.Facebook;
    var Table = ns.db.Table;
    var save_users = function(list) {
        return Table.save(list, UserTable)
    };
    var load_users = function() {
        var users = [];
        var list = Table.load(UserTable);
        if (list) {
            var facebook = Facebook.getInstance();
            var item;
            for (var i = 0; i < list.length; ++i) {
                item = facebook.getIdentifier(list[i]);
                if (!item) {
                    throw Error("ID error: " + list[i])
                }
                users.push(item)
            }
        }
        return users
    };
    var UserTable = function() {
        this.users = null
    };
    UserTable.prototype.allUsers = function() {
        if (!this.users) {
            this.users = load_users()
        }
        return this.users
    };
    UserTable.prototype.addUser = function(user) {
        if (user instanceof User) {
            user = user.identifier
        }
        var list = this.allUsers();
        if (list.indexOf(user) >= 0) {
            throw Error("user already exists: " + user)
        }
        list.push(user);
        return save_users(list)
    };
    UserTable.prototype.removeUser = function(user) {
        if (user instanceof User) {
            user = user.identifier
        }
        var list = this.allUsers();
        if (list.indexOf(user) < 0) {
            throw Error("user not exists: " + user)
        }
        ns.type.Arrays.remove(list, user);
        return save_users(list)
    };
    UserTable.prototype.getCurrentUser = function() {
        var list = this.allUsers();
        if (list && list.length > 0) {
            return list[0]
        } else {
            return null
        }
    };
    UserTable.prototype.setCurrentUser = function(user) {
        if (user instanceof User) {
            user = user.identifier
        }
        var list = this.allUsers();
        var index = list.indexOf(user);
        if (index === 0) {
            return
        } else {
            if (index > 0) {
                ns.type.Arrays.remove(list, user)
            }
        }
        list.unshift(user);
        save_users(list)
    };
    ns.db.UserTable = UserTable
}(DIMP);
! function(ns) {
    var KeyStore = ns.KeyStore;
    var s_key_store = null;
    KeyStore.getInstance = function() {
        if (!s_key_store) {
            s_key_store = new KeyStore()
        }
        return s_key_store
    };
    KeyStore.prototype.saveKeys = function(map) {
        return true
    };
    KeyStore.prototype.loadKeys = function() {
        return null
    };
    ns.KeyStore = KeyStore
}(DIMP);
! function(ns) {
    var AddressNameService = ns.AddressNameService;
    var s_ans = null;
    AddressNameService.getInstance = function() {
        if (!s_ans) {
            s_ans = new AddressNameService()
        }
        return s_ans
    };
    var getIdentifier = AddressNameService.prototype.getIdentifier;
    AddressNameService.prototype.getIdentifier = function(name) {
        var identifier = getIdentifier.call(this, name);
        if (identifier) {
            return identifier
        }
        return null
    };
    AddressNameService.prototype.save = function(name, identifier) {
        if (!this.cache(name, identifier)) {
            return false
        }
        return true
    };
    ns.AddressNameService = AddressNameService
}(DIMP);
! function(ns) {
    var AddressNameService = ns.AddressNameService;
    var Immortals = ns.Immortals;
    var Table = ns.db.Table;
    var PrivateTable = ns.db.PrivateTable;
    var MetaTable = ns.db.MetaTable;
    var ProfileTable = ns.db.ProfileTable;
    var UserTable = ns.db.UserTable;
    var Facebook = ns.Facebook;
    var Messenger = ns.Messenger;
    var s_facebook = null;
    Facebook.getInstance = function() {
        if (!s_facebook) {
            s_facebook = new Facebook();
            s_facebook.ans = AddressNameService.getInstance();
            s_facebook.immortals = new Immortals();
            s_facebook.users = null
        }
        return s_facebook
    };
    Facebook.prototype.getLocalUsers = function() {
        if (!this.users) {
            var db = Table.create(UserTable);
            var list = db.allUsers();
            var users = [];
            for (var i = 0; i < list.length; ++i) {
                users.push(this.getUser(list[i]))
            }
            this.users = users
        }
        return this.users
    };
    Facebook.prototype.setCurrentUser = function(user) {
        var db = Table.create(UserTable);
        db.setCurrentUser(user.identifier);
        this.users = null
    };
    Facebook.prototype.addUser = function(user) {
        var db = Table.create(UserTable);
        db.addUser(user.identifier);
        this.users = null
    };
    Facebook.prototype.removeUser = function(user) {
        var db = Table.create(UserTable);
        db.removeUser(user.identifier);
        this.users = null
    };
    Facebook.prototype.getUsername = function(identifier) {
        identifier = this.getIdentifier(identifier);
        var username = identifier.name;
        var nickname = this.getNickname(identifier);
        var number = this.getNumberString(identifier);
        if (nickname != null && nickname.length > 0) {
            if (identifier.getType().isUser()) {
                if (username != null && username.length > 0) {
                    return nickname + " (" + username + ")"
                } else {
                    return nickname + " (" + number + ")"
                }
            }
            return nickname
        } else {
            if (username != null && username.length > 0) {
                if (identifier.getType().isUser()) {
                    return username + " (" + number + ")"
                }
                return username
            }
        }
        return identifier.address.toString() + " (" + number + ")"
    };
    Facebook.prototype.getNickname = function(identifier) {
        var profile = this.getProfile(identifier);
        if (profile) {
            return profile.getName()
        } else {
            return null
        }
    };
    Facebook.prototype.getNumberString = function(identifier) {
        var number = identifier.getNumber();
        var string = "0000000000" + number;
        string = string.substring(string.length - 10);
        string = string.substring(0, 3) + "-" + string.substring(3, 6) + "-" + string.substring(6);
        return string
    };
    Facebook.prototype.addContact = function(contact, user) {};
    Facebook.prototype.removeContact = function(contact, user) {};
    Facebook.prototype.savePrivateKey = function(key, identifier) {
        if (!this.cachePrivateKey(key, identifier)) {
            return false
        }
        var db = Table.create(PrivateTable);
        db.savePrivateKey(key, identifier);
        return true
    };
    Facebook.prototype.loadPrivateKey = function(identifier) {
        var db = Table.create(PrivateTable);
        var key = db.loadPrivateKey(identifier);
        if (!key && identifier.getType().isPerson()) {
            key = this.immortals.getPrivateKeyForSignature(identifier)
        }
        return key
    };
    Facebook.prototype.saveMeta = function(meta, identifier) {
        if (!this.cacheMeta(meta, identifier)) {
            console.log("meta not match ID: " + identifier);
            return false
        }
        var db = Table.create(MetaTable);
        db.saveMeta(meta, identifier);
        return true
    };
    Facebook.prototype.loadMeta = function(identifier) {
        if (identifier.isBroadcast()) {
            return null
        }
        var db = Table.create(MetaTable);
        var meta = db.loadMeta(identifier);
        if (meta) {
            return meta
        }
        if (identifier.getType().isPerson()) {
            meta = this.immortals.getMeta(identifier);
            if (meta) {
                return meta
            }
        }
        Messenger.getInstance().queryMeta(identifier);
        return meta
    };
    Facebook.prototype.saveProfile = function(profile, identifier) {
        if (!identifier) {
            identifier = profile.getIdentifier();
            identifier = this.getIdentifier(identifier);
            if (!identifier) {
                throw Error("profile ID error: " + identifier)
            }
        }
        if (!this.cacheProfile(profile, identifier)) {
            return false
        }
        var db = Table.create(ProfileTable);
        db.saveProfile(profile, identifier);
        return true
    };
    Facebook.prototype.loadProfile = function(identifier) {
        var db = Table.create(ProfileTable);
        var profile = db.loadProfile(identifier);
        if (profile) {
            var names = profile.allPropertyNames();
            if (names && names.length > 0) {
                return profile
            }
        }
        if (identifier.getType().isPerson()) {
            var tai = this.immortals.getProfile(identifier);
            if (tai) {
                return tai
            }
        }
        Messenger.getInstance().queryProfile(identifier);
        return profile
    };
    Facebook.prototype.saveContacts = function(contacts, user) {
        return true
    };
    Facebook.prototype.loadContacts = function(user) {
        var contacts = null;
        if (!contacts || contacts.length === 0) {
            contacts = this.immortals.getContacts(user)
        }
        return contacts
    };
    Facebook.prototype.addMember = function(member, group) {
        return true
    };
    Facebook.prototype.removeMember = function(member, group) {
        return true
    };
    Facebook.prototype.saveMembers = function(members, group) {
        return true
    };
    Facebook.prototype.loadMembers = function(group) {
        return null
    };
    var getFounder = Facebook.prototype.getFounder;
    Facebook.prototype.getFounder = function(group) {
        return getFounder.call(this, group)
    };
    var getOwner = Facebook.prototype.getOwner;
    Facebook.prototype.getOwner = function(group) {
        return getOwner.call(this, group)
    };
    ns.Facebook = Facebook
}(DIMP);
! function(ns) {
    var SymmetricKey = ns.crypto.SymmetricKey;
    var ID = ns.ID;
    var HandshakeCommand = ns.protocol.HandshakeCommand;
    var MetaCommand = ns.protocol.MetaCommand;
    var ProfileCommand = ns.protocol.ProfileCommand;
    var MuteCommand = ns.protocol.MuteCommand;
    var BlockCommand = ns.protocol.BlockCommand;
    var SearchCommand = ns.protocol.SearchCommand;
    var StorageCommand = ns.protocol.StorageCommand;
    var GroupCommand = ns.protocol.GroupCommand;
    var InviteCommand = ns.protocol.group.InviteCommand;
    var ResetCommand = ns.protocol.group.ResetCommand;
    var InstantMessage = ns.InstantMessage;
    var ReliableMessage = ns.ReliableMessage;
    var Facebook = ns.Facebook;
    var KeyStore = ns.KeyStore;
    var Messenger = ns.Messenger;
    var s_messenger = null;
    Messenger.getInstance = function() {
        if (!s_messenger) {
            s_messenger = new Messenger();
            s_messenger.entityDelegate = Facebook.getInstance();
            s_messenger.cipherKeyDelegate = KeyStore.getInstance();
            s_messenger.server = null;
            s_messenger.metaQueryTime = {};
            s_messenger.profileQueryTime = {};
            s_messenger.groupQueryTime = {}
        }
        return s_messenger
    };
    var is_empty = function(group) {
        var facebook = this.getFacebook();
        var members = facebook.getMembers(group);
        if (!members || members.length === 0) {
            return true
        }
        var owner = facebook.getOwner(group);
        return !owner
    };
    var check_group = function(content, sender) {
        var facebook = this.getFacebook();
        var group = facebook.getIdentifier(content.getGroup());
        if (!group || group.isBroadcast()) {
            return false
        }
        var meta = facebook.getMeta(group);
        if (!meta) {
            return true
        }
        if (is_empty.call(this, group)) {
            if ((content instanceof InviteCommand) || (content instanceof ResetCommand)) {
                return false
            } else {
                return this.queryGroupInfo(group, sender)
            }
        } else {
            if (facebook.existsMember(sender, group) || facebook.existsAssistant(sender, group) || facebook.isOwner(sender, group)) {
                return false
            } else {
                var admins = [];
                var assistants = facebook.getAssistants(group);
                if (assistants) {
                    for (var i = 0; i < assistants.length; ++i) {
                        admins.push(assistants[i])
                    }
                }
                var owner = facebook.getOwner(group);
                if (owner && admins.indexOf(owner) < 0) {
                    admins.push(owner)
                }
                return this.queryGroupInfo(group, admins)
            }
        }
    };
    Messenger.prototype.saveMessage = function(msg) {
        var content = msg.content;
        if (content instanceof HandshakeCommand) {
            return true
        }
        if (content instanceof MetaCommand) {
            return true
        }
        if (content instanceof MuteCommand || content instanceof BlockCommand) {
            return true
        }
        if (content instanceof SearchCommand) {
            return true
        }
        return true
    };
    Messenger.prototype.suspendMessage = function(msg) {
        if (msg instanceof InstantMessage) {} else {
            if (msg instanceof ReliableMessage) {}
        }
    };
    var process = Messenger.prototype.processInstantMessage;
    Messenger.prototype.processInstantMessage = function(msg) {
        var content = msg.content;
        var sender = msg.envelope.sender;
        sender = this.getFacebook().getIdentifier(sender);
        if (check_group.call(this, content, sender)) {
            this.suspendMessage(msg);
            return null
        }
        var res = process.call(this, msg);
        if (!res) {
            return null
        }
        if (res instanceof HandshakeCommand) {
            return res
        }
        var receiver = msg.envelope.sender;
        receiver = Facebook.getInstance().getIdentifier(receiver);
        this.sendContent(res, receiver, null, false);
        return null
    };
    Messenger.prototype.sendCommand = function(cmd) {
        if (!this.server) {
            throw Error("server not connect")
        }
        return this.sendContent(cmd, this.server.identifier, null, false)
    };
    Messenger.prototype.broadcastContent = function(content) {
        content.setGroup(ID.EVERYONE);
        return this.sendContent(content, ID.ANYONE, null, false)
    };
    Messenger.prototype.broadcastProfile = function(profile) {
        var user = this.server.getCurrentUser();
        if (!user) {
            throw Error("login first")
        }
        var contacts = user.getContacts();
        if (!contacts || contacts.length === 0) {
            return false
        }
        var facebook = Facebook.getInstance();
        var identifier = profile.getIdentifier();
        identifier = facebook.getIdentifier(identifier);
        var meta = facebook.getMeta(identifier);
        var cmd = ProfileCommand.response(identifier, profile, meta);
        for (var i = 0; i < contacts.length; ++i) {
            this.sendContent(cmd, contacts[i], null, false)
        }
        return true
    };
    Messenger.prototype.sendProfile = function(profile, receiver) {
        var facebook = this.getFacebook();
        var identifier = profile.getIdentifier();
        identifier = facebook.getIdentifier(identifier);
        var meta = facebook.getMeta(identifier);
        var cmd = ProfileCommand.response(identifier, profile, meta);
        return this.sendContent(cmd, receiver, null, false)
    };
    Messenger.prototype.postProfile = function(profile) {
        if (!this.server) {
            throw Error("server not connect")
        }
        return this.sendProfile(profile, this.server.identifier)
    };
    Messenger.prototype.postContacts = function(contacts) {
        var facebook = this.getFacebook();
        var user = facebook.getCurrentUser();
        if (!user) {
            throw Error("login first")
        }
        var pwd = SymmetricKey.generate(SymmetricKey.AES);
        var data = ns.format.JSON.encode(contacts);
        data = pwd.encrypt(data);
        var key = pwd.toJSON();
        key = user.encrypt(key);
        var cmd = new StorageCommand(StorageCommand.CONTACTS);
        cmd.setIdentifier(user.identifier);
        cmd.setData(data);
        cmd.setKey(key);
        return this.sendCommand(cmd)
    };
    Messenger.prototype.queryContacts = function() {
        var facebook = this.getFacebook();
        var user = facebook.getCurrentUser();
        if (!user) {
            throw Error("current user not found")
        }
        var cmd = new StorageCommand(StorageCommand.CONTACTS);
        cmd.setIdentifier(user.identifier);
        return this.sendCommand(cmd)
    };
    Messenger.prototype.queryMeta = function(identifier) {
        if (identifier.isBroadcast()) {
            return false
        }
        var now = new Date();
        var last = this.metaQueryTime[identifier];
        if (last && (now.getTime() - last.getTime()) < 30000) {
            return false
        }
        this.metaQueryTime[identifier] = now;
        var cmd = new MetaCommand(identifier);
        return this.sendCommand(cmd)
    };
    Messenger.prototype.queryProfile = function(identifier) {
        var now = new Date();
        var last = this.profileQueryTime[identifier];
        if (last && (now.getTime() - last.getTime()) < 30000) {
            return false
        }
        this.profileQueryTime[identifier] = now;
        var cmd = new ProfileCommand(identifier);
        return this.sendCommand(cmd)
    };
    Messenger.prototype.queryGroupInfo = function(group, member) {
        var now = new Date();
        var last = this.groupQueryTime[group];
        if (last && (now.getTime() - last.getTime()) < 30000) {
            return false
        }
        this.groupQueryTime[group] = now;
        var members;
        if (member instanceof Array) {
            members = member
        } else {
            members = [member]
        }
        var cmd = GroupCommand.query(group);
        var checking = false;
        for (var i = 0; i < members.length; ++i) {
            if (this.sendContent(cmd, members[i], null, false)) {
                checking = true
            }
        }
        return checking
    };
    Messenger.prototype.queryOnlineUsers = function() {
        var cmd = new SearchCommand(SearchCommand.ONLINE_USERS);
        return this.sendCommand(cmd)
    };
    Messenger.prototype.searchUsers = function(keywords) {
        var cmd = new SearchCommand(keywords);
        return this.sendCommand(cmd)
    };
    Messenger.prototype.login = function(user) {
        if (!user) {
            var facebook = this.getFacebook();
            user = facebook.getCurrentUser();
            if (!user) {
                throw Error("user not found")
            }
        }
        if (user.equals(this.server.getCurrentUser())) {
            return true
        }
        this.server.session = null;
        this.server.setCurrentUser(user);
        this.server.handshake(null);
        return true
    };
    ns.Messenger = Messenger
}(DIMP);
