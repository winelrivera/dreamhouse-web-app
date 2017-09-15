DreamHouse Web App
------------------

This sample app is a mobile web app for [DreamHouse](https://dreamhouse-site.herokuapp.com/) that runs on Heroku and optionally uses Heroku Connect to get data from Salesforce.  Check out a demo:

[![Demo](http://img.youtube.com/vi/sSoUGkqveMo/0.jpg)](http://www.youtube.com/watch?v=sSoUGkqveMo)

This app is built with Ionic and Node.js so you can easily run it locally and on Heroku.

Run on Heroku:

1. [![Deploy on Heroku](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/dreamhouseapp/dreamhouse-web-app#kafka)
1. [Install the Heroku CLI](https://devcenter.heroku.com/articles/heroku-command-line)
1. Install the Heroku CLI Kafka Plugin

        heroku plugins:install heroku-kafka

1. Create a Kafka topic:

        heroku kafka:topics:create interactions -a HEROKU_APP_NAME

1. Check out the app: `http://HEROKU_APP_NAME.herokuapp.com`
1. Check out the events as you view properties in the web app:

        heroku kafka:topics:tail interactions -a HEROKU_APP_NAME

Run Locally:

1. [Install Node.js](https://nodejs.org/en/)
1. [Install gulp](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)
1. Fetch the NPM dependencies: `npm install`
1. Get the Kafka environment variables from a Heroku app:

        heroku config -s -a APP_NAME > .env
        set -o allexport
        source .env
        set +o allexport

1. Start the app: `gulp serve`
1. Check out the app: [http://localhost:8200/](http://localhost:8200/)

Use Heroku Connect:

1. [Signup for a Salesforce Developer Org](https://developer.salesforce.com/signup)
1. [Install the DreamHouse package into the org](https://dreamhouse-site.herokuapp.com/installation/)
1. [Add the Heroku Connect Addon to your Heroku app](https://elements.heroku.com/addons/herokuconnect)
1. Setup Heroku Connect by clicking on *Heroku Connect* in the Resources tab of the app's management dashboard: `https://dashboard.heroku.com/apps/YOUR_APP_NAME/resources`
1. Add mappings for `Property__c`, `Broker__c`, and `Favorite__c` each with real-time bi-direction sync.  Select all of the `__c` fields EXCEPT the `*_IMG__c` ones.
1. Restart the app so the new database tables are used
1. Check out the app and verify that sync works by changing a property's price in Salesforce
