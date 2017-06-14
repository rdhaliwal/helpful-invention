require('es6-promise').polyfill();
require('isomorphic-fetch');
require('dotenv').config();
const PromiseThrottle = require('promise-throttle');
const argv = require('yargs').argv
const TAG_TO_MATCH = `${argv.tag}`;

const INTERCOM_API = process.env.INTERCOM_API;
const INTERCOM_AUTH_TOKEN = process.env.INTERCOM_AUTH_TOKEN;
// const INTERCOM_PAGE_COUNT = 51;
const INTERCOM_PAGE_COUNT = 5;
const PER_PAGE = 60;
const PROMISE_THROTTLE_RPS = 5;

const fetchDetailedConversation = (conversationId) => {
  return fetch(`${INTERCOM_API}/conversations/${conversationId}`, {
    method: 'GET',
    headers:{
      'Accept': 'application/json',
      'Authorization': `Bearer ${INTERCOM_AUTH_TOKEN}`
    }
  }).then(response => response.json())
  .then (json => {
    let tagList = json.tags.tags;
    let hasTheTag = false;
    if (tagList.length > 0) {
      let matchingTags = tagList.filter(t => t.id === TAG_TO_MATCH);
      hasTheTag = matchingTags.length > 0;
    }

    if (hasTheTag) {
      return json;
    } else {
      return null;
    }
  }).catch((err) => {
    console.error(err);
  });
};

const fetchAllDetailedConversations = (idList) => {
  let allConversations = [];

  for (i = 0; i <= idList.length; i++) {
    let promiseThrottle = new PromiseThrottle({
      requestsPerSecond: PROMISE_THROTTLE_RPS,
      promiseImplementation: Promise
    });
    allConversations.push(promiseThrottle.add(fetchDetailedConversation.bind(this, idList[i])));
  }

  return Promise.all(allConversations)
    .then(function(conversationList) {
      return conversationList;
    }).catch((err) => {
      console.error(err);
    });
}

const fetchConversationList = (pageNumber) => {
  return fetch(`${INTERCOM_API}/conversations?per_page=${PER_PAGE}&page=${pageNumber}`, {
    method: 'GET',
    headers:{
      'Accept': 'application/json',
      'Authorization': `Bearer ${INTERCOM_AUTH_TOKEN}`
    }
  }).then(response => response.json())
  .then (json => {
    let conversationIds = json.conversations.map(c => c.id);
    return conversationIds;
  }).catch((err) => {
    console.error(err);
  });
};

const fetchAllConversationIds = () => {
  let allConversations = [];

  for (i = 1; i <= INTERCOM_PAGE_COUNT; i++) {
    let promiseThrottle = new PromiseThrottle({
      requestsPerSecond: PROMISE_THROTTLE_RPS,
      promiseImplementation: Promise
    });
    allConversations.push(promiseThrottle.add(fetchConversationList.bind(this, i)));
  }

  return Promise.all(allConversations)
    .then(function(idList) {
      return idList;
    }).catch((err) => {
      console.error(err);
    });
}

const begin = async () => {
  let idList = await fetchAllConversationIds();
  let flattenedIdList = [].concat(...idList);
  console.log(JSON.stringify(flattenedIdList, null, 4));

  let conversationList = await fetchAllDetailedConversations(flattenedIdList);
  let detailedConversations = conversationList.filter(c => c !== null);
  console.log(JSON.stringify(detailedConversations, null, 4));
}

begin();
