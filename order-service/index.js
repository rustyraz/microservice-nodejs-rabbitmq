const express = require('express');
const mongoose = require('mongoose');
const amqp = require('amqplib');
const Order = require('./OrderModel');
const isAuthenticated = require('./isAuthenticated');

const app = express();
const mongoDBConnectionUrl = 'mongodb://localhost:27019/eshop-order-service';
const PORT = process.env.PORT || 5052;
app.use(express.json());
//app.use(cors());

mongoose.connect(
    mongoDBConnectionUrl,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    },
    () => {
        console.log(`Eshop-order-service connected to Database`);
    }
);

let channel, connection;
async function connect(){    
    const amqpServer = 'amqp://localhost:5673';
    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("ORDER");    
}

connect().then(() => {
    console.log('AMQP connection established');
    channel.consume('ORDER',(data) => {
            console.log('Consuming ORDER Queue');
            let { products, userEmail } = JSON.parse(data.content);
            const newOrder = createOrder(products, userEmail);
            console.log(newOrder)
            channel.ack(data);
            channel.sendToQueue(
                'PRODUCT',
                Buffer.from(JSON.stringify({ newOrder }))
            );
        }
    );
}).catch((error) => {
    console.error(error);
    throw error;
});

function createOrder(products, userEmail){
    const totalPrice = products.reduce((total, current)=> {
        return total += current.price
    }, 0);

    const newOrder = new Order({
        products,
        totalPrice,
        userEmail
    });
    newOrder.save();
    return newOrder;
}

app.get('/', (req, res) => {
    return res.send('E-Shop order service running here.')
});

app.get('/orders', isAuthenticated, async (req, res) => {
    const orders = await Order.find();
    return res.json(orders);
});

app.get('/orders/:id', async (req, res) => {
    const id = req.params.id;
    const order = await Order.findById(id);
    if(!order){
        return res.status(404).send('Order with that ID is missing');
    }
    return res.json(order)
});

app.listen(PORT, () => {
    console.log(`Order service is running on port: ${PORT}`);
});