# Helpful Invention

## What?
### What is this?
Currently, in Intercom, there is no way to get all conversations that have a certain tag. This project will go through all your Intercom conversations (every. single. one. of. them.) and check if it matches a specific tag, and return that conversation if it does. This results in a _gigantic_ json object of all your conversations that have a tag in them, so you can go ahead and manipulate that.

## How (to use this)? 
### Environment:
I'm currently using:

 - node v8.6.0
 - npm v5.3.0
 - yarn 1.1.0

There's an `.nvmrc` file to use if you need

### Install:
 - run `yarn install`

### Configure:
You'll need to have a `.env` file setup with the following:

 - `INTERCOM_AUTH_TOKEN` : This is your Intercom Authentication Token 
 - `INTERCOM_API` : The Intercom API endpoint.

It's currently configured to get the last 50 pages. This can be adjusted by editing the `INTERCOM_PAGE_COUNT` variable before running the script. It means that you can't actually export for a specific time period, just by a specific number of the last few pages.

### Run:

 - Run `yarn conversations` to export all conversations that have any tag

If you want to export conversations only for a specific tag:

 - Run `yarn tags` to fetch a list of all your tags in Intercom
   - this will print a list of all the tags and their ids, for use later if you want
 - Run `yarn conversations -- --tag='12343'` to export conversations that have only that tag
   - `--tag` is the id of the tag. 
 - The output will be saved in `result.csv`

#### Debugging
 - `node --inspect-brk app.js` 
   - This will break on the first line of execution
 - Open `chrome://inspect` in the browser
 - Hit the inspect button on the matching Remote/Localhost option
 - It'll be paused, so you'll need to hit play to continue
 - This theoretically only works on Node 6+, but i've only tested it on Node 8.6.0 so that's all I can safely say it works with.
 
### Test
[Yes.](https://i.imgur.com/LBM55wY.gif)

