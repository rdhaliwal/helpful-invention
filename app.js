require('es6-promise').polyfill();
require('isomorphic-fetch');
require('dotenv').config();
const PromiseThrottle = require('promise-throttle');

const INTERCOM_API = process.env.INTERCOM_API;
const INTERCOM_AUTH_TOKEN = process.env.INTERCOM_AUTH_TOKEN;
// const INTERCOM_PAGE_COUNT = 51;
const INTERCOM_PAGE_COUNT = 5;
const PER_PAGE = 60;
const PROMISE_THROTTLE_RPS = 5;

const fetchSingleConversation = (conversationId) => {
  return fetch(`${INTERCOM_API}/conversations/${conversationId}`, {
    method: 'GET',
    headers:{
      'Accept': 'application/json',
      'Authorization': `Bearer ${INTERCOM_AUTH_TOKEN}`
    }
  }).then(response => response.json())
  .then (json => {
    let tagList = json.tags.tags;
    if (tagList.length === 0) {
      return null;
    } else {
      return json;
    }
  }).catch((err) => {
    console.error(err);
  });
};

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
  let allConversations = [],
      allConversationIds = [];

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

const scrapeIntercom = async () => {
  let idList = await fetchAllConversationIds();
  console.log(JSON.stringify(idList, null, 4));
}

scrapeIntercom();
