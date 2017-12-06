require('es6-promise').polyfill();
require('isomorphic-fetch');
require('dotenv').config();
const PromiseThrottle = require('promise-throttle');
const json2csv = require('json2csv');
const moment = require('moment');
const fs = require('fs');
const argv = require('yargs').argv;
const TAG_TO_MATCH = argv.tag;

const INTERCOM_API = process.env.INTERCOM_API;
const INTERCOM_AUTH_TOKEN = process.env.INTERCOM_AUTH_TOKEN;
const INTERCOM_PAGE_COUNT = 50;
const PER_PAGE = 60;
const PROMISE_THROTTLE_RPS = 6;

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

const validString = (str) => {
  return (str !== undefined &&
          str !== null &&
          str.trim() !== "" &&
          str.trim().length !== 0);
}

const extractData = (data, tag) => {
  // console.log(JSON.stringify(data, null, 4));
  let created_date = moment(data.created_at, "X"),
      updated_date = moment(data.updated_at, "X");

  let result = {
    id: data.id,
    createdAt: created_date.format("DD/MM/YYYY"),
    updatedAt: updated_date.format("DD/MM/YYYY"),
    weekNumber: updated_date.format("w"),
    body:  data.conversation_message.body + data.conversation_parts.conversation_parts.map(c => c.body).join(' | '),
    email: validString(data.conversation_message.subject),
    tags: tag.name,
    user: data.user.id
  };
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

    if (tagList.length > 0 && TAG_TO_MATCH !== undefined) {
      tagList = tagList.filter(t => t.id === `${TAG_TO_MATCH}`);
    }

    if (tagList.length > 0) {
      return tagList.map(t => extractData(json, t));
    } else {
      return null;
      // If you also want to export untagged conversations
      // return extractData(json, {name: 'NO TAG'});
    }
  }).catch((err, json) => {
    console.log(`FETCH - ERROR - Conversation ${conversationId}`);
    console.error(err);
  });
};

const fetchAllDetailedConversations = (idList) => {
  let allConversations = [];

  let promiseThrottle = new PromiseThrottle({
    requestsPerSecond: PROMISE_THROTTLE_RPS,
    promiseImplementation: Promise
  });

  for (i = 0; i <= idList.length; i++) {
    allConversations.push(promiseThrottle.add(fetchDetailedConversation.bind(this, idList[i])));
  }

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

  let promiseThrottle = new PromiseThrottle({
    requestsPerSecond: PROMISE_THROTTLE_RPS,
    promiseImplementation: Promise
  });

  for (i = 1; i <= INTERCOM_PAGE_COUNT; i++) {
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
  let flattenedConversationList = [].concat(...detailedConversations);
  console.log(JSON.stringify(flattenedConversationList, null, 4));

  generateCSV(flattenedConversationList);
};

begin();
