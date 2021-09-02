const { RankCard } = require('../lib/index');
const Discord = require('discord.js');
const { users: DB } = require('./db.json');

// A function that calculates the amount of XP in a level
const xpForLevel = (level) => Math.floor((5 / 6) * level * (2 * level ** 2 + 27 * level + 91));

// Create a Discord.js client and prepare it
const client = new Discord.Client({
	intents: ['GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_MESSAGES']
});

client.login('your-super-secret-token');

client.on('ready', () => console.log('I have connected to Discord!'));

client.on('messageCreate', async msg => {
	if (msg.content === '!rank') {
		// Ensure the user is in our mock-up DB
		const userInDB = DB.filter(u => u.id === msg.author.id)[0];

		if (userInDB) {
			const rank = DB.sort((a, b) => a.level + b.level).map(u => u.id).indexOf(userInDB.id) + 1;

			// Generate the card
			const card = new RankCard({
				level: userInDB.level,
				xpForLevel,
				user: msg.member,
				rank
			});

			// Build it
			card.build().then(res => {
				const attachment = new Discord.MessageAttachment(res);
				msg.reply({ files: [attachment] });
			});
		}
	}
});
