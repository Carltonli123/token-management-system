var mongoose = require("mongoose");

var tokenSchema = new mongoose.Schema({
    ShopperReference: String,
    Products: [String],
    token: String,
    firstEight: String,
    lastFour: String,
    expiryData: String,
    cardPaymentMethod: String,
    recurringProcessingModel: String,
    Schedules:[String]
});

const Token = mongoose.model('token-info', tokenSchema);

var shopperSchema = new mongoose.Schema({
    ShopperReference: String,
    token: [tokenSchema]
});

const Shopper = mongoose.model('shopper', shopperSchema);

module.exports = {Token, Shopper};