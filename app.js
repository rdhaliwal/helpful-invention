require('es6-promise').polyfill();
require('isomorphic-fetch');
require('dotenv').config();
const PromiseThrottle = require('promise-throttle');
const json2csv = require('json2csv');
const fs = require('fs');
const argv = require('yargs').argv;
const TAG_TO_MATCH = argv.tag;

const INTERCOM_API = process.env.INTERCOM_API;
const INTERCOM_AUTH_TOKEN = process.env.INTERCOM_AUTH_TOKEN;
// const INTERCOM_PAGE_COUNT = 51;
const INTERCOM_PAGE_COUNT = 5;
// const INTERCOM_PAGE_COUNT = 1;
const PER_PAGE = 60;
const PROMISE_THROTTLE_RPS = 1;

const generateCSV = (data) => {
  try {
    var result = json2csv({ data: data });
    // console.log(result);
    fs.writeFile('result.csv', result, (err) => {
      if (err) throw err;
      console.log('File saved');
    });
  } catch (err) {
    console.error(err);
  }
};

const extractData = (data) => {
  // console.log(JSON.stringify(data, null, 4));

  let result = {};
  result.id = data.id;
  result.created_at = data.created_at;
  result.updated_at = data.updated_at;
  result.body = data.conversation_parts.conversation_parts.map(c => c.body).join(' | ');
  result.subject = data.conversation_message.subject;
  result.tags = data.tags.tags.map(t => t.name);
  result.user = data.user;
  return result;
};

const fetchDetailedConversation = (conversationId) => {
  console.log(`FETCH - BEGIN - Conversation ${conversationId}: ${Date()}`);
  return fetch(`${INTERCOM_API}/conversations/${conversationId}?display_as=plaintext`, {
    method: 'GET',
    headers:{
      'Accept': 'application/json',
      'Authorization': `Bearer ${INTERCOM_AUTH_TOKEN}`
    }
  }).then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw Error(response.statusText);
    }
  })
  .then (json => {
    console.log(`FETCH - SUCCESS - Conversation ${conversationId}: ${Date()}`);
    let tagList = json.tags.tags;
    let hasMatchingTags = tagList.length > 0;

    if (hasMatchingTags && TAG_TO_MATCH !== undefined) {
      let matchingTags = tagList.filter(t => t.id === `${TAG_TO_MATCH}`);
      hasMatchingTags = matchingTags.length > 0;
    }

    if (hasMatchingTags) {
      return extractData(json);
    } else {
      return null;
    }
  }).catch((err, json) => {
    console.log(`FETCH - ERROR - Conversation ${conversationId}`);
    console.error(err);
  });
};

const fetchAllDetailedConversations = (idList) => {
  let allConversations = [];

  for (i = 0; i <= idList.length; i++) {
    let promiseThrottle = new PromiseThrottle({
      requestsPerSecond: PROMISE_THROTTLE_RPS
      // promiseImplementation: Promise
    });
    allConversations.push(promiseThrottle.add(fetchDetailedConversation.bind(this, idList[i])));
  }
  console.log(allConversations);

  return Promise.all(allConversations)
    .then(function(conversationList) {
      return conversationList;
    }).catch((err) => {
      console.error(err);
    });
};

const fetchConversationList = (pageNumber) => {
  console.log(`FETCH - BEGIN - Conversation Page ${pageNumber}: ${Date()}`);
  return fetch(`${INTERCOM_API}/conversations?per_page=${PER_PAGE}&page=${pageNumber}`, {
    method: 'GET',
    headers:{
      'Accept': 'application/json',
      'Authorization': `Bearer ${INTERCOM_AUTH_TOKEN}`
    }
  }).then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw Error(response.statusText);
    }
  })
  .then (json => {
    console.log(`FETCH - SUCCESS - Conversation Page ${pageNumber}`);
    let conversationIds = json.conversations.map(c => c.id);
    return conversationIds;
  }).catch((err) => {
    console.log(`FETCH - ERROR - Conversation Page ${pageNumber}`);
    console.error(err);
  });
};

const fetchAllConversationIds = () => {
  let allConversations = [];

  for (i = 1; i <= INTERCOM_PAGE_COUNT; i++) {
    let promiseThrottle = new PromiseThrottle({
      requestsPerSecond: PROMISE_THROTTLE_RPS
      // promiseImplementation: Promise
    });
    allConversations.push(promiseThrottle.add(fetchConversationList.bind(this, i)));
  }

  return Promise.all(allConversations)
    .then(function(idList) {
      return idList;
    }).catch((err) => {
      console.error(err);
    });
};

const begin = async () => {
  let idList = await fetchAllConversationIds();
  let flattenedIdList = [].concat(...idList);
  console.log(JSON.stringify(flattenedIdList, null, 4));

  let conversationList = await fetchAllDetailedConversations(flattenedIdList);
  let detailedConversations = conversationList.filter(c => (c !== undefined && c !== null));
  // console.log(JSON.stringify(detailedConversations, null, 4));

  generateCSV(detailedConversations);
};

begin();
