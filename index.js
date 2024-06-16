var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mongoose = require("mongoose");
var {Token, Shopper} = require("./models/token");
const { CLIENT_RENEG_LIMIT } = require('tls');
const { log } = require('console');
var app = express();

app.use(bodyParser.json());

//connect to MongoDB
var mongoDB = 'mongodb://127.0.0.1:27017/tokenmanagementsystem';
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });


// set the view engine to ejs
app.set('views',path.join(__dirname,'views'))
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page
app.get('/', function (req, res) {
    Shopper.find({}, function (err, shoppers) {
        if (err) {
             console.log(err);
        } else {
             console.log(shoppers);
             res.render('index', {shoppers:shoppers});
        }
    });
    
});

//receive webhooks
app.post('/webhook', (req,res) => {
    // console.log("webhook received: ", req.body.notificationItems[0]);
    console.log(Object.keys(req.body.notificationItems[0].NotificationRequestItem.additionalData));
    if (req.body.notificationItems[0].NotificationRequestItem.additionalData.hasOwnProperty('recurring.recurringDetailReference')){
         console.log("this is a recurring payment");
        var token = new Object();
        console.log(Object.keys(req.body.notificationItems[0].NotificationRequestItem.additionalData));
        token.ShopperReference = req.body.notificationItems[0].NotificationRequestItem.additionalData['recurring.shopperReference'];
        token.Products = [];
        token.token = req.body.notificationItems[0].NotificationRequestItem.additionalData['recurring.recurringDetailReference'];
        token.firstEight = req.body.notificationItems[0].NotificationRequestItem.additionalData['issuerBin'];
        token.lastFour = req.body.notificationItems[0].NotificationRequestItem.additionalData['cardSummary'];
        token.expiryData = req.body.notificationItems[0].NotificationRequestItem.additionalData['expiryDate'];
        token.cardPaymentMethod = req.body.notificationItems[0].NotificationRequestItem.additionalData['cardPaymentMethod'];
        token.recurringProcessingModel = req.body.notificationItems[0].NotificationRequestItem.additionalData['recurringProcessingModel'];
        //create token
        Token.create(token, function(err,token){
            if(err){
                console.log(err);
            }{
                console.log(token);
            }
        })
        //create shopper
        var shopper = new Object();
        Shopper.findOne({ ShopperReference: token.ShopperReference}, function(err,docs){
            if(err){
                console.log(err)
            }else{
                console.log("found doc with this shopper reference");
                if(docs == null){
                    shopper.ShopperReference = token.ShopperReference;
                    shopper.token = token;
                    Shopper.create(shopper,function(err,shopper){
                        if (err) {
                            console.log(err);
                        } {
                            console.log(shopper);
                        }
                    })
                }else{

                    console.log('found the shopper')
                    console.log(docs);
                    docs.token.push(token);
                    docs.save();

                }
            }
        })

    }else{
        console.log("this is a normal payment");
    }
    res.status(200).send('[accepted]');
});

app.get("/schedule/:id", function(req,res){
    console.log("below is the incoming token id");
    console.log(req.params.id)
    Token.findOne({ token: req.params.id }, function(err, token){

        if(err){
            console.log(err);
        }else{
            console.log(token);
            res.render('schedule',{token:token})
        }

    })
})

app.post("/updateschedule", function(req,res){
    console.log(req.body);
    req.body.schedules.forEach(showDates);
    function showDates(item, index){
        console.log(item)
    }

    Shopper.findOne({ ShopperReference: req.body.shopperreference }, function(err, shopper){
        if(err){
            console.log(err);
        }else{
            console.log(shopper);
            for(let i = 0; i < shopper.token.length ; i++){
                if (shopper.token[i].token == req.body.token){
                    req.body.schedules.forEach(addItem);
                    function addItem(item, index) {
                        shopper.token[i].Schedules.push(item);
                    }
                    
                }
            }
            shopper.save();
        }
    })

    // Token.findOne({ token: req.body.token }, function (err, token) {

    //     if (err) {
    //         console.log(err);
    //     } else {
    //         console.log(token);
    //         req.body.schedules.forEach(addItem);
    //         function addItem(item, index) {
    //             token.Schedules.push(item);
    //             token.save();
    //         }
            
    //     }

    // })
    
    res.send({
        "status":"Okay"
    })

})

app.listen(7777);
console.log('Server is listening on port 7777');