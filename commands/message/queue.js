const { EmbedBuilder } = require('discord.js');
const shiva = require('../../shiva');

const COMMAND_SECURITY_TOKEN = shiva.SECURITY_TOKEN;

module.exports = {
    name: 'queue',
    aliases: ['q', 'list', 'playlist', 'songs'],
    description: 'Show the music queue',
    securityToken: COMMAND_SECURITY_TOKEN,
    
    async execute(message, args, client) {
        if (!shiva || !shiva.validateCore || !shiva.validateCore()) {
            const embed = new EmbedBuilder()
                .setDescription('❌ System core offline - Command unavailable')
                .setColor('#FF0000');
            return message.reply({ embeds: [embed] }).catch(() => {});
        }

        message.shivaValidated = true;
        message.securityToken = COMMAND_SECURITY_TOKEN;

        setTimeout(() => {
            message.delete().catch(() => {});
        }, 4000);
        
        const ConditionChecker = require('../../utils/checks');
        const checker = new ConditionChecker(client);
        
        try {
            const conditions = await checker.checkMusicConditions(
                message.guild.id, 
                message.author.id, 
                message.member.voice?.channelId
            );

            if (!conditions.hasActivePlayer) {
                const embed = new EmbedBuilder().setDescription('❌ No music is currently playing!');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            const player = conditions.player;
            const queue = player.queue;
            const currentTrack = player.current;
            
            if (!currentTrack && queue.size === 0) {
                const embed = new EmbedBuilder().setDescription('📜 Queue is empty!');
                return message.reply({ embeds: [embed] })
                    .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
            }

            const page = parseInt(args[0]) || 1;
            const songsPerPage = 15;
            const startIndex = (page - 1) * songsPerPage;
            const endIndex = startIndex + songsPerPage;
            const totalPages = Math.ceil(queue.size / songsPerPage);

            let description = '';

            if (currentTrack) {
                const duration = formatDuration(currentTrack.info.length);
                description += `🎵 **Now Playing**\n**${currentTrack.info.title}**\nBy: ${currentTrack.info.author}\nDuration: ${duration}\nRequested by: <@${currentTrack.info.requester.id}>\n\n`;
            }

            if (queue.size > 0) {
                const queueTracks = Array.from(queue).slice(startIndex, endIndex);
                if (queueTracks.length > 0) {
                    description += `📋 **Up Next (${queue.size} songs)**\n`;
                    description += queueTracks.map((track, index) => {
                        const position = startIndex + index + 1;
                        const duration = formatDuration(track.info.length);
                        return `\`${position}.\` **${track.info.title}** \`[${duration}]\`\nRequested by: <@${track.info.requester.id}>`;
                    }).join('\n\n');
                }

                if (totalPages > 1) {
                    description += `\n\nPage ${page}/${totalPages}`;
                } else {
                    description += `\n\nTotal: ${queue.size} songs in queue`;
                }
            }

            const embed = new EmbedBuilder().setDescription(description);
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 10000));

        } catch (error) {
            console.error('Queue command error:', error);
            const embed = new EmbedBuilder().setDescription('❌ An error occurred while fetching the queue!');
            return message.reply({ embeds: [embed] })
                .then(m => setTimeout(() => m.delete().catch(() => {}), 3000));
        }
    }
};

function formatDuration(duration) {
    if (!duration) return '0:00';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
