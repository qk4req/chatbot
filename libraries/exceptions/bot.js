const vsprintf = require('sprintf-js').vsprintf;

var BotError = function(message, args, target = null) {
	this.name = 'BotError';
	this.target = target;
	if (Array.isArray(message) ) {
		if (message.length === 1) {
			message = message[0];
		} else if (message.length > 1) {
			message = Math.floor(Math.random() * message.length);
		} else throw new Error;
	}
	this.message = vsprintf(message, (target === null ? args : [target].concat(args)));
	this.args = args;
	this.stack = (new Error()).stack;
}
BotError.prototype.__proto__ = Error.prototype;

module.exports = BotError;