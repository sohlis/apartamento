'use strict';

const request = require('request');
let cheerio = require('cheerio');
const R = require('ramda');

// Secrets stored in .env
require('dotenv').config();
const client = require('twilio')(process.env.ACCOUNTSID, process.env.AUTHTOKEN);

const options = {
    // Setup your search in craigslist to your liking
    url: 'http://sfbay.craigslist.org/search/apa?query=-special+-%22Brand+new%22+-zipcar+-furnished&srchType=T&hasPic=1&search_distance=5&postal=94133&min_price=2000&max_price=4400&bedrooms=1&bathrooms=1&availabilityMode=0'
};

const callback = (error, response, body) => {
  if (!error && response.statusCode == 200) {

    // This tells cheerio to convert our body string into jQuery style parsable things
    let $ = cheerio.load(body);

    // Initialize empty array to store our fun datums
    let listingDataArr = []

    // Iterate through every different .result-info instance in the DOM
    for (var i = 0; i < $('.result-info').length; i++) {
      let tempArr = []

      // Title
      // This gets the title associated with each posting
      tempArr.push(R.prop(`${i}`, $('.result-title')).children[0].data)

      // URL
      // This very confusing line gets the links associated with each posting
      tempArr.push(`http://sfbay.craigslist.org` + R.prop(`${i}`, $('.result-title')).children[0].parent.attribs.href)

      // Price
      tempArr.push(R.prop(`${i}`, $('.result-price')).children[0].data)

      // Time
      // Grab the time, casually, using the <time datetime> attribute
      tempArr.push(R.prop(`${i}`, $('.result-date')).attribs.datetime)

      // Location
      // Check that the location itself is there first, and then
      // add it to the array
      if (R.prop(`${i}`,$('.result-hood')) !== undefined) {
        tempArr.push(R.prop(`${i}`,$('.result-hood')).children[0].data)
      }  else {
        tempArr.push('')
      }

      // Store it
      // Add all of these to a new Array which will store this combined data
      listingDataArr.push(tempArr);
    }

    // timeRange is the distance from last posts to current time
    // 15819421 is about 5 hours behind now
    // Beware, this is last updated time, not first posting
    // Also BEWARE: this way of doing it is very brittle and will break shit
    // TODO: Construct a function that is more human readable
    //       for timeRange
    const timeRange = 1819421;

    // She stores all our postings in the given time
    let timeRangeArr = []

    // Take all our listing data, see the posting time and compare to time range
    // For listings that meet the criteria, add them to our new timeRangeArr
    listingDataArr.map(x => {
      if (dateCompare(x[3], timeRange)) {
        timeRangeArr.push(x);
      }
    });

    // Text it
    // For every entry in timeRangeArr we are going to send a text using twilio
    timeRangeArr.map((x) => {
      textMe(process.env.MYPHONENUMBER, process.env.TWILIOPHONENUMBER, x);
    })
  }
}

request(options, callback);

// dateCompare takes a given date and a range and compares Now and date
// and returns bool
const dateCompare = (date, range) => {
    return Math.abs(Date.now() - Date.parse(date)) < range;
}

// textMe uses Twilio to text you the results
const textMe = (myNumber, twilioNumber, x) => {
  client.messages.create({
      to: myNumber,
      from: twilioNumber,
      body: x[0] + ` ` + x[1],
  }, function(err, message) {
      console.log(`- ` + message.body);
  });
}
