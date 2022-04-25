var mongoose = require('mongoose');

var travellerSchema = mongoose.Schema({

    customerID: {
        type: Number,
        required: false
    },
    from: {
        type: String,
        required: false
    },
    to: {
        type: String,
        required: false
    },
    arrival: {
        type: String,
        required: false
    },
    ticketNumber: {
        type: String,
        required: false
    },
    status: {
        type: String,
        required: false
    },
    paid: {
        type: String,
        required: false
    }

})


var Travellers = module.exports = mongoose.model('travellers', travellerSchema);