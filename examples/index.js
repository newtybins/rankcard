const { CardGenerator } = require('../dist/index');
const Discord = require('discord.js');
const { users: DB } = require('./db.json');

// A function that calculates the amount of XP in a level
const xpForLevel = level => Math.floor((5 / 6) * level * (2 * level ** 2 + 27 * level + 91));

// Create a Discord.js client and prepare it
const client = new Discord.Client({
    intents: ['GUILDS', 'GUILD_PRESENCES', 'GUILD_MEMBERS', 'GUILD_MESSAGES']
});

// Create a card generator and prepare it
const generator = new CardGenerator({
    xpForLevel
});

// Make the online status colour pink for whatever reason
generator.statusColours = {
    online: '#fc85e7'
};

client.login('your-super-secret-token');

client.on('ready', () => console.log('I have connected to Discord!'));

client.on('messageCreate', async msg => {
    if (msg.content.startsWith('!rank')) {
        const member = msg.mentions.members.first() ?? msg.member;

        // Ensure the user is in our mock-up DB
        const userInDB = DB.filter(u => u.id === member.user.id)[0];

        if (userInDB) {
            // Find the rank of our user
            const rank =
                DB.sort((a, b) => a.level + b.level)
                    .map(u => u.id)
                    .indexOf(userInDB.id) + 1;

            // Generate and build a card
            generator
                .generateCard({ rank, member, level: userInDB.level })
                .then(res => msg.reply({ files: [res] }));
        }
    }
});
