require('es6-promise').polyfill();
require('isomorphic-fetch');
require('dotenv').config();
const INTERCOM_API = process.env.INTERCOM_API;
const INTERCOM_AUTH_TOKEN = process.env.INTERCOM_AUTH_TOKEN;

const fetchTagList = (pageNumber) => {
  return fetch(`${INTERCOM_API}/tags`, {
    method: 'GET',
    headers:{
      'Accept': 'application/json',
      'Authorization': `Bearer ${INTERCOM_AUTH_TOKEN}`
    }
  }).then(response => response.json())
  .then (json => {
    return json.tags;
  }).catch((err) => {
    console.error(err);
  });
};

const begin = async () => {
  let tagList = await fetchTagList();
  console.log(JSON.stringify(tagList, null, 4));
}

begin();
