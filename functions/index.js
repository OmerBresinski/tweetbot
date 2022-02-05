const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const dbRef = admin.firestore().doc("tokens/demo");

const TwitterApi = require("twitter-api-v2").default;
const twitterClient = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
});

const callbackURL = "http://127.0.0.1:5000/tweetbot-d8c57/us-central1/callback";

exports.auth = functions.https.onRequest((request, response) => {});

exports.callback = functions.https.onRequest((request, response) => {});

exports.tweet = functions.https.onRequest((request, response) => {});
