var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var express = require("express");
var ObjectId = require('mongodb').ObjectID;

// -------------
// CODE MONGO DB
// -------------
var resultats = [];

var url = 'mongodb://localhost:27017/test';

function testConnexion(callback) {
    MongoClient.connect(url, function (err, db) {
        if (err === null) {
            callback("Connexion réussie");
            db.close();
        }
        else {
            callback("Connexion échouée");
        }
    });
}

var findRestaurants = function (db, begin, size, callback) {
    resultats = [];

    var cursor = db.collection('restaurants').find({}).sort({borough: 1}).skip(begin).limit(size);
    var counter = 0;
    cursor.each(function (err, doc) {
        assert.equal(err, null);
        // too many to output all of them
        if (counter++ === 10) {
            callback();
        }
        if (doc !== null) {
            resultats.push(doc);
        } else {
            callback();
        }
    });
};

function getRestaurants(begin, size, callback) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        findRestaurants(db, begin, size, function () {
            // Ici on est sur que les resultats
            // sont prÃªts
            callback();
            db.close();
        });
    });
}

function deleteRestaurants(id, callback) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('restaurants').deleteOne({_id: ObjectId(id)}, function (err, result) {
            callback();
            db.close();
        });
    });
}

function createRestaurant(queryParameters, callback) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('restaurants').insertOne( {
            address : {
                street : "2 Avenue",
                zipcode : "10075",
                building : "1480",
                coord : [ 0, 0 ]
            },
            borough : "Albukerque",
            cuisine : queryParameters['cuisine'],
            grades : [
                {
                    date : new Date("2014-10-01T00:00:00Z"),
                    grade : "A",
                    score : 11
                },
                {
                    date : new Date("2014-01-16T00:00:00Z"),
                    grade : "B",
                    score : 17
                }
            ],
            name : queryParameters['name'],
            restaurant_id : "41704620"
        }, function(err, result) {
            callback();
            db.close();
        });
    });
}

function updateRestaurant(queryParameters, callback) {
    MongoClient.connect(url, function (err, db) {
        assert.equal(null, err);
        db.collection('restaurants').updateOne( {_id: ObjectId(queryParameters['id'])},  {
            cuisine : queryParameters['cuisine'],
            name : queryParameters['name']
        }, function(err, result) {
            callback();
            db.close();
        });
    });
}

// --------------------------
// CREATION SERVEUR + ROUTAGE
// --------------------------
var app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/restaurants.html');
});

app.get('/testConnexion', function (req, res) {
    testConnexion(function(resultatConnexion) {
        res.end(resultatConnexion);
    });
});

app.get('/findRestaurants', function (req, res) {
    var sizeResult = parseInt(req.query['size']);
    var beginResult = parseInt(req.query['begin']);
    getRestaurants(beginResult, sizeResult, function () {
        res.end(JSON.stringify(resultats));
    });

});

app.get('/deleteRestaurant', function (req, res) {
    var id = req.query['id'];
    deleteRestaurants(id, function(){
        res.end();
    });
});

app.get('/createRestaurant', function (req, res) {
    createRestaurant(req.query, function(){
        res.end();
    });
});

app.get('/updateRestaurant', function (req, res) {
    updateRestaurant(req.query, function(){
        res.end();
    });
});

app.listen(3000, function () {

    console.log("Server is listening on port 3000");
    console.log("Open http://localhost:3000 and upload some files!");

});