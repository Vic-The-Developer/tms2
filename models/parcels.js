var mongoose = require('mongoose');

// Parcels Schema
var ParcelSchema = mongoose.Schema({

    customerId: {
        type: Number,
        required: false
    },
    iName: {
        type: String,
        required: false
    },
    routeFrom: {
        type: String,
        required: false
    },
    routeTo: {
        type: String,
        required: false
    },
    photo: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    },
    vehicle: {
        type: String,
        required: false
    },
    receiptId: {
        type: String,
        required: false
    },
    expense: {
        type: String,
        required: false
    },
    mailed: {
        type: String,
        required: false
    }
});

var Parcels = module.exports = mongoose.model('parcels', ParcelSchema);