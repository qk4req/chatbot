const matchAll = require('match-all');
const moment = require('moment');
const express = require('express')();
const server = require('http').createServer(express);
const passport = require('passport');
const {ApiClient, RefreshableAuthProvider, StaticAuthProvider} = require('twitch');
const {ChatClient} = require('twitch-chat-client');
const TwitchStrategy = require('@d-fischer/passport-twitch').Strategy;
const sprintf = require('sprintf-js').sprintf;
const vsprintf = require('sprintf-js').vsprintf;
const countdown = require('countdown');
const plural = require('plural-ru');

const twitch = require('./configs/twitch');
const db = require('./libraries/db');
var chatClient = undefined, tId = undefined;

passport.use(new TwitchStrategy({
		clientID: twitch.clientId,
		clientSecret: twitch.clientSecret,
		callbackURL: twitch.redirectUri,
		scope: twitch.scope
	},
	async function(accessToken, refreshToken) {
		const authProvider = new RefreshableAuthProvider(
			new StaticAuthProvider(twitch.clientId, accessToken),
			{
				clientSecret: twitch.clientSecret,
				refreshToken: refreshToken,
			}
		);
		const apiClient = new ApiClient({authProvider});



		function Chat(args, /*channel, user, */data) {
			this.args = args;
			//this.channel = channel;
			//this.user = user;
			this.data = data;
		}
		Chat.message = function(text, ...params) {
			chatClient.say(twitch.user.name, vsprintf(text, params));
		};
		Chat.randomMessage = function(messages, ...params) {
			chatClient.say(twitch.user.name, vsprintf(messages[Math.floor(Math.random() * messages.length)], params));
		};
		Chat.prototype.errorMessage = function() {
			Chat.randomMessage(
				[
					'/me @%s, я не буду твоим рабом, иди накцуй!',
					'/me @%s, слышь чё, падашел сюда!',
					'/me @%s, чи или не чи?',
					'/me @%s, оба-ёба?',
					'/me @%s, а чё проблемы? Нет? Ща будут...',
					'/me @%s, еблет закрой!'
				],
				this.data.userInfo.displayName
			);
		};
		Chat.prototype.mergeArgs = function(args, forward = false) {
			if (forward) {
				this.args = args.concat(this.args);
			} else {
				this.args = this.args.concat(args);
			}
		};


		var commands = {
			aliases: {
				vk: ['social', ['vk']],
				vkontakte: ['social', ['vk']],
				i: ['social', ['i']],
				inst: ['social', ['i']],
				instagram: ['social', ['i']],
				fb: ['social', ['fb']],
				facebook: ['social', ['fb']],
				tw: ['social', ['tw']],
				u: ['uptime'],
			},
			social: function(chat) {
				var name = chat.args[0], vk = ['vk', 'vkontakte'], fb = ['fb', 'facebook'], tw = ['tw', 'twitter'], i = ['i', 'inst', 'instagram'];
				if (!name || vk.concat(fb).concat(tw).concat(i).indexOf(name)==-1) chat.errorMessage();
				else {
					if (vk.indexOf(name) != -1) {
						Chat.message('/me Держи @%s → → → vk.com/udm_tv', chat.data.userInfo.displayName);
					} else if (i.indexOf(name) != -1) {
						Chat.message('/me Держи @%s → → → instagram.com/qk4req', chat.data.userInfo.displayName);
					} else if (fb.indexOf(name) != -1) {
						Chat.message('/me Накцуй эту Иблокнигу!');
					} else if (tw.indexOf(name) != -1) {
						Chat.message('/me Я не птица! Ко-ко-ко...');
					}
				}
			},
			uptime: async function(chat) {
				var stream = await apiClient.helix.streams.getStreamByUserId(twitch.user.id);

				if (stream !== undefined && stream !== null && stream.startDate) {
					var c = countdown(moment(stream.startDate), moment()), s = '';
			
					if (c.hours !== 0) {
						s += (c.hours + plural(c.hours, ' час', ' часа', ' часов')) + ' ';
					}
			
					if (c.minutes !== 0) {
						s += (c.minutes + plural(c.minutes, ' минуту', ' минуты', ' минут')) + ' ';
					}
			
					if (c.seconds !== 0) {
						s += (c.seconds + plural(c.seconds, ' секунду', ' секунды', ' секунд'));
					}
		
					Chat.randomMessage(
						[
							'/me Зомбоящик уже работает: %s',
							'/me СВЯТЕЙШИЙ держит вкурсе событий уже: %s',
							'/me Программа \'Давай поженимся\' в эфире: %s',
							'/me Программа \'Время ъуй чё покажет\' в эфире: %s'
						], s
					);
				} else {
					Chat.message('/me СВЯТЕЙШИЙ ушел на небеси к праотцам!');
				}
			},
			top: async function(chat) {
				var d = moment(), period = chat.args[0].toUpperCase(), periods = {
					'D': [moment().startOf('day').utc().format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').utc().format('YYYY-MM-DD HH:mm:ss')],
					'DAY': [moment().startOf('day').utc().format('YYYY-MM-DD HH:mm:ss'), moment().endOf('day').utc().format('YYYY-MM-DD HH:mm:ss')],
					//
					'W': [moment().startOf('isoWeek').utc().format('YYYY-MM-DD HH:mm:ss'), moment().endOf('isoWeek').utc().format('YYYY-MM-DD HH:mm:ss')],
					'WEEK': [moment().startOf('isoWeek').utc().format('YYYY-MM-DD HH:mm:ss'), moment().endOf('isoWeek').utc().format('YYYY-MM-DD HH:mm:ss')],
					//
					'M': [moment().startOf('month').utc().format('YYYY-MM-DD HH:mm:ss'), moment().endOf('month').utc().format('YYYY-MM-DD HH:mm:ss')],
					'MONTH': [moment().startOf('month').utc().format('YYYY-MM-DD HH:mm:ss'), moment().endOf('month').utc().format('YYYY-MM-DD HH:mm:ss')],
					//
					'A': [moment().subtract(100, 'year').utc().format('YYYY-MM-DD HH:mm:ss'), moment().utc().format('YYYY-MM-DD HH:mm:ss')],
					'AT': [moment().subtract(100, 'year').utc().format('YYYY-MM-DD HH:mm:ss'), moment().utc().format('YYYY-MM-DD HH:mm:ss')],
					'ALL-TIME': [moment().subtract(100, 'year').utc().format('YYYY-MM-DD HH:mm:ss'), moment().utc().format('YYYY-MM-DD HH:mm:ss')],
				};
				if (!Object.keys(periods).includes(period)) chat.errorMessage();
				else {
					db.execute("SELECT d.`from`, SUM(d.amount) AS total FROM donations AS d WHERE (created_at >= ? AND created_at <= ?) GROUP BY d.`from` ORDER BY total DESC LIMIT 3;", periods[period])
					.then(([rows,fields]) => {
							if (rows.length === 0) {
								Chat.randomMessage([
									'/me Никто не принес, поэтому донатеров нет...',
									'/me Cтримлер в данный момент живет на воде и сухарях...'
								]);
							} else {
								const symbols = [
									'①', '②', '③'
								];
								Chat.randomMessage([
									`/me TOP-${rows.length} ДОНАТОРОВ ЗА ${(['D', 'DAY'].includes(period) ? 'ЭТОТ ДЕНЬ' : (['W', 'WEEK'].includes(period) ? 'ЭТУ НЕДЕЛЮ' : (['M', 'MONTH'].includes(period) ? 'ЭТОТ МЕСЯЦ' : 'ВСЕ ВРЕМЯ')))}:`
								]);
								rows.forEach(function(item, i) {
									Chat.message('/me %s %s - %f₽', symbols[i], item['from'], item['total']);
								});
							}
					})
					.catch(console.log);
				}
			},
			title: async function(chat) {
				if (!chat.data.userInfo.isMod && !chat.data.userInfo.isFounder && !chat.data.userInfo.isBroadcaster) chat.errorMessage();
				else {
					var newTitle = chat.args[0];
					/*
					**********************BUG**********************
					const channel = await apiClient.helix.channels.updateChannelInfo(twitch.user.id, {
						title: newTitle
					});
					if (channel === undefined || channel === null)
						chat.randomMessage([
							'/me Название прно-фильмчика переименовано на: \"%s\"'
						], newTitle);
					**********************BUG**********************
					*/
					const channel = await apiClient.kraken.channels.updateChannel(twitch.user.id, {
						status: newTitle
					});
					if (channel === undefined || channel === null)
						Chat.randomMessage([
							'/me Название прно-фильмчика переименовано на: \"%s\"'
						], newTitle);
				}
			},
			category: async function(chat) {
				if (!chat.data.userInfo.isMod && !chat.data.userInfo.isFounder && !chat.data.userInfo.isBroadcaster) chat.errorMessage();
				else {
					var newCategory = chat.args[0];
					if (typeof newCategory === 'string' && newCategory.length > 0) {
						const category = await apiClient.helix.games.getGameByName(newCategory);
						if (category !== undefined && category !== null) {
							const channel = await apiClient.kraken.channels.updateChannel(twitch.user.id, {
								game: category.name
							});
							if (channel === undefined || channel === null)
								Chat.randomMessage([
									'/me Категория проморолика изменена на: \"%s\"'
								], category.name);
						} else chat.errorMessage();
					} //else if (Number.isInteger(newCategory)) {
					//} 
					else chat.errorMessage();
				}
			},
		},
		proxy = new Proxy(commands, {
			get: (target, prop) => {
				if (target.hasOwnProperty(prop) && typeof target[prop] === 'function') {
					return function(chat) {
						Reflect.apply(target[prop], undefined, [chat]);
					};
				} else if (target.aliases.hasOwnProperty(prop)) {
					return function(chat) {
						var a = target.aliases[prop];
						if (typeof a === 'string') {
							Reflect.apply(target[a], undefined, [chat]);
						} else if (Array.isArray(a)) {
							if (Array.isArray(a[1])) {
								chat.mergeArgs(a[1], true);
							}
							if (typeof a[2] === 'string' && a[2].length > 0) {
								chat.channel = a[2];
							}
							if (typeof a[3] === 'string' && a[3].length > 0) {
								chat.user = a[3];
							}
							Reflect.apply(target[a[0]], undefined, [chat]);
						}
					};
				} else {
					return function (chat) {
						chat.errorMessage();
					};
				}
			}
		});


		var listeners = {
			connect: function() {
				console.log('Connected!');
			},
			join: function() {
				if (tId === undefined) {
					tId = setInterval(function() {
						if (chatClient !== undefined && chatClient.isConnected) {
							Chat.randomMessage(
								[
									'/me ТУТ СИСЬКИ → → → vk.com/udm_tv',
									'/me МАМКА СОБЛАЗНИЛА СЫНОЧКА, ПРОВЕРЯЙ → → → vk.com/udm_tv',
									'/me ОТЕЦ НАКАЗАЛ ПРИЕМНУЮ ДОЧЬ → → → vk.com/udm_tv',
									'/me ПОРНО БЕЗ СМС И РЕГИСТРАЦИИ → → → vk.com/udm_tv'
								]
							);
						}
					}, 150000);
				}
			},
			message: function(channel, user, message, data) {
				var command = message.trim();

				if (command.indexOf('!') === 0) {
					if (command.indexOf(' ') !== -1) {
						var name = command.substr(1, (command.indexOf(' ')-1)).toLowerCase(),
						args = matchAll(command.substr((command.indexOf(' ')+1), command.length), /[\'\"]{1}([^\'\"]+)[\'\"]{1}|([^\'\s]+)/gm).toArray();
					}
					else {
						var name = command.substr(1, command.length),
						args = [];
					}
					Reflect.apply(proxy[name], undefined, [new Chat(args, /*channel, user, */data)]);
				};
			},
			disconnect: function(e) {
				console.log('Disconnected!');
			}
		}
		if (chatClient === undefined) {
			console.log('Connecting to Twitch chat...');
			chatClient = new ChatClient(authProvider, {channels: [twitch.user.name]});
			chatClient.onConnect(listeners.connect);
			chatClient.onJoin(listeners.join);
			chatClient.onMessage(listeners.message);
			chatClient.onDisconnect(listeners.disconnect);
			await chatClient.connect();
		} else {
			console.log('Reconnecting to Twitch chat...');
			/*if (chatClient.isConnected) chatClient._connection.disconnect().then(function() {
				chatClient.removeListener(onConnect);
				chatClient.removeListener(onDisconnect);
				chatClient.connect();
			}); else chatClient.connect();*/
			if (!chatClient.isConnected) chatClient.connect();
			else {
				chatClient._connection.disconnect().then(async function() {
					//chatClient = new ChatClient(authProvider, {channels: [twitch.user.name]});
					//chatClient.onConnect(onConnect);
					//chatClient.onDisconnect(onDisconnect);
					await chatClient.connect();
				});
			}
		}
	}
));


express.get('/twitch', passport.authenticate('twitch'));


server.listen(6699, function() {
	console.log('Listen 6699 port!');
});