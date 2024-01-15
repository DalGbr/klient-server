const mysql = require('mysql');
const express = require('express');
const app = express();
app.use(express.static('public'));

app.use(function(request,response,next) {
  response.append("Access-Control-Allow-Origin","*");
  response.append("Access-Control-Allow-Methods","GET");
  response.append("Access-Control-Allow-Headers","Content-Type");
  response.append("Content-Type","application/json");
  response.header("Access-Control-Allow-Origin", "*"); 
  response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.listen(8080,function() {
  console.log("Server is running on http://localhost:8080");
});

const con = mysql.createConnection({
  host: "172.1.1.106",
  user: "teacher",
  password: "_PassFortestUser01",
  database: "stations"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});

app.get("/", function(request,response) {
  response.send("Hello, stranger!");
});

app.get('/regions', (req, res) => {
  con.query('SELECT DISTINCT stop_area FROM stops', (error, results, fields) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.json(results);
    }
  });
});

app.get('/regionStops', (req, res) => {
  con.query('SELECT DISTINCT stop_area, stop_name FROM stops', (error, results, fields) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.json(results);
    }
  });
});

app.get('/stop/:stopName/:stopArea', (req, res) => {
  const stopName = req.params.stopName;

  con.query(
    `SELECT DISTINCT stops.stop_name, stop_times.arrival_time, routes.route_short_name  
    FROM stations.stops
    INNER JOIN stop_times ON stops.stop_id = stop_times.stop_id 
    INNER JOIN trips ON stop_times.trip_id = trips.trip_id
    INNER JOIN routes ON trips.route_id = routes.route_id
    WHERE stops.stop_name = ? AND stops.stop_area = ?
    ORDER BY route_short_name, arrival_time ASC;`,
    [stopName, req.params.stopArea], 
    (error, results, fields) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.json(results);
      }
    }
  );
});

app.get('/stopNear/:pattern', (req, res) => {
  let pattern = req.params.pattern;
  let query = 'SELECT stop_lon, stop_lat, stop_area, stop_name FROM stations.stops WHERE stop_area LIKE ?';
  con.query(query, ['%' + pattern + '%'], (error, results, fields) => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.json(results);
    }
  });
});

app.get('/time/:busNum/:stopName', (req, res) => {
  const busNum = req.params.busNum;  
  const stopName = req.params.stopName;

  con.query(
    `SELECT DISTINCT stops.stop_name, stop_times.arrival_time, routes.route_short_name  
    FROM stations.stops
    INNER JOIN stop_times ON stops.stop_id = stop_times.stop_id 
    INNER JOIN trips ON stop_times.trip_id = trips.trip_id
    INNER JOIN routes ON trips.route_id = routes.route_id
    WHERE stops.stop_name = ? and routes.route_short_name = ?
    ORDER BY route_short_name, arrival_time ASC;`,
    [stopName, busNum], 
    (error, results, fields) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.json(results);
      }
    }
  );
});

