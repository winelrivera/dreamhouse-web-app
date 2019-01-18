var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');

var app = express();

app.use(express.static('www'));
app.use(express.static(path.join('www', 'build')));

app.use(bodyParser.json());


var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/dreamhouse';

if (process.env.DATABASE_URL !== undefined) {
  pg.defaults.ssl = true;
}

var client = new pg.Client(connectionString);
client.connect();

var propertyTable = 'property__c';
var favoriteTable = 'favorite__c';
var brokerTable = 'broker__c';

var user__c = 'c1';

// setup the demo data if needed
/*client.query('SELECT * FROM salesforce.broker__c', function(error, data) {
  if (error !== null) {
    client.query('SELECT * FROM broker__c', function(error, data) {
      if (error !== null) {
        console.log('Loading Demo Data...');
        require('./db/demo.js')(client);
       console.log('Done Loading Demo Data!');
     }
    });
  }
 else {*/
    var schema = 'salesforce.';
    propertyTable = schema + 'property__c';
    favoriteTable = schema + 'favorite__c';
    brokerTable = schema + 'broker__c';

    // become the user with the least favorites
console.log('aqui va el log  ------------------------------------------------------> ' +schema);
    client.query('SELECT user__c, COUNT(property__c) FROM salesforce.favorite__c GROUP BY user__c', function(error, data) {
      if(user__c != null){
      user__c = data.rows.reduce(function(prev, current) {
        return (prev.count < current.count) ? prev : current;
      } }).user__c;
      console.log('aqui va el log  ------------------------------------------------------> '+user__c);
    });
 // }
//});



app.get('/property', function(req, res) {
  client.query('SELECT * FROM ' + propertyTable, function(error, data) {
    res.json(data.rows);
  });
});

app.get('/property/:id', function(req, res) {
  client.query('SELECT ' + propertyTable + '.*, ' + brokerTable + '.sfid AS broker__c_sfid, ' + brokerTable + '.name AS broker__c_name, ' + brokerTable + '.email__c AS broker__c_email__c, ' + brokerTable + '.phone__c AS broker__c_phone__c, ' + brokerTable + '.mobile_phone__c AS broker__c_mobile_phone__c, ' + brokerTable + '.title__c AS broker__c_title__c, ' + brokerTable + '.picture__c AS broker__c_picture__c FROM ' + propertyTable + ' INNER JOIN ' + brokerTable + ' ON ' + propertyTable + '.broker__c = ' + brokerTable + '.sfid WHERE ' + propertyTable + '.sfid = $1', [req.params.id], function(error, data) {
    res.json(data.rows[0]);
  });
});


app.get('/favorite-all', function(req, res) {
  client.query('SELECT ' + propertyTable + '.*, ' + favoriteTable + '.sfid AS favorite__c_sfid, ' + favoriteTable + '.user__c AS favorite__c_user__c FROM ' + propertyTable + ', ' + favoriteTable + ' WHERE ' + propertyTable + '.sfid = ' + favoriteTable + '.property__c', function(error, data) {
    res.json(data.rows);
  });
});

app.get('/favorite', function(req, res) {
  client.query('SELECT ' + propertyTable + '.*, ' + favoriteTable + '.sfid AS favorite__c_sfid, ' + favoriteTable + '.user__c AS favorite__c_user__c FROM ' + propertyTable + ', ' + favoriteTable + ' WHERE ' + propertyTable + '.sfid = ' + favoriteTable + '.property__c AND ' + favoriteTable + '.user__c = $1', [user__c], function(error, data) {
    res.json(data.rows);
  });
});

app.post('/favorite', function(req, res) {
  client.query('INSERT INTO ' + favoriteTable + ' (property__c, user__c) VALUES ($1, $2)', [req.body.property__c, user__c], function(error, data) {
    res.json(data);
  });
});

app.delete('/favorite/:sfid', function(req, res) {
  client.query('DELETE FROM ' + favoriteTable + ' WHERE sfid = $1', [req.params.sfid], function(error, data) {
    res.json(data);
  });
});


app.get('/broker', function(req, res) {
  client.query('SELECT * FROM ' + brokerTable, function(error, data) {
    res.json(data.rows);
  });
});

app.get('/broker/:sfid', function(req, res) {
  client.query('SELECT * FROM ' + brokerTable + ' WHERE sfid = $1', [req.params.sfid], function(error, data) {
    res.json(data.rows[0]);
  });
});


app.get('/recommendations', function(req, res) {
  var url = process.env.PIO_ENGINE_URL + "/queries.json";

  var options = {
    uri: url,
    method: 'POST',
    json: {
      userId: user__c,
      numResults: 10
    }
  };

  require('request').post(options, function (error, response, body) {
    if (response.statusCode == 200) {
      client.query('SELECT * FROM ' + propertyTable, function (error, data) {
         var recommendations = Object.keys(body.propertyRatings).map(function(propertyId) {
          return data.rows.find(function(property) {
            return property.sfid == propertyId;
          });
         });

        // todo: exclude properties user already has favorited

        res.json(recommendations);
      });
    }
    else {
      console.log(`Failed to get recommendations for user = ${user__c} --- verify that the user has favorited a property and then relearn in PIO`);
      res.json([]);
    }
  });

});


var port = process.env.PORT || 8200;

app.listen(port);

console.log('Listening at: http://localhost:' + port);
