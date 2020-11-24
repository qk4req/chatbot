class Twitch {
	constructor () {
		return({
					user: {
						id: 419357906,
						name: 'qk4req'
					},
					clientId: 'mhaz8pzuw6blpsfhv1sf9e2464ybno',
					clientSecret: 'hzyfwsw8q0l4qceeq8wpawb51esr4v',
					redirectUri: 'http://localhost:6699/twitch',
					scope: 'user_read channel_read channel_editor channel_subscriptions user:read:email user:edit:broadcast channel:read:subscriptions channel:manage:broadcast chat:read chat:edit'//
			});
	}
}
module.exports = new Twitch();