import { Meteor } from 'meteor/meteor';
import { LinksCollection, GamesCollection } from '/imports/api/links';
import './apollo'

function insertLink({ title, url }) {
  LinksCollection.insert({title, url, createdAt: new Date()});
}

Meteor.startup(() => {
  // If the Links collection is empty, add some data.
  GamesCollection.remove({})
  if (GamesCollection.find().count() === 0) {
    GamesCollection.insert({
      players: [1,2,3],
      game_objects: [{
        gamevalue: 1,
        othervalue: 2
      }],
      score: 0,
      started: false,
    })
  }
  if (LinksCollection.find().count() === 0) {
    insertLink({
      title: 'Do the Tutorial',
      url: 'https://www.meteor.com/tutorials/react/creating-an-app'
    });

    insertLink({
      title: 'Follow the Guide',
      url: 'http://guide.meteor.com'
    });

    insertLink({
      title: 'Read the Docs',
      url: 'https://docs.meteor.com'
    });

    insertLink({
      title: 'Discussions',
      url: 'https://forums.meteor.com'
    });
  }
});
