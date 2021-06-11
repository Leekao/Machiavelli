import { Mongo } from 'meteor/mongo';

export const LinksCollection = new Mongo.Collection('links');
export const GamesCollection = new Mongo.Collection('games');
export const Databases = new Mongo.Collection('dbs');
export const Types = new Mongo.Collection('types');
