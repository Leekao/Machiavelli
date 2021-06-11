import { Meteor } from 'meteor/meteor';
import { LinksCollection, GamesCollection, Databases,Types } from '/imports/api/links';
import './apollo'
import Analyzers from './analyzers'

function insertLink({ title, url }) {
  LinksCollection.insert({title, url, createdAt: new Date()});
}

Meteor.methods({
  "analyze": function({db_id}) {
    const db = Databases.findOne({_id: db_id})
    Analyzers.pg(db, this.userId)
  }
})

Meteor.startup(() => {
  // If the Links collection is empty, add some data.
  Databases.remove({})
  if (Databases.find().count() === 0) {
    Databases.insert({
      name: 'localhost pg',
      type: 'pg',
      database: '',
      username: 'postgres',
      password: "z2ZBTy7jNM",
      host: '127.0.0.1',
      port: 5435,
    })
    Databases.insert({
      name: 'localhost mongodb',
      type: 'mongodb',
      database: 'test',
      username: 'root',
      password: 'z2ctzAF9W0',
      host: 'localhost',
      port: 27017,
    })
  }
  GamesCollection.remove({})
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
