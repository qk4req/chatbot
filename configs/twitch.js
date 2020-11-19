class Twitch {
	constructor () {
		return({
					user: {
						id: 419357906,
						name: 'qk4req'
					},
					clientId: '9m5avw04fjx52da0z9hwzbiothlthp',
					clientSecret: 'rcxmpuk967o3bdwk0f2hc1l0v3cnbv',
					redirectUri: 'http://localhost:3333/twitch',
					scope: 'user_read user:read:email channel_subscriptions chat:read chat:edit'//
			});
	}
}
module.exports = new Twitch();