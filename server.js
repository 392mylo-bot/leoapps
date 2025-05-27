require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const { Client, GatewayIntentBits, Partials, ActivityType } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Discord Client
const discordClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel],
});

discordClient.once('ready', () => {
  console.log(`Logged in as ${discordClient.user.tag}`);
  discordClient.user.setPresence({ activities: [{ name: "RRS Law Enforcement", type: ActivityType.Watching }], status: 'online' });
});

// Endpoint for new applications
app.post('/new-application', async (req, res) => {
  const { userId, username } = req.body;

  if (!userId || !username) {
    return res.status(400).send('Missing userId or username');
  }

  try {
    const channelId = process.env.CHANNEL_ID; // set this in your env vars
    const channel = await discordClient.channels.fetch(channelId);
    if (!channel) {
      return res.status(500).send('Channel not found');
    }

    const { MessageActionRow, MessageButton } = require('discord.js');

    const row = new MessageActionRow()
      .addComponents(
        new MessageButton()
          .setCustomId(`accept_${userId}`)
          .setLabel('Accept')
          .setStyle('SUCCESS'),
        new MessageButton()
          .setCustomId(`deny_${userId}`)
          .setLabel('Deny')
          .setStyle('DANGER')
      );

    await channel.send({
      content: `Would you like to accept or deny <@${userId}> (${username})'s application?`,
      components: [row],
    });

    res.status(200).send('Prompt sent');
  } catch (err) {
    console.error('Error sending application prompt:', err);
    res.status(500).send('Error');
  }
});

// Handle interactions
const { InteractionType } = require('discord.js');

discordClient.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, userId] = interaction.customId.split('_');

  try {
    const user = await discordClient.users.fetch(userId);
    if (!user) {
      return interaction.reply({ content: 'User not found!', ephemeral: true });
    }

    if (action === 'accept') {
      await user.send('Your application was accepted! Join us at discord.gg/rrsleo');
      await interaction.reply({ content: `Accepted and DM sent to <@${userId}>`, ephemeral: true });
    } else if (action === 'deny') {
      await user.send('Your application was denied. You may resubmit.');
      await interaction.reply({ content: `Denied and DM sent to <@${userId}>`, ephemeral: true });
    }
  } catch (err) {
    console.error('Error handling button:', err);
    await interaction.reply({ content: 'Error processing action.', ephemeral: true });
  }
});

// Login to Discord
discordClient.login(process.env.DISCORD_TOKEN);
