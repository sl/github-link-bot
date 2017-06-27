'use strict';

const Botkit = require('botkit');

const token = process.env.SLACK_TOKEN;

var controller = Botkit.slackbot({
  retry: Infinity,
  debug: false
});

// Assume single team mode if we have a SLACK_TOKEN
if (token) {
  console.log('Starting github-link-bot in single-team mode');
  controller.spawn({
    token: token
  }).startRTM((err, bot, payload) => {
    if (err) {
      throw Error(err);
    }

    console.log('Connected to slack RTM');
  });
} else {
  console.log('Starting in Beep Boop multi-team mode');
  require('beepboop-botkit').start(controller, {
    debug: true
  });
}

// when the bot joins a channel, give information about its usage
controller.on('bot_channel_join', (bot message) => {
  bot.reply(message, 'Hi! I\'m Link Bot! To let me know what github repository to link to, type: @linkbot <github-repo>');
});

controller.on('direct_mention',function(bot,message) {
  console.log(message);
});

controller.hears(['\#[0-9]+'], ['message_received'], (bot, message) => {
  const re = /\#([0-9]+)/g;
  var links = [];
  var m;
  do {
    m = re.exec(message);
    if (m) {
      links.push(m);
    }
  } while (m);
  bot.reply(message, links.join(', '));
});


