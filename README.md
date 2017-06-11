# Fantastic Adventure

## What?
### What is this?
Currently, in Intercom, there is no way to get all conversations that have a certain tag. This project will go through all your Intercom conversations (every. single. one. of. them.) and check if it matches a specific tag, and return that conversation if it does. This results in a _gigantic_ json object of all your conversations that have a tag in them, so you can go ahead and manipulate that.

## How (to use this)? 
### Environment:
I'm currently using:

 - node v8.0.0
 - npm v5.0.0
 - yarn 0.24.6

You'll need to have a `.env` file setup with the following:

 - `INTERCOM_AUTH_TOKEN` : This is your Intercom Authentication Token 
 - `INTERCOM_API` : The Intercom API endpoint.

### Install:
 - run `yarn install`

### Run:
 - run `yarn scrape` 
 - or `node app.js`

#### Debugging
 - `node --inspect-brk app.js` 
   - This will break on the first line of execution
 - Open `chrome://inspect` in the browser
 - Hit the inspect button on the matching Remote/Localhost option
 - It'll be paused, so you'll need to hit play to continue
 - This only works on > Node 6. Or > Node 7. I've only tested it on Node 8, so that's all I can safely say it works with.
 
### Test
![](http://i.imgur.com/LBM55wY.gif)

## Why?
### Why is it called `fantastic-adventure`?
Because GitHub generates the best repository names.



