exports.moreoverTestDoc1 = {
     "sequenceId": "360762894174",
     "id": "18725910771",
     "language": "English",
     "title": "hello",
     "content": "hello",
     "tags": "",
     "publishedDate": "2014-08-24T10:40:56Z",
     "harvestDate": "2014-08-24T12:00:06Z",
     "originalUrl": "http://929wlmi.com/news/articles/2014/aug/24/quake-of-60-magnitude-registered-in-california/",
     "duplicateGroupId": 1024,
     "media": "",
     "topics": {
      "topic": [
       {
        "name": "US news",
        "group": "Regional"
       },
       {
        "name": "San Francisco Bay Area news",
        "group": "US regional"
       },
       {
        "name": "Natural disasters news",
        "group": "Science"
       }
      ]
     },
     "source": {
      "name": "92.9 WLMI",
      "homeUrl": "http://www.929wlmi.com",
      },
};

exports.moreoverTestExpectedDoc1 = {
 "id": "18725910771",
 "sequenceId": "360762894174",
 "title": "hello",
 "content": "hello",
 "published": "2014-08-24T10:40:56Z",
 "harvested": "2014-08-24T12:00:06Z",
 "url": "http://929wlmi.com/news/articles/2014/aug/24/quake-of-60-magnitude-registered-in-california/",
 "duplicateGroupId": 1024,
 "source": "http://www.929wlmi.com",
 "host": "www.929wlmi.com",
 "topics": {
  "groups": {
   "Regional": true,
   "US regional": true,
   "Science": true
  },
  "names": {
   "US news": true,
   "San Francisco Bay Area news": true,
   "Natural disasters news": true
  }
 }
};
