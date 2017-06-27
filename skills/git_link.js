'use strict';

var kv = require('beepboop-persist')()

module.exports = controller => {

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

}

