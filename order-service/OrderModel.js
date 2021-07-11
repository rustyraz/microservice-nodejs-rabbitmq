const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    products:[
        {
            productId: String
        }
    ],
    userEmail: String,
    totalPrice: Number,
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

module.exports = Order = mongoose.model('order', OrderSchema);