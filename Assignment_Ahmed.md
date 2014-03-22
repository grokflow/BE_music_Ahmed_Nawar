Please feel free to ask us questions.

**Make your own Github repo named `BE_music_<YOUR_NAME>`, download this gist and add the files to it. Create a README.md file with simple instructions to run it.**

The focus of this assignment is on the **web back end** (or **server side**). We will be looking specially for good practices and your development process.

You are not supposed to solve this problem with the tools you have most skill at, rather it is recommended to use Node.js with either Express.js or Koa.js as frameworks.

Also, use MongoDB for this assignment. You can either use the mongo driver or mongoose.

## Fictional MVP!

This fictional client have asked for a recommendation system for his social music player system.
He wants need you to essentially take note of what music an user has listened to, which people they follow and from there recommend some songs. There is no like or dislike so far, no need to worry about it for now.

In this system there are few "elements"; 

- **musics**: have an ID and a list of tags (see `musics.json`)
- **users**: have an ID, follow N other users, have heard Y musics in the past. 

How to model or index this data is up to you.

### There should be 3 end points

##### `POST /follow`
Add one follow relationship (see `follows.json`)

the request body have 2 params:
- from: \<user ID\>
- to: \<user ID\>

##### `POST /listen`
Add one song as the user have just listened ( see `listen.json` )

the request body have 2 params:
- user: \<user ID\>
- music: \<music ID\>

##### `GET /recommendations`
Return 5 music recommendations to this user, they should be sorted by relevance

Query string has:
- user: \<user ID\>

response looks like:

```json
{
  "list": ["<music ID>", "<music ID>", "<music ID>", "<music ID>", "<music ID>"]
}
```

--

It's supposed to be a simplistic recommendation engine, which takes into account these main components:
- based of what musics they heard before
- people who the user followees of first degree, and maybe even folowees of folowees
- maximize for discovery of new songs

#### make it run!

We expect 2 parts:

1. a server that only has business logic (the endpoints) with the DB, it should load `musics.json` upon server start, but other files will be loaded by:
2. a series of commands that load the data through your endpoints and finally get a recommendation (see `script.md`)

Finally, make any type of runner that start your server and run the script. Whether the server will be running or not after the results finish is up to you. It's also ok to have one command to run put the server up running and another to run script.

#### hints
- there isn't one right answer, but the modeling of the problem matter
- also, don't worry about finding a perfect solution to this, it's a MVP
- implement the script correctly
- make simple instructions to execute the server and the script

Before you start or shoot us questions (don't hesitate ;) please read and fill `QnA.md`