var global = require('./global');

class ChatClient {
    constructor(params) {
        this.canvas = global.canvas;
        this.socket = global.socket;
        this.mobile = global.mobile;
        this.player = global.player;
        this.isadmin = false;
        var self = this;
        this.commands = {};
        var input = document.getElementById('chatInput');
        input.addEventListener('keypress', this.sendChat.bind(this));
        input.addEventListener('keyup', function(key) {
            input = document.getElementById('chatInput');
            key = key.which || key.keyCode;
            if (key === global.KEY_ESC) {
                input.value = '';
                self.canvas.cv.focus();
            }
        });
        global.chatClient = this;
    }

    // TODO: Break out many of these GameControls into separate classes.

    registerFunctions() {
        var self = this;
        this.registerCommand('help', '', function (args) {
            self.printHelp();
        }, false);
        
        this.registerCommand('ping', 'Checks your ping to the server.', function () {
            self.checkLatency();
        }, false);

        this.registerCommand('login', '', function (args) {
            self.socket.emit('pass', args);
        }, true);

        this.registerCommand('kick', 'Kicks a certain specified player.', function (args) {
            self.socket.emit('kick', args);
        }, true);
        
        this.registerCommand('addmass', 'Adds mass to yourself.', function (args) {
            self.socket.emit('addmass', args);
        }, true);

        this.registerCommand('rainbow', 'Makes you rainbow coloured!', function (args) {
            self.socket.emit('rainbow', args);
        }, true);

        this.registerCommand('meme', 'Meme a specified player!', function (args) {
            self.socket.emit('meme', args);
        }, true);
        
        global.chatClient = this;
    }

    // Chat box implementation for the users.
    addChatLine(name, message, me) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        // Colours the chat input correctly.
        newline.className = (me) ? 'me' : 'friend';
        newline.innerHTML = '<b>' + ((name.length < 1) ? 'An unnamed cell' : name) + '</b>: ' + message;

        this.appendMessage(newline);
    }

    // Chat box implementation for the system.
    addSystemLine(message) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        // Colours the chat input correctly.
        newline.className = 'system';
        newline.innerHTML = message;
        if(message.includes("Welcome back,")){
            this.isadmin = true;
        }

        // Append messages to the logs.
        this.appendMessage(newline);
    }

    // Places the message DOM node into the chat box.
    appendMessage(node) {
        if (this.mobile) {
            return;
        }
        var chatList = document.getElementById('chatList');
        //if (chatList.childNodes.length > 10) {
        //    chatList.removeChild(chatList.childNodes[0]);
        //}
        chatList.appendChild(node);
        chatList.scrollTop = chatList.scrollHeight;
    }

    // Sends a message or executes a command on the click of enter.
    sendChat(key) {
        var commands = this.commands,
            input = document.getElementById('chatInput');

        key = key.which || key.keyCode;

        if (key === global.KEY_ENTER) {
            var text = input.value.replace(/(<([^>]+)>)/ig,'');
            if (text !== '') {

                // Chat command.
                if (text.indexOf('-') === 0) {
                    var args = text.substring(1).split(' ');
                    if (commands[args[0]]) {
                        commands[args[0]].callback(args.slice(1));
                    } else {
                        this.addSystemLine('Unknown command: ' + text + ', type -help for more info.');
                    }

                // Allows for regular messages to be sent to the server.
                } else {
                    this.socket.emit('playerChat', { sender: this.player.name, message: text });
                    this.addChatLine(this.player.name, text, true);
                    responsiveVoice.speak(text, "UK English Male", {pitch: 1});
                }

                // Resets input.
                input.value = '';
                this.canvas.cv.focus();
            }
        }
    }

    // Allows for addition of commands.
    registerCommand(name, description, callback, adminonly) {
        this.commands[name] = {
            description: description,
            callback: callback,
            adminonly: adminonly
        };
    }

    // Allows help to print the list of all the commands and their descriptions.
    printHelp() {
        var commands = this.commands;
        console.log(this.isadmin);
        this.addSystemLine('<hr style="border:0;border-top:1px solid #666;width:90%;margin:0;display:inline-block;vertical-align:middle;height:1px;" />');
        if(!this.isadmin){
            this.addSystemLine('<b style="text-decoration:underline">Main commands:</b>');
        }  else {
            this.addSystemLine('<b style="text-decoration:underline">Admin-only commands:</b>');
        }
        for (var cmd in commands) {
            if (commands.hasOwnProperty(cmd)) {
                if(commands[cmd].adminonly){
                    if(this.isadmin && commands[cmd].description != ''){
                        this.addSystemLine('<b>-' + cmd + '</b>: <i>' + commands[cmd].description + '</i>');
                    }
                } else {
                    if(!this.isadmin && commands[cmd].description != ''){
                        this.addSystemLine('<b>-' + cmd + '</b>: <i>' + commands[cmd].description + '</i>');
                    }
                }
            }
        }
        this.addSystemLine('<hr style="border:0;border-top:1px solid #666;width:90%;margin:0;display:inline-block;vertical-align:middle;height:1px;" />');
    }

    checkLatency() {
        // Ping.
        global.startPingTime = Date.now();
        this.socket.emit('pingcheck');
    }

    toggleDarkMode() {
        var LIGHT = '#f2fbff',
            DARK = '#181818';
        var LINELIGHT = '#000000',
            LINEDARK = '#ffffff';

        if (global.backgroundColor === LIGHT) {
            global.backgroundColor = DARK;
            global.lineColor = LINEDARK;
            this.addSystemLine('Dark mode enabled.');
        } else {
            global.backgroundColor = LIGHT;
            global.lineColor = LINELIGHT;
            this.addSystemLine('Dark mode disabled.');
        }
    }

    toggleBorder() {
        if (!global.borderDraw) {
            global.borderDraw = true;
            this.addSystemLine('Showing border.');
        } else {
            global.borderDraw = false;
            this.addSystemLine('Hiding border.');
        }
    }

    toggleMass() {
        if (global.toggleMassState === 0) {
            global.toggleMassState = 1;
            this.addSystemLine('Viewing mass enabled.');
        } else {
            global.toggleMassState = 0;
            this.addSystemLine('Viewing mass disabled.');
        }
    }

    toggleContinuity() {
        if (!global.continuity) {
            global.continuity = true;
            this.addSystemLine('Continuity enabled.');
        } else {
            global.continuity = false;
            this.addSystemLine('Continuity disabled.');
        }
    }

    toggleRoundFood(args) {
        if (args || global.foodSides < 10) {
            global.foodSides = (args && !isNaN(args[0]) && +args[0] >= 3) ? +args[0] : 10;
            this.addSystemLine('Food is now rounded!');
        } else {
            global.foodSides = 5;
            this.addSystemLine('Food is no longer rounded!');
        }
    }
}

module.exports = ChatClient;
