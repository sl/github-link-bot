'use strict';

const Botkit = require('botkit');
var kv = require('beepboop-persist')()

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
controller.on('bot_channel_join', (bot, message) => {
  bot.reply(message, 'Hi! I\'m Link Bot! To let me know what github repository to link to, type: `@linkbot set-repo <github-repo>`');
});

controller.on('direct_mention',function(bot, message) {
  if (message.text.startsWith('set-repo ') && message.text.length > 9) {
    var name = message.text.substring(9)
    kv.set(message.team, name, (err) => {
      if (!err) {
        bot.reply(message, 'Successfully set the repository to ' + name);
      } else {
        bot.reply(message, 'Error setting the repository:\n' + err);
      }
    });
  } else if (message.text.startsWith('get-repo')) {
    kv.get(message.team, (err, val) => {
      if (err) {
        bot.reply(message, 'Error getting the slack team\'s github repository: ' + err);
      }
      if (val) {
        bot.reply(message, 'The repository is currently set to: ' + val);
      } else {
        bot.reply(message, 'There is currently no configured repository for this team! Use `@linkbot set-repo <github-repo>` to specify one!');
      }
    });

  }
});

controller.on('ambient', (bot, message) => {
  console.log(message);
})

controller.hears('#[0-9]+', ['ambient'], (bot, message) => {
  console.log('heard message');
  const re = /\#([0-9]+)/g;
  var links = [];
  var m;
  do {
    m = re.exec(message.text);
    if (m) {
      links.push(m[1]);
    }
  } while (m);
  if (links.length !== 0) {
    // get the repository name
    kv.get(message.team, (err, val) => {
      if (err) {
        bot.reply(message, "I don't know what github repository to look for issues in! Be sure to tell me your repo using `@linkbot set-repo <github-repo>`");
      }
      bot.reply(message, links.map((x) => {
        return '<https://github.com/' + val + '/issues/' + x + '|' + val + ': #' + x + '>';
      }).join(', '));
    });
  }
});


