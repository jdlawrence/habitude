"use strict";
var pg = require('pg');
var bodyParser = require('body-parser');
var config = require('./config.js');
var databaseURL = config.databaseURL;

module.exports = function(app){

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended:false}));

  //========================================================//
  //   Database Queries                                     //
  //========================================================//
  // ALLOWS USER TO SIGNUP
  app.post('/api/signup', function(req, res){
    var user = req.body.username;
    var password = req.body.password;
    pg.connect(databaseURL, function(err, client, done){
      var query = client.query('INSERT INTO users(username, password) VALUES ($1, $2)', [user, password]);
      done();
      var rows = [];
      if(err){
        return console.error('error inserting user', err);
      }
      query.on('row', function(row) {
        rows.push(row);
        
      });
      query.on('end', function(result) {
        console.log('User has been added');
        client.end();
      });

    });
  }); 


  // USER CREATES A NEW HABIT and adds to the habits table and users_habits junction table
  // and the updates table
  app.post('/api/habits', function(req, res){
    var habit = req.body.habit;
    //*********************** NOTE: 'category' is currently hardcoded to be 'health'
    var category = req.body.category;


    // UNCOMMENT THE LINE BELOW AND ADD THE USER FROM YOUR TEST DATABASE HERE
    // var user = 'R Kelly'; 

    var user = 'rkelly'; 

    pg.connect(databaseURL, function(err, client, done){

      // Currently we only post habits for user number 1: Later we will add multiple users
      // var query = client.query("INSERT INTO habits (user_id, habit) VALUES ($1, $2)", [1, habit]);
      var habitIDQuery = "(SELECT DISTINCT habits.habit_id FROM habits " + 
       "WHERE habits.habit = '" + habit + "')"; 

      var userIDQuery = "(SELECT DISTINCT users.user_id FROM users " + 
       "WHERE users.username = '" + user + "')"; 

    var habitsQuery = client.query("INSERT INTO habits(habit, category) VALUES ( '" + habit + "', '" + category + "'); " +
                                   "INSERT INTO users_habits (user_id, habit_id) VALUES (" + userIDQuery + ", " + habitIDQuery + "); " +
                                   "INSERT INTO updates (habit_id, update_time) " + 
                                   "VALUES (" + habitIDQuery + " , current_timestamp);");

    done();
      // Array to hold values returned from database
      
      var rows = []; 
      if (err) {
        return console.error('error running query', err);
      }
      habitsQuery.on('row', function(row) {
        rows.push(row);
      });
      habitsQuery.on('end', function(result) {
        client.end();
        return res.json(rows);
      });
    });
  });

  // GET USER UPDATES TIMES AND FREQUENCY 
  app.get('/api/updateHabit', function(req, res){
    // Returns a JSON object with all habits and a count of how many times they occur
    // Example: [{"habit":"trapping","count":"2"},{"habit":"biking","count":"9"}]
    // CURL COMMAND: curl -i localhost:3000/api/updateHabit
    pg.connect(databaseURL, function(err, client, done){
      var query = client.query("SELECT habits.habit, count(updates.habit_id) " + 
       "FROM habits " + 
       "INNER JOIN updates " + 
       "ON habits.habit_id = updates.habit_id " + 
       "INNER JOIN users_habits " +
       "ON habits.habit_id = users_habits.habit_id " +
       "INNER JOIN users " +
       "ON users_habits.user_id = users.user_id " +
       "WHERE users.username = 'rkelly' " + 
       "GROUP BY habits.habit ");
      var rows = [];
      if (err) {
        return console.error('error running query', err);
      }
      query.on('row', function(row) {
        rows.push(row);
      });
      query.on('end', function(result) {
        client.end();
        return res.json(rows);
      });
    });
  });

  // USER UPDATES HABITS
  app.post('/api/updateHabit', function(req, res){
    var habit = req.body.habit;
    pg.connect(databaseURL, function(err, client, done){
      // Posts an update to the 'updates' table where the habit_id matches that of the input habit string
      // CURL COMMAND: curl -X POST -d "habit='biking'" localhost:3000/api/updateHabit
      // will update the 'biking' habit

      var getIDQuery = "(SELECT DISTINCT habits.habit_id FROM habits " + 
       "WHERE habits.habit = '" + habit + "')";
    var query = client.query("INSERT INTO updates (habit_id) " +
     "VALUES (" + getIDQuery + ")");
    done();
    var rows = [];
    if (err) {
      return console.error('error running query', err);
    }
    query.on('row', function(row) {
     rows.push(row);
   });
    query.on('end', function(result) {
      client.end();
      return res.json(rows);
    });
  });
  });

  // var deleteHabit = function(req, res) {
    app.delete('/api/deleteHabit', function(req, res){  
      var habit = req.body.habit;
      pg.connect(databaseURL, function(err, client, done){
        var getIDQuery = "(SELECT DISTINCT habits.habit_id FROM habits " + 
         "WHERE habits.habit = '" + habit + "')";
        var query = client.query(" DELETE FROM updates WHERE habit_id = " + getIDQuery + "; " + 
        "DELETE FROM users_habits WHERE habit_id = " + getIDQuery + "; " +
        "DELETE FROM habits WHERE habit_id = " + getIDQuery + "; ");
        done();
        var rows = [];

        if(err){
          return console.error('error inserting user', err);
        }

        query.on('row', function(row) {
          rows.push(row);
        });
        query.on('end', function(result) {
          client.end();
          return res.json(rows);
        });

      });
    });


