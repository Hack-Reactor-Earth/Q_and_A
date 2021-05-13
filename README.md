# Q_and_A API

The Q_and_A API is a service for the [Catwalk client](https://github.com/Linked-List-Legion/Catwalk) that serves up the questions and answers data for a given product

## Installation

- To get started you will have to clone this repository and <code>npm install</code>
- You will need to create or connect to a db.  This setup is designed around cassandra although you can modify it to use any db you prefer.
- To create the schema you can run <code>npm run build:schema</code> once connected to cassandra (db/index.js)
- If importing csv data in the shape that matches the tables you can do this now via cqlsh <your db connection location>
- Once you have imported csv data you can migrate it into the schema we set up with build:schema by running <code>npm run build:tables</code>
- once this is done (if you were importing data) you can now run <code>npm start</code> to run your server (it is set to run on <code>port: 5000</code>)

## Usage

- The Documentation for interacting with the endpoints can be found here:
https://documenter.getpostman.com/view/10971957/TzRUC7yA