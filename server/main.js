import { Meteor } from 'meteor/meteor';
import { LinksCollection, GamesCollection, Databases,Types } from '/imports/api/links';
import './apollo'
import Analyzers from './analyzers'


function insertLink({ title, url }) {
  LinksCollection.insert({title, url, createdAt: new Date()});
}

Meteor.methods({
  "analyze": function(db_id) {
    const db = Databases.findOne(db_id)
    if (Analyzers[db.type]) {
      try {
        Analyzers[db.type](db, this.userId)
      } catch(e) {
        console.log(e)
      }
    }
  }
})
//export MONGO_URL="mongodb://root:z2ctzAF9W0@localhost:27017/admin"

Meteor.startup(() => {
  // If the Links collection is empty, add some data.
  Types.remove({})
  if (Databases.find().count() === 0) {
    Databases.insert({
      name: 'localhost mysql',
      type: 'mysql',
      database: '',
      username: 'root',
      password: 'college',
      host: 'localhost',
      port: 3306,
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
