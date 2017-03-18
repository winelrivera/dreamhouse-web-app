var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var fileUpload = require('express-fileupload');
var pg = require('pg');

var app = express();

app.use(express.static('www'));
app.use(express.static(path.join('www', 'build')));

app.use(fileUpload());
app.use(bodyParser.json());

var dreamhouseEinsteinVisionUrl = process.env.EINSTEIN_VISION_URL;

var connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/dreamhouse';

if (process.env.DATABASE_URL !== undefined) {
  pg.defaults.ssl = true;
}

var client = new pg.Client(connectionString);
client.connect();

var propertyTable = 'property__c';
var favoriteTable = 'favorite__c';
var brokerTable = 'broker__c';

// setup the demo data if needed
client.query('SELECT * FROM salesforce.broker__c', function(error, data) {
  if (error !== null) {
    client.query('SELECT * FROM broker__c', function(error, data) {
      if (error !== null) {
        console.log('Loading Demo Data...');
        require('./db/demo.js')(client);
        console.log('Done Loading Demo Data!');
      }
    });
  }
  else {
    var schema = 'salesforce.';
    propertyTable = schema + 'property__c';
    favoriteTable = schema + 'favorite__c';
    brokerTable = schema + 'broker__c';
  }
});

function getAllProperties(callback) {
  client.query('SELECT * FROM ' + propertyTable, function(error, data) {
    callback(data.rows);
  });
}

var propertiesWithProbabilities = [];

// get the property style for each property from the Dreamhouse Einstein Vision service
getAllProperties(function(properties) {
  propertiesWithProbabilities = properties;

  propertiesWithProbabilities.forEach(function(property) {
    var url = dreamhouseEinsteinVisionUrl + "/predict-from-url?sampleLocation=" + property.picture__c;

    require('request').post({url: url}, function (err, httpResponse, body) {
      try {
        var json = JSON.parse(body);
        property.probabilities = json.probabilities;
      }
      catch (error) {
        property.probabilities = [];
      }
    });
  });
});


app.get('/property', function(req, res) {
  getAllProperties(function(properties) {
    res.json(properties);
  });
});

app.get('/property/:id', function(req, res) {
  client.query('SELECT ' + propertyTable + '.*, ' + brokerTable + '.sfid AS broker__c_sfid, ' + brokerTable + '.name AS broker__c_name, ' + brokerTable + '.email__c AS broker__c_email__c, ' + brokerTable + '.phone__c AS broker__c_phone__c, ' + brokerTable + '.mobile_phone__c AS broker__c_mobile_phone__c, ' + brokerTable + '.title__c AS broker__c_title__c, ' + brokerTable + '.picture__c AS broker__c_picture__c FROM ' + propertyTable + ' INNER JOIN ' + brokerTable + ' ON ' + propertyTable + '.broker__c = ' + brokerTable + '.sfid WHERE ' + propertyTable + '.sfid = $1', [req.params.id], function(error, data) {
    res.json(data.rows[0]);
  });
});


app.get('/favorite', function(req, res) {
  client.query('SELECT ' + propertyTable + '.*, ' + favoriteTable + '.sfid AS favorite__c_sfid FROM ' + propertyTable + ', ' + favoriteTable + ' WHERE ' + propertyTable + '.sfid = ' + favoriteTable + '.property__c', function(error, data) {
    res.json(data.rows);
  });
});

app.post('/favorite', function(req, res) {
  client.query('INSERT INTO ' + favoriteTable + ' (property__c) VALUES ($1)', [req.body.property__c], function(error, data) {
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

app.post('/search', function(req, res) {
  var url = dreamhouseEinsteinVisionUrl + "/predict";

  var formData = {
    filename: req.files.image.name,
    sampleContent: {
      value: req.files.image.data,
      options: {
        filename: req.files.image.name,
        contentType: req.files.image.mimetype
      }
    }
  };

  require('request').post({url: url, formData: formData}, function(err, httpResponse, body) {
    if (err) {
      console.err(err);
      res.send(err);
    }
    else {
      var json = JSON.parse(body);

      // find the properties that most closely match the predictions
      var predictionsWithScores = propertiesWithProbabilities.map(function(property) {
        var score = property.probabilities.reduce(function(acc, val) {

          var propertyProbability = val.probability;
          var uploadProbability = json.probabilities.find(function(probability) { return probability.label == val.label }).probability;

          return acc + Math.pow(propertyProbability + uploadProbability, 2);
        }, 0);
        property.score = score;

        return property;
      });

      predictionsWithScores.sort(function(a, b) {
        if (a.score > b.score) {
          return -1;
        }else if (a.score < b.score) {
          return 1;
        } else {
          return 0;
        }
      });

      res.send(predictionsWithScores.slice(0, 5));
    }
  });
});

var port = process.env.PORT || 8200;

app.listen(port);

console.log('Listening at: http://localhost:' + port);