//VY AND GLENNs DB request for name and location
  app.get('/api/nameAndLoc', function(req, res) {
    pg.connect(databaseURL, function (err, client, done){      
      var query = client.query("SELECT location,username FROM users WHERE user_id = 1;");
      var rows = []; 
      if (err) {
        return console.error('error running query', err);
      }
      query.on('row', function(row) {
        rows.push(row);
      });

      query.on('end', function(result) {
        client.end();
        return res.json(rows);
      });
    });
  });


  // SHOWS ACTIVITY FEED FROM OTHER USERS IN THE SAME CATEGORY
  app.get('/api/activityFeed', function (req, res){
    var user = 'rkelly';
    pg.connect(databaseURL, function (err, client, done){

      var getCategories = "(SELECT DISTINCT habits.category "+
        "FROM habits "+
        "INNER JOIN users_habits "+
        "ON habits.habit_id = users_habits.habit_id "+
        "INNER JOIN users "+
        "ON users_habits.user_id = users.user_id where users.username = '"+ user + "')";

      var query = client.query("SELECT * FROM ( " +
        "SELECT DISTINCT users.username, habits.habit, habits.category, updates.update_time, habits.habit_id, " +
        "row_number() OVER (PARTITION BY users.username ORDER BY updates.update_time DESC) AS row " +
        "FROM habits " +
        "INNER JOIN users_habits " +
        "ON habits.habit_id = users_habits.habit_id " +
        "INNER JOIN users " +
        "ON users_habits.user_id = users.user_id " +
        "INNER JOIN updates " +
        "ON habits.habit_id = updates.habit_id " +
        "WHERE users.username <> '"+ user +"' " +
        "AND category IN (" + getCategories + ")" +
        ") AS query_with_rows " +
        "WHERE row <= 2;");


      done();
      var rows = []; 
      if (err) {
        return console.error('error running query', err);
      }
      query.on('row', function(row) {
        rows.push(row);
      });

      query.on('end', function(result) {
        client.end();
        return res.json(rows);
      });
    });
  });
// VY and GLENN request for give kudos/increment the update's kudos_count
// hardcoded for update with update_id = 1
  app.put('/api/giveKudos', function(req, res){
    pg.connect(databaseURL, function(err, client, done){
      var query = client.query('UPDATE updates SET kudos_count = kudos_count + 1 WHERE update_id = 1;');
      done();
      var rows = [];
      if(err){
        return console.error('error incrementing', err);
      }
      query.on('row', function(row) {
        rows.push(row);
        
      });
      query.on('end', function(result) {
        console.log('Kudos has been given...thumb up');
        client.end();
      });

    });
  }); 


// ******************DB TEST CODE***************************
    // app.get('/api/dbtestTablesExist', function(req, res) {

    //   pg.connect(databaseURL, function(err, client, done){
    //     var query = client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_schema,table_name;");
    //     var rows = []; 
    //     if (err) {
    //       return console.error('error running query', err);
    //     }
    //     query.on('row', function(row) {
    //       rows.push(row);
    //     });

    //     query.on('end', function(result) {
    //       client.end();
    //       return res.json(rows);
    //     });
    //   });
    // });

  //*************** CURRENTLY NOT USED *********************
  // SHOWS USER PROFILE
  // app.get('/api/profile', function(req, res){
  //   pg.connect(databaseURL, function(err, client, done){
  //     var query = client.query('SELECT * from users');
  //     var rows = []; // Array to hold values returned from database
  //     if (err) {
  //       return console.error('error running query', err);
  //     }
  //     query.on('row', function(row) {
  //       rows.push(row);
  //     });
  //     query.on('end', function(result) {
  //       client.end();
  //       return res.json(rows);    
  //     });   
  //   });
  // });
 //  // SHOWS EXISTING USER HABITS
 //  app.get('/api/habits', function(req, res){
 //   pg.connect(databaseURL, function(err, client, done){
 //    var query = client.query('SELECT user_id, habit from habits');
 //    var rows = []; // Array to hold values returned from database
    
 //    if (err) {
 //      return console.error('error running query', err);
 //    }
 //    query.on('row', function(row) {
 //      rows.push(row);
 //    });
 //    query.on('end', function(result) {
 //      client.end();
 //      return res.json(rows);


 //    });
 //  }); 
 // });

};
