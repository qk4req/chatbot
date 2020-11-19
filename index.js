const axios = require('axios');
const moment = require('moment');
const express = require('express')();
const server = require('http').createServer(express);
const passport = require('passport');
const {ApiClient, RefreshableAuthProvider, StaticAuthProvider} = require('twitch');
const {ChatClient} = require('twitch-chat-client');
const TwitchStrategy = require('@d-fischer/passport-twitch').Strategy;
const twitch = require('./configs/twitch');
const BotError = require('./libraries/exceptions/bot')

passport.use(new TwitchStrategy({
		clientID: twitch.clientId,
		clientSecret: twitch.clientSecret,
		callbackURL: twitch.redirectUri,
		scope: twitch.scope
	},
	async function(accessToken, refreshToken) {
		console.log('Connected to Twitch!');
		const authProvider = new RefreshableAuthProvider(
			new StaticAuthProvider(twitch.clientId, accessToken),
			{
				clientSecret: twitch.clientSecret,
				refreshToken: refreshToken,
			}
		);
		const apiClient = new ApiClient({authProvider});

		const chatClient = new ChatClient(authProvider, {channels: ['qk4req']});
		await chatClient.connect();


		var 
		messages = {
			RU: {
				unknownCommand: '/me @%s я не буду твоим рабом, иди накцуй!',
				parametersInvalid: '/me @%s, слышь чё, падашел сюда!',
				streamOffline: '/me ПРОСВЕЩЕННЫЙ ушел на небеси к праотцам. И ты отправляйся следом!',
				vk: '/me Держи братик → → → vk.com/qk4req',
				i: '/me Держи братик → → → instagram.com/qk4req',
				fb: '/me Накцуй эту Иблокнигу!',
				tw: '/me Я не птица! Ко-ко-ко...'
			}
		},
		commands = {
			social: function(args, displayName) {
				var name = args[0], vk = ['vk', 'vkontakte'], fb = ['fb', 'facebook'], tw = ['tw', 'twitter'], i = ['i', 'inst', 'instagram'];
				if (!name || vk.concat(fb).concat(tw).concat(i).indexOf(name)==-1) throw new BotError(messages.RU.parametersInvalid, [], displayName);
				if (vk.indexOf(name) != -1) {
					tmi.write(messages.RU.vk);
				} else if (i.indexOf(name) != -1) {
					tmi.write(messages.RU.i);
				} else if (fb.indexOf(name) != -1) {
					tmi.write(messages.RU.fb);
				} else if (tw.indexOf(name) != -1) {
					tmi.write(messages.RU.tw);
				}
			},
		};

		chatClient.onMessage((channel, user, message) => {
			console.log(message);
			var command = message.trim();

			if (command.indexOf('!') === 0) {
				if (command.indexOf(' ') != -1) var name = command.substr(1, (command.indexOf(' ')-1)).toLowerCase(), args = command.substr((command.indexOf(' ')+1), command.length).split(' '); 
				else var name = command.substr(1, command.length), args = [];
				if (!commands.hasOwnProperty(name)) throw new BotError(messages.RU.unknownCommand, [], user);
				else {
					//args.unshift(displayName);
					Reflect.apply(commands[name], undefined, [args, user]);
				}
			};
		});

		process.on('uncaughtException', (e) => {
			if (e instanceof BotError) {
				chatClient.say(twitch.user.name, e.message);
			} else {
				console.log(e);
				//process.exit();
			}
		});
	}
));


express.get('/twitch', passport.authenticate('twitch'));


server.listen(3333, function() {
	console.log('Listen 3333 port!');
});