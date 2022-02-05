require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
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

exports.auth = functions.https.onRequest(async (_res, res) => {
    const { url, codeVerifier, state } = twitterClient.generateOAuth2AuthLink(callbackURL, {
        scope: ["tweet.read", "tweet.write", "users.read", "offline.access"],
    });

    await dbRef.set({ codeVerifier, state });

    res.redirect(url);
});

exports.callback = functions.https.onRequest(async (req, res) => {
    const { state, code } = req.query;

    const dbSnapshot = await dbRef.get();
    const { codeVerifier, state: storedState } = dbSnapshot.data();

    if (state !== storedState) {
        return res.status(400).send("Tokens do not match");
    }

    const { accessToken, refreshToken } = await twitterClient.loginWithOAuth2({
        code,
        codeVerifier,
        redirectUri: callbackURL,
    });

    await dbRef.set({ accessToken: accessToken || "", refreshToken: refreshToken || "" });

    res.sendStatus(200);
});

exports.tweet = functions.https.onRequest(async (_req, res) => {
    const { refreshToken } = (await dbRef.get()).data();

    const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } = await twitterClient.refreshOAuth2Token(refreshToken);

    await dbRef.set({ accessToken, refreshToken: newRefreshToken });
    const tweet = await generateTweet();

    const { data } = await refreshedClient.v2.tweet(tweet);

    res.send(data);
});

const openAiConfig = new Configuration({
    apiKey: process.env.OPEN_AI_KEY,
});

const openai = new OpenAIApi(openAiConfig);

const generateSubject = () => {
    const subjects = [
        "ReactJS",
        "React Query",
        "Angular",
        "Redux",
        "Vue",
        "Svelte",
        "TypeScript",
        "Artificial Intelligence",
        "Machine Learning",
        "Linux",
        "Linus Torvalds",
        "Rust Language",
        "Brendan Eich",
        "Kubernetes",
        "Android",
        "Blockchain",
        "Cryptocurrency",
        "Web Development",
        "Mobile Development",
        "HTML",
        "CSS",
        "Tech Culture",
        "Silicon Valley",
        "Back End Development",
        "Full Stack Development",
        "Ruby on Rails",
        "JavaScript",
        "Python",
        "PHP",
        "Git",
        "Software Development Jobs",
        "Software Development Salary",
    ];

    const randomIndex = Math.floor(Math.random() * subjects.length);

    return subjects[randomIndex];
};

const generateWildcard = () => {
    const wildcards = [
        "mention a famous twitter user",
        "use a bunch of emojis",
        "ask people to follow your account",
        "promote your ebook",
        "try to inspire the audience",
        "talk shit about something random",
        "give a shoutout to a tech youtuber",
        "say @omerdotjs put you up to this",
        "give credit to Elon Musk",
        "blame Richard Stallman",
        "threaten to give up on #techtwitter",
        "push a cryptocurrency or a memecoin",
        "incorporate a trending topic",
        "incorporate a meme",
        "brag about your achievements in tech",
        "write an unhinged manifesto",
        "argue about politics",
        "promulgate a conspiracy theory",
        "give your thoughts on Joe Rogan",
        "say hi to your mom",
        "talk about what you had for lunch",
        "complain about how it does not scale well",
    ];

    const randomIndex = Math.floor(Math.random() * wildcards.length);

    return wildcards[randomIndex];
};

const generateTweet = async () => {
    try {
        const subject = generateSubject();
        const wildcard = generateWildcard();
        const message = await openai.createCompletion("text-davinci-001", {
            prompt: `tweet something witty about ${subject} and ${wildcard}, and use a hashtag, and tag #techtwitter`,
            max_tokens: 64,
        });

        return message.data.choices[0].text;
    } catch (err) {
        return err;
    }
};
