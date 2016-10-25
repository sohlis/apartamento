const request = require('request');
const cheerio = require('cheerio');
const R = require('ramda');

const options = {
    url: 'http://sfbay.craigslist.org/search/apa?search_distance=5&postal=94133&min_price=2000&max_price=4400&bedrooms=1&bathrooms=1&availabilityMode=0'
};

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    // This tells cherio to convert our body string into jQuery style parsable things
    $ = cheerio.load(body);

    // Initialize empty array to store our fun datums
    let listingDataArr = []

    for (var i = 0; i < $('.pl a').length; i++) {
    // for (var i = 0; i < 2; i++) { // i < 1 is for testing reasons only
      let tempArr = []

      // Title
      // This gets the title associated with each posting
      tempArr.push(R.map(R.prop('data'), $('.pl > a')[i].children)[0])

      // URL
      // This very confusing line gets the links associated with each posting
      tempArr.push('http://sfbay.craigslist.org' + R.prop('href', $('.pl > a')[i].attribs));

      // Price
      // Working right to left: the first $(".price") entry contains an object with
      // the property 'children' which contains the property data that holds the
      // price. So i am using nested R.prop to achieve this.
      tempArr.push(R.prop('data', R.prop('children', $(".price")[i])[0]));

      // Time
      // Grab the time, casually, using the <time datetime> attribute
      tempArr.push($("time")[i].attribs.datetime)

      // Location
      // What an embaressingly long one! This basically takes the location in
      // perens and removes (them) and returns just a nice location name
      // tempArr.push($(".pnr small")[i].children[0].data.split('(')[1].split(')')[0]);

      // Store it
      // Add all of these to a new Array which will store this combined data
      listingDataArr.push(tempArr);
    }

    // timeRange is the distance from last posts to current time
    // 15819421 is about 5 hours behind now
    // Beware, this is last updated time, not first posting
    // TODO: figure out post date
    const timeRange = 7819421;

    // She stores all our postings in the given time
    let timeRangeArr = []

    // Take all our listing data, see the posting time and compare to time range
    // For listings that meet the criteria, add them to our new timeRangeArr
    listingDataArr.map(x => {
      if (dateCompare(x[3], timeRange)) {
        timeRangeArr.push(x);
      }
    });

    // Log flume
    console.log(timeRangeArr);
    console.log(timeRangeArr.length);
  }
}

request(options, callback);

function dateCompare(date, range) {
  if (Math.abs(Date.parse(date) - Date.now()) < range) {
    return true
  }
  else {
    return false
  }
}
